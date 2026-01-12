import { ArticleBlock, ArticleProduct } from '@/types/article';
import { ArticleProductCard } from './ArticleProductCard';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ArticleContentBlocksProps {
  blocks: ArticleBlock[];
  products: ArticleProduct[];
  onProductClick?: (productId: string) => void;
  onViewHistory?: (productId: string) => void;
}

export const ArticleContentBlocks = ({ blocks, products, onProductClick, onViewHistory }: ArticleContentBlocksProps) => {
  const { language } = useLanguage();
  
  const renderBlock = (block: ArticleBlock) => {
    switch (block.block_type) {
      case 'text':
        return (
          <div 
            key={block.id}
            className="prose prose-neutral dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ 
              __html: language === 'ar' && block.content.html_ar 
                ? String(block.content.html_ar) 
                : String(block.content.html_en || '') 
            }}
          />
        );
      
      case 'image':
        return (
          <figure key={block.id} className="my-8">
            <img
              src={String(block.content.url)}
              alt={String(block.content.alt || '')}
              className="w-full rounded-lg shadow-lg"
              loading="lazy"
            />
            {block.content.caption && (
              <figcaption className="mt-2 text-center text-sm text-muted-foreground">
                {language === 'ar' && block.content.caption_ar 
                  ? String(block.content.caption_ar) 
                  : String(block.content.caption)}
              </figcaption>
            )}
          </figure>
        );
      
      case 'video':
        return (
          <div key={block.id} className="my-8 aspect-video rounded-lg overflow-hidden shadow-lg">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${block.content.youtube_id}`}
              title={String(block.content.title || 'Video')}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </div>
        );
      
      case 'callout':
        const calloutType = block.content.type as string || 'info';
        const CalloutIcon = calloutType === 'warning' ? AlertTriangle : calloutType === 'success' ? CheckCircle : Info;
        const calloutColors = {
          warning: 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400',
          success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
          info: 'bg-primary/10 border-primary/30 text-primary',
        };
        
        return (
          <div 
            key={block.id} 
            className={`my-6 p-4 rounded-lg border flex gap-3 ${calloutColors[calloutType as keyof typeof calloutColors]}`}
          >
            <CalloutIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              {block.content.title && (
                <p className="font-semibold mb-1">
                  {language === 'ar' && block.content.title_ar 
                    ? String(block.content.title_ar) 
                    : String(block.content.title)}
                </p>
              )}
              <p className="text-sm opacity-90">
                {language === 'ar' && block.content.text_ar 
                  ? String(block.content.text_ar) 
                  : String(block.content.text || '')}
              </p>
            </div>
          </div>
        );
      
      case 'product_card':
        const productIds = block.content.product_ids as string[] || [];
        const blockProducts = products
          .filter(p => productIds.includes(p.product_id))
          .map(p => p.product)
          .filter(Boolean);
        
        return (
          <div key={block.id} className="my-8 space-y-4">
            {blockProducts.map((product) => product && (
              <ArticleProductCard 
                key={product.id}
                product={product}
                onProductClick={onProductClick}
                onViewHistory={onViewHistory}
              />
            ))}
          </div>
        );
      
      case 'comparison':
        const headers = (block.content.headers as string[]) || [];
        const rows = (block.content.rows as string[][]) || [];
        
        return (
          <div key={block.id} className="my-8 overflow-x-auto">
            <table className="w-full border-collapse rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-muted/50">
                  {headers.map((header, i) => (
                    <th key={i} className="p-3 text-left font-semibold text-foreground border-b border-border">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    {row.map((cell, j) => (
                      <td key={j} className="p-3 text-muted-foreground">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      
      case 'faq':
        const faqs = (block.content.items as { question: string; question_ar?: string; answer: string; answer_ar?: string }[]) || [];
        
        return (
          <Accordion key={block.id} type="single" collapsible className="my-8">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border-border/50">
                <AccordionTrigger className="text-left font-medium hover:text-primary">
                  {language === 'ar' && faq.question_ar ? faq.question_ar : faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {language === 'ar' && faq.answer_ar ? faq.answer_ar : faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <div className="space-y-6">
      {blocks.map(renderBlock)}
    </div>
  );
};
