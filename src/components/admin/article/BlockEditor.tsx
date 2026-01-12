import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  GripVertical, Plus, Trash2, Type, Image, Video, AlertTriangle, 
  ShoppingBag, Table, HelpCircle, ChevronDown, ChevronUp 
} from 'lucide-react';
import { ArticleBlock } from '@/types/article';

interface BlockEditorProps {
  blocks: Partial<ArticleBlock>[];
  onChange: (blocks: Partial<ArticleBlock>[]) => void;
  availableProductIds: string[];
}

const BLOCK_TYPES = [
  { type: 'text', icon: Type, label: 'Rich Text' },
  { type: 'image', icon: Image, label: 'Image' },
  { type: 'video', icon: Video, label: 'YouTube Video' },
  { type: 'callout', icon: AlertTriangle, label: 'Callout' },
  { type: 'product_card', icon: ShoppingBag, label: 'Product Cards' },
  { type: 'comparison', icon: Table, label: 'Comparison Table' },
  { type: 'faq', icon: HelpCircle, label: 'FAQ Accordion' },
];

export const BlockEditor = ({ blocks, onChange, availableProductIds }: BlockEditorProps) => {
  const [expandedBlocks, setExpandedBlocks] = useState<Set<number>>(new Set([0]));
  
  const toggleExpand = (index: number) => {
    const newExpanded = new Set(expandedBlocks);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedBlocks(newExpanded);
  };
  
  const addBlock = (type: string) => {
    const newBlock: Partial<ArticleBlock> = {
      block_type: type as ArticleBlock['block_type'],
      content: getDefaultContent(type),
      display_order: blocks.length,
    };
    onChange([...blocks, newBlock]);
    setExpandedBlocks(new Set([...expandedBlocks, blocks.length]));
  };
  
  const updateBlock = (index: number, updates: Partial<ArticleBlock>) => {
    const newBlocks = [...blocks];
    newBlocks[index] = { ...newBlocks[index], ...updates };
    onChange(newBlocks);
  };
  
  const updateBlockContent = (index: number, contentUpdates: Record<string, unknown>) => {
    const newBlocks = [...blocks];
    newBlocks[index] = { 
      ...newBlocks[index], 
      content: { ...newBlocks[index].content, ...contentUpdates } 
    };
    onChange(newBlocks);
  };
  
  const removeBlock = (index: number) => {
    onChange(blocks.filter((_, i) => i !== index));
  };
  
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(blocks);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    
    onChange(items.map((block, i) => ({ ...block, display_order: i })));
  };
  
  const getDefaultContent = (type: string): Record<string, unknown> => {
    switch (type) {
      case 'text':
        return { html_en: '', html_ar: '' };
      case 'image':
        return { url: '', alt: '', caption: '', caption_ar: '' };
      case 'video':
        return { youtube_id: '', title: '' };
      case 'callout':
        return { type: 'info', title: '', title_ar: '', text: '', text_ar: '' };
      case 'product_card':
        return { product_ids: [] };
      case 'comparison':
        return { headers: ['Feature', 'Option A', 'Option B'], rows: [['', '', '']] };
      case 'faq':
        return { items: [{ question: '', question_ar: '', answer: '', answer_ar: '' }] };
      default:
        return {};
    }
  };
  
  const renderBlockEditor = (block: Partial<ArticleBlock>, index: number) => {
    const content = block.content || {};
    
    switch (block.block_type) {
      case 'text':
        return (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Content (English) - HTML supported</Label>
              <Textarea
                value={String(content.html_en || '')}
                onChange={(e) => updateBlockContent(index, { html_en: e.target.value })}
                placeholder="<p>Your content here...</p>"
                className="min-h-[150px] font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label>Content (Arabic) - HTML supported</Label>
              <Textarea
                value={String(content.html_ar || '')}
                onChange={(e) => updateBlockContent(index, { html_ar: e.target.value })}
                placeholder="<p>المحتوى هنا...</p>"
                className="min-h-[150px] font-mono text-sm"
                dir="rtl"
              />
            </div>
          </div>
        );
      
      case 'image':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input
                  value={String(content.url || '')}
                  onChange={(e) => updateBlockContent(index, { url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>Alt Text (required for SEO)</Label>
                <Input
                  value={String(content.alt || '')}
                  onChange={(e) => updateBlockContent(index, { alt: e.target.value })}
                  placeholder="Descriptive alt text"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Caption (English)</Label>
                <Input
                  value={String(content.caption || '')}
                  onChange={(e) => updateBlockContent(index, { caption: e.target.value })}
                  placeholder="Image caption"
                />
              </div>
              <div className="space-y-2">
                <Label>Caption (Arabic)</Label>
                <Input
                  value={String(content.caption_ar || '')}
                  onChange={(e) => updateBlockContent(index, { caption_ar: e.target.value })}
                  placeholder="تعليق الصورة"
                  dir="rtl"
                />
              </div>
            </div>
            {content.url && (
              <div className="p-2 bg-muted/50 rounded-lg">
                <img src={String(content.url)} alt={String(content.alt || '')} className="max-h-32 mx-auto rounded" />
              </div>
            )}
          </div>
        );
      
      case 'video':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>YouTube Video ID</Label>
                <Input
                  value={String(content.youtube_id || '')}
                  onChange={(e) => updateBlockContent(index, { youtube_id: e.target.value })}
                  placeholder="dQw4w9WgXcQ"
                />
                <p className="text-xs text-muted-foreground">
                  The ID from youtube.com/watch?v=<strong>THIS_PART</strong>
                </p>
              </div>
              <div className="space-y-2">
                <Label>Video Title</Label>
                <Input
                  value={String(content.title || '')}
                  onChange={(e) => updateBlockContent(index, { title: e.target.value })}
                  placeholder="Video title for accessibility"
                />
              </div>
            </div>
          </div>
        );
      
      case 'callout':
        return (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Callout Type</Label>
              <Select
                value={String(content.type || 'info')}
                onValueChange={(value) => updateBlockContent(index, { type: value })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info (Blue)</SelectItem>
                  <SelectItem value="warning">Warning (Yellow)</SelectItem>
                  <SelectItem value="success">Success (Green)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Title (English)</Label>
                <Input
                  value={String(content.title || '')}
                  onChange={(e) => updateBlockContent(index, { title: e.target.value })}
                  placeholder="Important Notice"
                />
              </div>
              <div className="space-y-2">
                <Label>Title (Arabic)</Label>
                <Input
                  value={String(content.title_ar || '')}
                  onChange={(e) => updateBlockContent(index, { title_ar: e.target.value })}
                  placeholder="ملاحظة مهمة"
                  dir="rtl"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Text (English)</Label>
                <Textarea
                  value={String(content.text || '')}
                  onChange={(e) => updateBlockContent(index, { text: e.target.value })}
                  placeholder="Callout message..."
                />
              </div>
              <div className="space-y-2">
                <Label>Text (Arabic)</Label>
                <Textarea
                  value={String(content.text_ar || '')}
                  onChange={(e) => updateBlockContent(index, { text_ar: e.target.value })}
                  placeholder="رسالة التنبيه..."
                  dir="rtl"
                />
              </div>
            </div>
          </div>
        );
      
      case 'product_card':
        const selectedProducts = (content.product_ids as string[]) || [];
        return (
          <div className="space-y-3">
            <Label>Select Products to Display (max 6)</Label>
            <div className="flex flex-wrap gap-2">
              {availableProductIds.map(productId => (
                <Button
                  key={productId}
                  type="button"
                  variant={selectedProducts.includes(productId) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    if (selectedProducts.includes(productId)) {
                      updateBlockContent(index, { 
                        product_ids: selectedProducts.filter(id => id !== productId) 
                      });
                    } else if (selectedProducts.length < 6) {
                      updateBlockContent(index, { 
                        product_ids: [...selectedProducts, productId] 
                      });
                    }
                  }}
                  disabled={!selectedProducts.includes(productId) && selectedProducts.length >= 6}
                >
                  {productId.slice(0, 8)}...
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedProducts.length}/6 products selected
            </p>
          </div>
        );
      
      case 'comparison':
        const headers = (content.headers as string[]) || ['Feature', 'Option A', 'Option B'];
        const rows = (content.rows as string[][]) || [['', '', '']];
        
        return (
          <div className="space-y-3">
            <Label>Comparison Table</Label>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {headers.map((header, i) => (
                      <th key={i} className="p-1">
                        <Input
                          value={header}
                          onChange={(e) => {
                            const newHeaders = [...headers];
                            newHeaders[i] = e.target.value;
                            updateBlockContent(index, { headers: newHeaders });
                          }}
                          className="text-sm"
                        />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="p-1">
                          <Input
                            value={cell}
                            onChange={(e) => {
                              const newRows = rows.map((r, ri) => 
                                ri === rowIndex 
                                  ? r.map((c, ci) => ci === cellIndex ? e.target.value : c)
                                  : r
                              );
                              updateBlockContent(index, { rows: newRows });
                            }}
                            className="text-sm"
                          />
                        </td>
                      ))}
                      <td className="p-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            updateBlockContent(index, { rows: rows.filter((_, i) => i !== rowIndex) });
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                updateBlockContent(index, { 
                  rows: [...rows, Array(headers.length).fill('')] 
                });
              }}
            >
              <Plus className="w-4 h-4 mr-1" /> Add Row
            </Button>
          </div>
        );
      
      case 'faq':
        const items = (content.items as { question: string; question_ar?: string; answer: string; answer_ar?: string }[]) || [];
        
        return (
          <div className="space-y-3">
            <Label>FAQ Items</Label>
            {items.map((item, itemIndex) => (
              <Card key={itemIndex} className="p-3">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <Label className="text-xs">Question #{itemIndex + 1}</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        updateBlockContent(index, { 
                          items: items.filter((_, i) => i !== itemIndex) 
                        });
                      }}
                    >
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={item.question}
                      onChange={(e) => {
                        const newItems = items.map((it, i) => 
                          i === itemIndex ? { ...it, question: e.target.value } : it
                        );
                        updateBlockContent(index, { items: newItems });
                      }}
                      placeholder="Question (English)"
                      className="text-sm"
                    />
                    <Input
                      value={item.question_ar || ''}
                      onChange={(e) => {
                        const newItems = items.map((it, i) => 
                          i === itemIndex ? { ...it, question_ar: e.target.value } : it
                        );
                        updateBlockContent(index, { items: newItems });
                      }}
                      placeholder="السؤال (عربي)"
                      className="text-sm"
                      dir="rtl"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Textarea
                      value={item.answer}
                      onChange={(e) => {
                        const newItems = items.map((it, i) => 
                          i === itemIndex ? { ...it, answer: e.target.value } : it
                        );
                        updateBlockContent(index, { items: newItems });
                      }}
                      placeholder="Answer (English)"
                      className="text-sm min-h-[60px]"
                    />
                    <Textarea
                      value={item.answer_ar || ''}
                      onChange={(e) => {
                        const newItems = items.map((it, i) => 
                          i === itemIndex ? { ...it, answer_ar: e.target.value } : it
                        );
                        updateBlockContent(index, { items: newItems });
                      }}
                      placeholder="الجواب (عربي)"
                      className="text-sm min-h-[60px]"
                      dir="rtl"
                    />
                  </div>
                </div>
              </Card>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                updateBlockContent(index, { 
                  items: [...items, { question: '', question_ar: '', answer: '', answer_ar: '' }] 
                });
              }}
            >
              <Plus className="w-4 h-4 mr-1" /> Add FAQ Item
            </Button>
          </div>
        );
      
      default:
        return <p className="text-muted-foreground">Unknown block type</p>;
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Content Blocks</h3>
        <div className="flex gap-2 flex-wrap">
          {BLOCK_TYPES.map(({ type, icon: Icon, label }) => (
            <Button
              key={type}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addBlock(type)}
              className="gap-1"
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </Button>
          ))}
        </div>
      </div>
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="blocks">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
              {blocks.map((block, index) => {
                const blockType = BLOCK_TYPES.find(t => t.type === block.block_type);
                const Icon = blockType?.icon || Type;
                const isExpanded = expandedBlocks.has(index);
                
                return (
                  <Draggable key={index} draggableId={String(index)} index={index}>
                    {(provided, snapshot) => (
                      <Card
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`${snapshot.isDragging ? 'shadow-lg ring-2 ring-primary' : ''}`}
                      >
                        <div 
                          className="flex items-center gap-2 p-3 border-b border-border/50 cursor-pointer hover:bg-muted/50"
                          onClick={() => toggleExpand(index)}
                        >
                          <div {...provided.dragHandleProps} onClick={(e) => e.stopPropagation()}>
                            <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab" />
                          </div>
                          <Icon className="w-4 h-4 text-primary" />
                          <span className="font-medium flex-1">{blockType?.label || block.block_type}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeBlock(index);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        {isExpanded && (
                          <CardContent className="pt-4">
                            {renderBlockEditor(block, index)}
                          </CardContent>
                        )}
                      </Card>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      
      {blocks.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
          <p className="text-muted-foreground mb-2">No content blocks yet</p>
          <p className="text-sm text-muted-foreground">Click a block type above to add content</p>
        </div>
      )}
    </div>
  );
};
