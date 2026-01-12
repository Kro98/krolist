import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, GripVertical, X, Plus, Link2 } from 'lucide-react';
import { useAdminArticles } from '@/hooks/useArticleAdmin';

interface RelatedArticlesSelectorProps {
  currentArticleId?: string;
  selectedArticleIds: string[];
  onChange: (articleIds: string[]) => void;
}

export const RelatedArticlesSelector = ({ 
  currentArticleId, 
  selectedArticleIds, 
  onChange 
}: RelatedArticlesSelectorProps) => {
  const { data: allArticles = [], isLoading } = useAdminArticles();
  const [searchQuery, setSearchQuery] = useState('');
  
  const availableArticles = allArticles.filter(a => 
    a.id !== currentArticleId &&
    !selectedArticleIds.includes(a.id) &&
    (a.title_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
     (a.category || '').toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const selectedArticles = selectedArticleIds
    .map(id => allArticles.find(a => a.id === id))
    .filter(Boolean);
  
  const addArticle = (articleId: string) => {
    if (selectedArticleIds.length < 6) {
      onChange([...selectedArticleIds, articleId]);
    }
  };
  
  const removeArticle = (articleId: string) => {
    onChange(selectedArticleIds.filter(id => id !== articleId));
  };
  
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(selectedArticleIds);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    
    onChange(items);
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Link2 className="w-5 h-5 text-primary" />
          Related Articles ({selectedArticleIds.length}/6)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selected articles with drag-drop */}
        {selectedArticleIds.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Selected Articles (drag to reorder)</p>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="related-articles">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                    {selectedArticles.map((article, index) => article && (
                      <Draggable key={article.id} draggableId={article.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`flex items-center gap-2 p-2 bg-muted/50 rounded-lg ${
                              snapshot.isDragging ? 'shadow-lg ring-2 ring-primary' : ''
                            }`}
                          >
                            <div {...provided.dragHandleProps}>
                              <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{article.title_en}</p>
                              <div className="flex items-center gap-2">
                                {article.category && (
                                  <Badge variant="outline" className="text-xs">{article.category}</Badge>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  /{article.slug}
                                </span>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => removeArticle(article.id)}
                            >
                              <X className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        )}
        
        {/* Search and add */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles to link..."
              className="pl-9"
            />
          </div>
          
          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground">Loading articles...</div>
          ) : (
            <div className="max-h-[200px] overflow-y-auto space-y-1">
              {availableArticles.slice(0, 10).map(article => (
                <div
                  key={article.id}
                  className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors"
                  onClick={() => addArticle(article.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{article.title_en}</p>
                    <div className="flex items-center gap-2">
                      {article.category && (
                        <Badge variant="outline" className="text-xs">{article.category}</Badge>
                      )}
                      <Badge variant={article.is_published ? 'default' : 'secondary'} className="text-xs">
                        {article.is_published ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-primary" />
                </div>
              ))}
              {availableArticles.length === 0 && (
                <p className="text-center py-4 text-muted-foreground">
                  {searchQuery ? 'No articles found' : 'No more articles available'}
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
