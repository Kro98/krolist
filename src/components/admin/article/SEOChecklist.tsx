import { Check, X, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Article, ArticleBlock } from '@/types/article';

interface SEOChecklistProps {
  article: Partial<Article>;
  blocks: Partial<ArticleBlock>[];
  productCount: number;
}

interface CheckItem {
  label: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
}

export const SEOChecklist = ({ article, blocks, productCount }: SEOChecklistProps) => {
  const checks: CheckItem[] = [
    // Title checks
    {
      label: 'Title exists',
      status: article.title_en ? 'pass' : 'fail',
      message: article.title_en ? 'Title is set' : 'Add a title for the article',
    },
    {
      label: 'Title length',
      status: !article.title_en ? 'fail' : 
        (article.title_en.length >= 30 && article.title_en.length <= 70) ? 'pass' : 'warn',
      message: !article.title_en ? 'Add a title' :
        article.title_en.length < 30 ? 'Title is too short (aim for 30-70 chars)' :
        article.title_en.length > 70 ? 'Title is too long (aim for 30-70 chars)' : 
        `Title length is good (${article.title_en.length} chars)`,
    },
    
    // Meta description
    {
      label: 'Meta description',
      status: article.meta_description_en ? 'pass' : 'fail',
      message: article.meta_description_en ? 'Meta description is set' : 'Add a meta description for SEO',
    },
    {
      label: 'Meta description length',
      status: !article.meta_description_en ? 'fail' :
        (article.meta_description_en.length >= 120 && article.meta_description_en.length <= 160) ? 'pass' : 'warn',
      message: !article.meta_description_en ? 'Add a meta description' :
        article.meta_description_en.length < 120 ? 'Meta description is short (aim for 120-160 chars)' :
        article.meta_description_en.length > 160 ? 'Meta description is too long' :
        `Meta description length is ideal (${article.meta_description_en.length} chars)`,
    },
    
    // URL Slug
    {
      label: 'URL slug',
      status: article.slug ? 'pass' : 'fail',
      message: article.slug ? `URL: /articles/${article.slug}` : 'Set a URL slug for the article',
    },
    {
      label: 'Slug format',
      status: !article.slug ? 'fail' :
        /^[a-z0-9-]+$/.test(article.slug) ? 'pass' : 'warn',
      message: !article.slug ? 'Add a slug' :
        /^[a-z0-9-]+$/.test(article.slug) ? 'Slug is SEO-friendly' : 
        'Slug should only contain lowercase letters, numbers, and hyphens',
    },
    
    // Category
    {
      label: 'Category',
      status: article.category ? 'pass' : 'warn',
      message: article.category ? `Category: ${article.category}` : 'Consider adding a category',
    },
    
    // Content
    {
      label: 'Content blocks',
      status: blocks.length >= 3 ? 'pass' : blocks.length > 0 ? 'warn' : 'fail',
      message: blocks.length === 0 ? 'Add content blocks to the article' :
        blocks.length < 3 ? `${blocks.length} blocks - consider adding more content` :
        `${blocks.length} content blocks`,
    },
    
    // Products
    {
      label: 'Product cards',
      status: productCount >= 3 ? 'pass' : productCount > 0 ? 'warn' : 'fail',
      message: productCount === 0 ? 'Add product cards for conversion' :
        productCount < 3 ? `${productCount} products - aim for 3-6` :
        `${productCount} products included`,
    },
    
    // Images
    {
      label: 'Images with alt text',
      status: (() => {
        const imageBlocks = blocks.filter(b => b.block_type === 'image');
        if (imageBlocks.length === 0) return 'warn';
        const allHaveAlt = imageBlocks.every(b => b.content && (b.content as any).alt);
        return allHaveAlt ? 'pass' : 'fail';
      })(),
      message: (() => {
        const imageBlocks = blocks.filter(b => b.block_type === 'image');
        if (imageBlocks.length === 0) return 'Consider adding images';
        const withAlt = imageBlocks.filter(b => b.content && (b.content as any).alt).length;
        return withAlt === imageBlocks.length ? 
          `All ${imageBlocks.length} images have alt text` :
          `${withAlt}/${imageBlocks.length} images have alt text`;
      })(),
    },
    
    // FAQ for schema
    {
      label: 'FAQ section',
      status: blocks.some(b => b.block_type === 'faq') ? 'pass' : 'warn',
      message: blocks.some(b => b.block_type === 'faq') ? 
        'FAQ section included (enables FAQ schema)' : 
        'Consider adding an FAQ section for rich snippets',
    },
    
    // OG Image
    {
      label: 'Social image',
      status: article.og_image_url ? 'pass' : 'warn',
      message: article.og_image_url ? 'OG image is set' : 'Add an OG image for social sharing',
    },
    
    // Arabic content
    {
      label: 'Arabic title',
      status: article.title_ar ? 'pass' : 'warn',
      message: article.title_ar ? 'Arabic title is set' : 'Consider adding Arabic title for bilingual SEO',
    },
  ];
  
  const passCount = checks.filter(c => c.status === 'pass').length;
  const score = Math.round((passCount / checks.length) * 100);
  
  const getScoreColor = () => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };
  
  const getProgressColor = () => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>SEO Checklist</span>
          <span className={`text-2xl font-bold ${getScoreColor()}`}>{score}%</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Progress value={score} className={`h-2 ${getProgressColor()}`} />
          <p className="text-xs text-muted-foreground">
            {passCount}/{checks.length} checks passed
          </p>
        </div>
        
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
          {checks.map((check, index) => (
            <div 
              key={index}
              className={`flex items-start gap-2 p-2 rounded-lg text-sm ${
                check.status === 'pass' ? 'bg-emerald-500/10' :
                check.status === 'warn' ? 'bg-amber-500/10' :
                'bg-red-500/10'
              }`}
            >
              {check.status === 'pass' ? (
                <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              ) : check.status === 'warn' ? (
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              ) : (
                <X className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              )}
              <div className="min-w-0">
                <p className="font-medium">{check.label}</p>
                <p className="text-xs text-muted-foreground truncate">{check.message}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
