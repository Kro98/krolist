import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Megaphone, Sparkles, Shield, FileText, Mail, Edit2, Edit } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdminRole } from "@/hooks/useAdminRole";
import { toast } from "sonner";

interface PageContent {
  content_en: string;
  content_ar: string | null;
}
interface NewsItem {
  id: string;
  title_en: string;
  title_ar: string | null;
  content_en: string;
  content_ar: string | null;
  published_at: string;
  category: "announcement" | "update" | "feature";
}
const getCategoryIcon = (category: string) => {
  switch (category) {
    case "announcement":
      return <Megaphone className="h-4 w-4" />;
    case "feature":
      return <Sparkles className="h-4 w-4" />;
    case "update":
      return <Calendar className="h-4 w-4" />;
    default:
      return <Calendar className="h-4 w-4" />;
  }
};
const getCategoryColor = (category: string) => {
  switch (category) {
    case "announcement":
      return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30";
    case "feature":
      return "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30";
    case "update":
      return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30";
    default:
      return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/30";
  }
};
export default function NewsUpdates() {
  const {
    t,
    language
  } = useLanguage();
  const navigate = useNavigate();
  const {
    isAdmin
  } = useAdminRole();
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [whatsNewContent, setWhatsNewContent] = useState<PageContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Inline editing states
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingWhatsNew, setEditingWhatsNew] = useState(false);
  const [editForm, setEditForm] = useState({
    title_en: '',
    title_ar: '',
    content_en: '',
    content_ar: '',
    category: 'announcement' as 'announcement' | 'update' | 'feature'
  });
  const [whatsNewForm, setWhatsNewForm] = useState({
    content_en: '',
    content_ar: ''
  });
  useEffect(() => {
    fetchNews();
    fetchWhatsNewContent();
  }, []);

  const fetchNews = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('news_updates').select('*').eq('is_published', true).order('published_at', {
        ascending: false
      });
      if (error) throw error;
      setNewsItems((data || []) as NewsItem[]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load news');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWhatsNewContent = async () => {
    try {
      const { data, error } = await supabase
        .from('page_content')
        .select('content_en, content_ar')
        .eq('page_key', 'news_whats_new')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      setWhatsNewContent(data);
    } catch (error: any) {
      console.error('Failed to load What\'s New content:', error);
    }
  };
  const handleEditClick = (item: NewsItem) => {
    setEditingItemId(item.id);
    setEditForm({
      title_en: item.title_en,
      title_ar: item.title_ar || '',
      content_en: item.content_en,
      content_ar: item.content_ar || '',
      category: item.category
    });
  };

  const handleSaveEdit = async () => {
    if (!editingItemId) return;
    try {
      const { error } = await supabase
        .from('news_updates')
        .update({
          title_en: editForm.title_en,
          title_ar: editForm.title_ar || null,
          content_en: editForm.content_en,
          content_ar: editForm.content_ar || null,
          category: editForm.category
        })
        .eq('id', editingItemId);

      if (error) throw error;
      toast.success('News updated successfully');
      setEditingItemId(null);
      fetchNews();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update news');
    }
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
  };

  const handleEditWhatsNew = () => {
    setEditingWhatsNew(true);
    setWhatsNewForm({
      content_en: whatsNewContent?.content_en || '',
      content_ar: whatsNewContent?.content_ar || ''
    });
  };

  const handleSaveWhatsNew = async () => {
    try {
      const { error } = await supabase
        .from('page_content')
        .update({
          content_en: whatsNewForm.content_en,
          content_ar: whatsNewForm.content_ar || null,
          updated_at: new Date().toISOString()
        })
        .eq('page_key', 'news_whats_new');

      if (error) throw error;
      toast.success('What\'s New updated successfully');
      setEditingWhatsNew(false);
      fetchWhatsNewContent();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update What\'s New');
    }
  };

  const handleCancelWhatsNew = () => {
    setEditingWhatsNew(false);
  };
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  return <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="bg-gradient-to-b from-primary/10 to-background border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-4 gap-4">
            <div className="flex items-center gap-3">
              <Megaphone className="h-8 w-8 text-primary" />
              <h1 className="text-4xl md:text-5xl font-bold">News & Updates</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/privacy-policy')} className="gap-2">
                <Shield className="h-4 w-4" />
                Privacy
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/terms-of-service')} className="gap-2">
                <FileText className="h-4 w-4" />
                Terms
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/contact-us')} className="gap-2">
                <Mail className="h-4 w-4" />
                Contact
              </Button>
            </div>
          </div>
          <p className="text-lg text-muted-foreground">
            Stay informed about new features, announcements, and platform updates
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {newsItems.map(item => {
            const isEditing = editingItemId === item.id;
            
            return (
              <Card key={item.id} className="p-6 hover:shadow-lg transition-all relative">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Badge className={`${getCategoryColor(item.category)} border`}>
                        <span className="flex items-center gap-1.5">
                          {getCategoryIcon(item.category)}
                          <span className="capitalize">{item.category}</span>
                        </span>
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(item.published_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}</span>
                      </div>
                      {isAdmin && !isEditing && (
                        <Button variant="ghost" size="sm" onClick={() => handleEditClick(item)} className="h-8 w-8 p-0">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Content - Editable or View Mode */}
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Title (English)</Label>
                        <Input
                          value={editForm.title_en}
                          onChange={(e) => setEditForm({ ...editForm, title_en: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Title (Arabic)</Label>
                        <Input
                          value={editForm.title_ar}
                          onChange={(e) => setEditForm({ ...editForm, title_ar: e.target.value })}
                          dir="rtl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Content (English)</Label>
                        <Textarea
                          value={editForm.content_en}
                          onChange={(e) => setEditForm({ ...editForm, content_en: e.target.value })}
                          className="min-h-[120px] resize-y"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Content (Arabic)</Label>
                        <Textarea
                          value={editForm.content_ar}
                          onChange={(e) => setEditForm({ ...editForm, content_ar: e.target.value })}
                          className="min-h-[120px] resize-y"
                          dir="rtl"
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button onClick={handleSaveEdit} size="sm" className="flex-1">
                          Save
                        </Button>
                        <Button onClick={handleCancelEdit} variant="outline" size="sm" className="flex-1">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-2xl font-semibold">
                        {language === 'ar' && item.title_ar ? item.title_ar : item.title_en}
                      </h2>
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                        {language === 'ar' && item.content_ar ? item.content_ar : item.content_en}
                      </p>
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* What's New Section */}
        {whatsNewContent && (
          <Card className="mt-8 p-6 bg-gradient-to-br from-primary/5 to-background border-2 border-primary/20 hover:shadow-lg transition-all duration-200">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold">
                    {language === 'ar' ? 'ما الجديد؟' : "What's New?"}
                  </h2>
                </div>
                {isAdmin && !editingWhatsNew && (
                  <Button variant="ghost" size="sm" onClick={handleEditWhatsNew}>
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Separator />
              
              {editingWhatsNew ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Content (English)</label>
                    <Textarea
                      value={whatsNewForm.content_en}
                      onChange={(e) => setWhatsNewForm({ ...whatsNewForm, content_en: e.target.value })}
                      className="mt-1 min-h-[120px] resize-y"
                      placeholder="Enter what's new content in English..."
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Content (Arabic)</label>
                    <Textarea
                      value={whatsNewForm.content_ar}
                      onChange={(e) => setWhatsNewForm({ ...whatsNewForm, content_ar: e.target.value })}
                      className="mt-1 min-h-[120px] resize-y"
                      dir="rtl"
                      placeholder="أدخل محتوى ما الجديد بالعربية..."
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleSaveWhatsNew} size="sm" className="flex-1">
                      Save
                    </Button>
                    <Button onClick={handleCancelWhatsNew} variant="outline" size="sm" className="flex-1">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {language === 'ar' && whatsNewContent.content_ar 
                    ? whatsNewContent.content_ar 
                    : whatsNewContent.content_en}
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

    </div>;
}