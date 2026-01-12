import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Eye, AlertTriangle, Info, CheckCircle, ExternalLink } from 'lucide-react';
import { Article, ArticleBlock } from '@/types/article';
import { formatPrice } from '@/lib/currencyConversion';

interface ArticleLivePreviewProps {
  article: Partial<Article>;
  blocks: Partial<ArticleBlock>[];
  products: { id: string; title: string; current_price: number; currency: string; image_url?: string; store: string }[];
}

export const ArticleLivePreview = ({ article, blocks, products }: ArticleLivePreviewProps) => {
  const renderBlock = (block: Partial<ArticleBlock>, index: number) => {
    const content = block.content || {};
    
    switch (block.block_type) {
      case 'text':
        return (
          <div 
            key={index}
            className="prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: String(content.html_en || '<p class="text-muted-foreground italic">Empty text block</p>') }}
          />
        );
      
      case 'image':
        return content.url ? (
          <figure key={index} className="my-4">
            <img
              src={String(content.url)}
              alt={String(content.alt || '')}
              className="w-full rounded-lg shadow max-h-48 object-contain bg-muted"
            />
            {content.caption && (
              <figcaption className="mt-1 text-center text-xs text-muted-foreground">
                {String(content.caption)}
              </figcaption>
            )}
          </figure>
        ) : (
          <div key={index} className="p-4 bg-muted/50 rounded-lg text-center text-muted-foreground text-sm">
            [Image placeholder]
          </div>
        );
      
      case 'video':
        return content.youtube_id ? (
          <div key={index} className="my-4 aspect-video rounded-lg overflow-hidden bg-muted">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${content.youtube_id}`}
              title={String(content.title || 'Video')}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div key={index} className="p-4 bg-muted/50 rounded-lg text-center text-muted-foreground text-sm">
            [Video placeholder - add YouTube ID]
          </div>
        );
      
      case 'callout':
        const calloutType = String(content.type || 'info');
        const CalloutIcon = calloutType === 'warning' ? AlertTriangle : calloutType === 'success' ? CheckCircle : Info;
        const calloutColors = {
          warning: 'bg-amber-500/10 border-amber-500/30 text-amber-600',
          success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600',
          info: 'bg-primary/10 border-primary/30 text-primary',
        };
        
        return (
          <div 
            key={index} 
            className={`my-4 p-3 rounded-lg border flex gap-2 ${calloutColors[calloutType as keyof typeof calloutColors] || calloutColors.info}`}
          >
            <CalloutIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              {content.title && <p className="font-semibold text-sm mb-0.5">{String(content.title)}</p>}
              <p className="text-xs opacity-90">{String(content.text || 'Callout message...')}</p>
            </div>
          </div>
        );
      
      case 'product_card':
        const productIds = (content.product_ids as string[]) || [];
        const blockProducts = productIds.map(id => products.find(p => p.id === id)).filter(Boolean);
        
        return (
          <div key={index} className="my-4 space-y-2">
            {blockProducts.length > 0 ? blockProducts.map(product => product && (
              <div key={product.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                {product.image_url && (
                  <img src={product.image_url} alt={product.title} className="w-12 h-12 object-contain rounded bg-white" />
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
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </div>
            )) : (
              <div className="p-4 bg-muted/50 rounded-lg text-center text-muted-foreground text-sm">
                [Product cards - select products]
              </div>
            )}
          </div>
        );
      
      case 'comparison':
        const headers = (content.headers as string[]) || ['Feature', 'A', 'B'];
        const rows = (content.rows as string[][]) || [];
        
        return (
          <div key={index} className="my-4 overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-muted/50">
                  {headers.map((header, i) => (
                    <th key={i} className="p-2 text-left font-semibold border-b border-border">
                      {header || '-'}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {row.map((cell, j) => (
                      <td key={j} className="p-2 text-muted-foreground">{cell || '-'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      
      case 'faq':
        const items = (content.items as { question: string; answer: string }[]) || [];
        
        return items.length > 0 ? (
          <Accordion key={index} type="single" collapsible className="my-4">
            {items.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border-border/50">
                <AccordionTrigger className="text-left text-sm hover:text-primary py-2">
                  {item.question || `Question ${i + 1}`}
                </AccordionTrigger>
                <AccordionContent className="text-xs text-muted-foreground">
                  {item.answer || 'Answer...'}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div key={index} className="p-4 bg-muted/50 rounded-lg text-center text-muted-foreground text-sm">
            [FAQ - add questions]
          </div>
        );
      
      default:
        return (
          <div key={index} className="p-4 bg-muted/50 rounded-lg text-center text-muted-foreground text-sm">
            [{block.block_type} block]
          </div>
        );
    }
  };
  
  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Eye className="w-5 h-5 text-primary" />
          Live Preview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border border-border rounded-lg overflow-hidden">
          {/* Hero preview */}
          <div 
            className="relative h-32 overflow-hidden"
            style={{ backgroundColor: article.hero_bg_color || '#000000' }}
          >
            {article.hero_use_image && article.hero_bg_image_url && (
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${article.hero_bg_image_url})`,
                  opacity: (article.hero_bg_opacity || 15) / 100,
                }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3">
              {article.category && (
                <Badge variant="secondary" className="mb-1 text-xs bg-primary/20 text-primary">
                  {article.category}
                </Badge>
              )}
              <h1 className="text-lg font-bold text-foreground leading-tight line-clamp-2">
                {article.title_en || 'Article Title'}
              </h1>
              {article.summary_en && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                  {article.summary_en}
                </p>
              )}
            </div>
          </div>
          
          {/* Content preview */}
          <div className="p-4 max-h-[500px] overflow-y-auto space-y-4">
            {blocks.length > 0 ? (
              blocks.map((block, index) => renderBlock(block, index))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">Add content blocks to see preview</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
