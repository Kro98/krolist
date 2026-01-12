import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, Search, Edit, Trash2, Eye, EyeOff, FileText, 
  Calendar, BarChart3, ArrowLeft, Loader2 
} from 'lucide-react';
import { toast } from 'sonner';
import { useAdminArticles, useDeleteArticle, useSaveArticle } from '@/hooks/useArticleAdmin';
import { useAdminRole } from '@/hooks/useAdminRole';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const ArticlesManager = () => {
  const navigate = useNavigate();
  const { isAdmin, isLoading: adminLoading } = useAdminRole();
  const { data: articles = [], isLoading, refetch } = useAdminArticles();
  const deleteArticle = useDeleteArticle();
  const saveArticle = useSaveArticle();
  
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredArticles = articles.filter(article =>
    article.title_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (article.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleDelete = async (id: string) => {
    try {
      await deleteArticle.mutateAsync(id);
      toast.success('Article deleted');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete');
    }
  };
  
  const togglePublish = async (article: any) => {
    try {
      await saveArticle.mutateAsync({
        id: article.id,
        is_published: !article.is_published,
        published_at: !article.is_published ? new Date().toISOString() : article.published_at,
      });
      toast.success(article.is_published ? 'Article unpublished' : 'Article published');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update');
    }
  };
  
  if (adminLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-destructive">Admin access required</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Articles Manager
              </h1>
              <p className="text-sm text-muted-foreground">
                {articles.length} article{articles.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <Button onClick={() => navigate('/admin/articles/new')}>
            <Plus className="w-4 h-4 mr-2" />
            New Article
          </Button>
        </div>
      </div>
      
      {/* Content */}
      <div className="container max-w-6xl mx-auto px-4 py-6">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search articles..."
            className="pl-10"
          />
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{articles.length}</p>
                <p className="text-xs text-muted-foreground">Total Articles</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Eye className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{articles.filter(a => a.is_published).length}</p>
                <p className="text-xs text-muted-foreground">Published</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <EyeOff className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{articles.filter(a => !a.is_published).length}</p>
                <p className="text-xs text-muted-foreground">Drafts</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <BarChart3 className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{articles.reduce((sum, a) => sum + (a.view_count || 0), 0)}</p>
                <p className="text-xs text-muted-foreground">Total Views</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Articles list */}
        {filteredArticles.length > 0 ? (
          <div className="space-y-3">
            {filteredArticles.map(article => (
              <Card key={article.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={article.is_published ? 'default' : 'secondary'}>
                          {article.is_published ? 'Published' : 'Draft'}
                        </Badge>
                        {article.category && (
                          <Badge variant="outline">{article.category}</Badge>
                        )}
                      </div>
                      <h3 
                        className="font-semibold text-lg truncate cursor-pointer hover:text-primary transition-colors"
                        onClick={() => navigate(`/admin/articles/${article.id}`)}
                      >
                        {article.title_en}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate mb-2">
                        /articles/{article.slug}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {article.created_at && formatDistanceToNow(new Date(article.created_at), { addSuffix: true })}
                        </span>
                        <span className="flex items-center gap-1">
                          <BarChart3 className="w-3 h-3" />
                          {article.view_count || 0} views
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => togglePublish(article)}
                        title={article.is_published ? 'Unpublish' : 'Publish'}
                      >
                        {article.is_published ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/admin/articles/${article.id}`)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete "{article.title_en}"?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(article.id)}
                              className="bg-destructive text-destructive-foreground"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No articles yet</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'No articles match your search' : 'Create your first article to get started'}
            </p>
            {!searchQuery && (
              <Button onClick={() => navigate('/admin/articles/new')}>
                <Plus className="w-4 h-4 mr-2" />
                Create Article
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ArticlesManager;
