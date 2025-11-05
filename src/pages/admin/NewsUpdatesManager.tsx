import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import { format } from 'date-fns';

interface NewsUpdate {
  id: string;
  title_en: string;
  title_ar: string | null;
  content_en: string;
  content_ar: string | null;
  category: 'announcement' | 'feature' | 'update';
  published_at: string;
  is_published: boolean;
  author_id: string | null;
  created_at: string;
  updated_at: string;
}

export default function NewsUpdatesManager() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [newsItems, setNewsItems] = useState<NewsUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsUpdate | null>(null);
  
  const [formData, setFormData] = useState<{
    title_en: string;
    title_ar: string;
    content_en: string;
    content_ar: string;
    category: 'announcement' | 'feature' | 'update';
    is_published: boolean;
  }>({
    title_en: '',
    title_ar: '',
    content_en: '',
    content_ar: '',
    category: 'announcement',
    is_published: false,
  });

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const { data, error } = await supabase
        .from('news_updates')
        .select('*')
        .order('published_at', { ascending: false });

      if (error) throw error;
      setNewsItems((data || []) as NewsUpdate[]);
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

  const handleOpenDialog = (news?: NewsUpdate) => {
    if (news) {
      setEditingNews(news);
      setFormData({
        title_en: news.title_en,
        title_ar: news.title_ar || '',
        content_en: news.content_en,
        content_ar: news.content_ar || '',
        category: news.category,
        is_published: news.is_published,
      });
    } else {
      setEditingNews(null);
      setFormData({
        title_en: '',
        title_ar: '',
        content_en: '',
        content_ar: '',
        category: 'announcement',
        is_published: false,
      });
    }
    setShowDialog(true);
  };

  const handleSave = async () => {
    const newsData = {
      title_en: formData.title_en,
      title_ar: formData.title_ar || null,
      content_en: formData.content_en,
      content_ar: formData.content_ar || null,
      category: formData.category,
      is_published: formData.is_published,
      author_id: user?.id || null,
    };

    try {
      if (editingNews) {
        const { error } = await supabase
          .from('news_updates')
          .update(newsData)
          .eq('id', editingNews.id);

        if (error) throw error;
        toast({ title: t('admin.newsUpdated') });
      } else {
        const { error } = await supabase
          .from('news_updates')
          .insert([newsData]);

        if (error) throw error;
        toast({ title: t('admin.newsAdded') });
      }

      setShowDialog(false);
      fetchNews();
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('admin.confirmDelete'))) return;

    try {
      const { error } = await supabase
        .from('news_updates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: t('admin.newsDeleted') });
      fetchNews();
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'announcement': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'feature': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'update': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  if (isLoading) {
    return <div>{t('loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('admin.newsUpdates')}</h2>
          <p className="text-muted-foreground">{t('admin.newsUpdatesDesc')}</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          {t('admin.addNews')}
        </Button>
      </div>

      <div className="grid gap-4">
        {newsItems.map((news) => (
          <Card key={news.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge className={getCategoryColor(news.category)}>
                      {news.category}
                    </Badge>
                    {!news.is_published && (
                      <Badge variant="outline">{t('admin.draft')}</Badge>
                    )}
                    {news.is_published && (
                      <Badge variant="secondary">
                        <Eye className="h-3 w-3 mr-1" />
                        {t('admin.published')}
                      </Badge>
                    )}
                  </div>
                  <CardTitle>{language === 'ar' && news.title_ar ? news.title_ar : news.title_en}</CardTitle>
                  <CardDescription>
                    {format(new Date(news.published_at), 'PPP')}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleOpenDialog(news)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleDelete(news.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">English Content:</p>
                  <p className="text-sm line-clamp-3">{news.content_en}</p>
                </div>
                {news.content_ar && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Arabic Content:</p>
                    <p className="text-sm line-clamp-3" dir="rtl">{news.content_ar}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingNews ? t('admin.editNews') : t('admin.addNews')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>{t('admin.titleEnglish')}</Label>
              <Input
                value={formData.title_en}
                onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                placeholder="English title"
              />
            </div>

            <div>
              <Label>{t('admin.titleArabic')}</Label>
              <Input
                value={formData.title_ar}
                onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                placeholder="العنوان بالعربية"
              />
            </div>

            <div>
              <Label>{t('admin.contentEnglish')}</Label>
              <Textarea
                value={formData.content_en}
                onChange={(e) => setFormData({ ...formData, content_en: e.target.value })}
                placeholder="English content"
                rows={5}
              />
            </div>

            <div>
              <Label>{t('admin.contentArabic')}</Label>
              <Textarea
                value={formData.content_ar}
                onChange={(e) => setFormData({ ...formData, content_ar: e.target.value })}
                placeholder="المحتوى بالعربية"
                rows={5}
              />
            </div>

            <div>
              <Label>{t('admin.category')}</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value: any) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="announcement">{t('news.announcement')}</SelectItem>
                  <SelectItem value="feature">{t('news.feature')}</SelectItem>
                  <SelectItem value="update">{t('news.update')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_published}
                onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
              />
              <Label>{t('admin.publishNow')}</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleSave}>{t('save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
