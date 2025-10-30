import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Save, Search } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PageContent {
  id: string;
  page_key: string;
  content_en: string;
  content_ar: string | null;
  content_type: string;
  category: string | null;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
}

export default function ContentManager() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [contents, setContents] = useState<PageContent[]>([]);
  const [editedContents, setEditedContents] = useState<Map<string, PageContent>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    try {
      const { data, error } = await supabase
        .from('page_content')
        .select('*')
        .order('category', { ascending: true })
        .order('page_key', { ascending: true });

      if (error) throw error;
      setContents(data || []);
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleContentChange = (id: string, field: 'content_en' | 'content_ar', value: string) => {
    const content = contents.find(c => c.id === id);
    if (!content) return;

    const updated = { ...content, [field]: value };
    setEditedContents(new Map(editedContents.set(id, updated)));
  };

  const handleSaveAll = async () => {
    if (editedContents.size === 0) {
      toast({ title: t('admin.noChanges') });
      return;
    }

    setIsSaving(true);
    try {
      const updates = Array.from(editedContents.values()).map(content => ({
        id: content.id,
        content_en: content.content_en,
        content_ar: content.content_ar,
        updated_by: user?.id,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('page_content')
          .update({
            content_en: update.content_en,
            content_ar: update.content_ar,
            updated_by: update.updated_by,
          })
          .eq('id', update.id);

        if (error) throw error;
      }

      toast({ title: t('admin.contentSaved') });
      setEditedContents(new Map());
      fetchContents();
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const categories = Array.from(new Set(contents.map(c => c.category).filter(Boolean))) as string[];
  
  const filteredContents = contents.filter(content => {
    const matchesSearch = 
      content.page_key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      content.content_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (content.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || content.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const groupedContents = filteredContents.reduce((acc, content) => {
    const category = content.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(content);
    return acc;
  }, {} as Record<string, PageContent[]>);

  if (isLoading) {
    return <div>{t('loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('admin.contentManagement')}</h2>
          <p className="text-muted-foreground">{t('admin.contentManagementDesc')}</p>
        </div>
        <Button onClick={handleSaveAll} disabled={isSaving || editedContents.size === 0}>
          <Save className="h-4 w-4 mr-2" />
          {t('admin.saveAll')} {editedContents.size > 0 && `(${editedContents.size})`}
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('admin.searchContent')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList>
          <TabsTrigger value="all">{t('admin.allCategories')}</TabsTrigger>
          {categories.map(category => (
            <TabsTrigger key={category} value={category}>{category}</TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="space-y-4 mt-6">
          {Object.entries(groupedContents).map(([category, items]) => (
            <div key={category} className="space-y-4">
              <h3 className="text-lg font-semibold">{category}</h3>
              {items.map(content => {
                const edited = editedContents.get(content.id) || content;
                const hasChanges = editedContents.has(content.id);

                return (
                  <Card key={content.id} className={hasChanges ? 'border-primary' : ''}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base font-mono">{content.page_key}</CardTitle>
                          {content.description && (
                            <CardDescription>{content.description}</CardDescription>
                          )}
                        </div>
                        {hasChanges && (
                          <Badge variant="secondary">{t('admin.modified')}</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>{t('admin.englishText')}</Label>
                        <Textarea
                          value={edited.content_en}
                          onChange={(e) => handleContentChange(content.id, 'content_en', e.target.value)}
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label>{t('admin.arabicText')}</Label>
                        <Textarea
                          value={edited.content_ar || ''}
                          onChange={(e) => handleContentChange(content.id, 'content_ar', e.target.value)}
                          rows={3}
                          dir="rtl"
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ))}
        </TabsContent>
      </Tabs>

      {filteredContents.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {t('admin.noContentFound')}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
