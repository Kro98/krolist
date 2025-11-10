import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Megaphone, Sparkles, Shield, FileText, Mail, Edit2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { useAdminRole } from "@/hooks/useAdminRole";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NewsItem {
  id: string;
  title_en: string;
  title_ar: string | null;
  content_en: string;
  content_ar: string | null;
  published_at: string;
  category: string;
  is_published: boolean;
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
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { isAdmin } = useAdminRole();
  const { toast } = useToast();
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const [editForm, setEditForm] = useState({
    title_en: "",
    title_ar: "",
    content_en: "",
    content_ar: "",
    category: "",
  });

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const { data, error } = await supabase
        .from('news_updates')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false });

      if (error) throw error;
      setNewsItems(data || []);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (item: NewsItem) => {
    setEditingNews(item);
    setEditForm({
      title_en: item.title_en,
      title_ar: item.title_ar || "",
      content_en: item.content_en,
      content_ar: item.content_ar || "",
      category: item.category,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingNews) return;

    try {
      const { error } = await supabase
        .from('news_updates')
        .update({
          title_en: editForm.title_en,
          title_ar: editForm.title_ar || null,
          content_en: editForm.content_en,
          content_ar: editForm.content_ar || null,
          category: editForm.category,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingNews.id);

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: t('news.updateSuccess'),
      });

      setEditingNews(null);
      fetchNews();
    } catch (error) {
      console.error('Error updating news:', error);
      toast({
        title: t('common.error'),
        description: t('news.updateError'),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
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
        {isLoading ? (
          <div className="text-center text-muted-foreground">{t('loading')}</div>
        ) : (
          <div className="space-y-6">
            {newsItems.map((item) => (
              <Card key={item.id} className="p-6 hover:shadow-lg transition-all">
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
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(item.published_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}</span>
                      </div>
                      {isAdmin && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditClick(item)}
                          className="gap-2"
                        >
                          <Edit2 className="h-4 w-4" />
                          {t('common.edit')}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <h2 className="text-2xl font-semibold">
                    {language === 'ar' && item.title_ar ? item.title_ar : item.title_en}
                  </h2>

                  <Separator />

                  {/* Content */}
                  <p className="text-muted-foreground leading-relaxed">
                    {language === 'ar' && item.content_ar ? item.content_ar : item.content_en}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Future Plans Section */}
        <Card className="mt-8 p-6 bg-gradient-to-br from-primary/5 to-background border-2 border-primary/20">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">What's Next?</h2>
            </div>
            <Separator />
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Integration with more Saudi stores (Shein, IKEA, Namshi, Trendyol, ASOS)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Price history tracking and alerts</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>User accounts and saved product lists</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Advanced filtering and sorting options</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Mobile app for iOS and Android</span>
              </li>
            </ul>
          </div>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingNews} onOpenChange={() => setEditingNews(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('news.editNews')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title_en">{t('news.titleEnglish')}</Label>
              <Input
                id="title_en"
                value={editForm.title_en}
                onChange={(e) => setEditForm({ ...editForm, title_en: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title_ar">{t('news.titleArabic')}</Label>
              <Input
                id="title_ar"
                value={editForm.title_ar}
                onChange={(e) => setEditForm({ ...editForm, title_ar: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content_en">{t('news.contentEnglish')}</Label>
              <Textarea
                id="content_en"
                value={editForm.content_en}
                onChange={(e) => setEditForm({ ...editForm, content_en: e.target.value })}
                rows={5}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content_ar">{t('news.contentArabic')}</Label>
              <Textarea
                id="content_ar"
                value={editForm.content_ar}
                onChange={(e) => setEditForm({ ...editForm, content_ar: e.target.value })}
                rows={5}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">{t('news.category')}</Label>
              <Input
                id="category"
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingNews(null)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSaveEdit}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
