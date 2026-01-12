import { Helmet } from 'react-helmet-async';
import { Article, ArticleBlock } from '@/types/article';
import { useLanguage } from '@/contexts/LanguageContext';

interface ArticleSEOProps {
  article: Article;
  blocks?: ArticleBlock[];
}

export const ArticleSEO = ({ article, blocks = [] }: ArticleSEOProps) => {
  const { language } = useLanguage();
  
  const title = language === 'ar' && article.meta_title_ar 
    ? article.meta_title_ar 
    : article.meta_title_en || article.title_en;
    
  const description = language === 'ar' && article.meta_description_ar 
    ? article.meta_description_ar 
    : article.meta_description_en || article.summary_en || '';
  
  const canonicalUrl = article.canonical_url || `https://krolist.com/articles/${article.slug}`;
  
  // Build FAQ schema if there are FAQ blocks
  const faqBlocks = blocks.filter(b => b.block_type === 'faq');
  const faqItems = faqBlocks.flatMap(block => {
    const items = (block.content.items as { question: string; answer: string }[]) || [];
    return items.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    }));
  });
  
  // Article schema
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title_en,
    description: article.summary_en,
    image: article.og_image_url,
    datePublished: article.published_at,
    dateModified: article.updated_at,
    author: {
      '@type': 'Organization',
      name: 'Krolist',
      url: 'https://krolist.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Krolist',
      logo: {
        '@type': 'ImageObject',
        url: 'https://krolist.com/krolist-logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
  };
  
  // FAQ schema
  const faqSchema = faqItems.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems,
  } : null;
  
  return (
    <Helmet>
      <title>{title} | Krolist</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Open Graph */}
      <meta property="og:type" content="article" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      {article.og_image_url && <meta property="og:image" content={article.og_image_url} />}
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {article.og_image_url && <meta name="twitter:image" content={article.og_image_url} />}
      
      {/* Article meta */}
      {article.published_at && <meta property="article:published_time" content={article.published_at} />}
      {article.updated_at && <meta property="article:modified_time" content={article.updated_at} />}
      {article.category && <meta property="article:section" content={article.category} />}
      {article.tags?.map(tag => <meta key={tag} property="article:tag" content={tag} />)}
      
      {/* Structured data */}
      <script type="application/ld+json">
        {JSON.stringify(articleSchema)}
      </script>
      {faqSchema && (
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      )}
    </Helmet>
  );
};
