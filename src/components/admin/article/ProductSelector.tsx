import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, GripVertical, X, Plus, Package } from 'lucide-react';
import { useKrolistProducts } from '@/hooks/useArticleAdmin';
import { formatPrice } from '@/lib/currencyConversion';

interface ProductSelectorProps {
  selectedProductIds: string[];
  onChange: (productIds: string[]) => void;
}

export const ProductSelector = ({ selectedProductIds, onChange }: ProductSelectorProps) => {
  const { data: allProducts = [], isLoading } = useKrolistProducts();
  const [searchQuery, setSearchQuery] = useState('');
  
  const selectedProducts = selectedProductIds
    .map(id => allProducts.find(p => p.id === id))
    .filter(Boolean);
  
  const availableProducts = allProducts.filter(p => 
    !selectedProductIds.includes(p.id) &&
    (p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
     p.store.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const addProduct = (productId: string) => {
    if (selectedProductIds.length < 6) {
      onChange([...selectedProductIds, productId]);
    }
  };
  
  const removeProduct = (productId: string) => {
    onChange(selectedProductIds.filter(id => id !== productId));
  };
  
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(selectedProductIds);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    
    onChange(items);
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" />
          Article Products ({selectedProductIds.length}/6)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selected products with drag-drop */}
        {selectedProductIds.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Selected Products (drag to reorder)</p>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="selected-products">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                    {selectedProducts.map((product, index) => product && (
                      <Draggable key={product.id} draggableId={product.id} index={index}>
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
                            {product.image_url && (
                              <img 
                                src={product.image_url} 
                                alt={product.title}
                                className="w-10 h-10 object-contain rounded bg-white"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{product.title}</p>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">{product.store}</Badge>
                                <span className="text-xs text-primary font-semibold">
                                  {formatPrice(product.current_price, product.currency as any)}
                                </span>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => removeProduct(product.id)}
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
              placeholder="Search products to add..."
              className="pl-9"
            />
          </div>
          
          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground">Loading products...</div>
          ) : (
            <div className="max-h-[300px] overflow-y-auto space-y-1">
              {availableProducts.slice(0, 20).map(product => (
                <div
                  key={product.id}
                  className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors"
                  onClick={() => addProduct(product.id)}
                >
                  {product.image_url && (
                    <img 
                      src={product.image_url} 
                      alt={product.title}
                      className="w-8 h-8 object-contain rounded bg-white"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{product.title}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{product.store}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatPrice(product.current_price, product.currency as any)}
                      </span>
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-primary" />
                </div>
              ))}
              {availableProducts.length === 0 && searchQuery && (
                <p className="text-center py-4 text-muted-foreground">No products found</p>
              )}
              {availableProducts.length > 20 && (
                <p className="text-center py-2 text-xs text-muted-foreground">
                  Showing 20 of {availableProducts.length} products. Search to filter.
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
