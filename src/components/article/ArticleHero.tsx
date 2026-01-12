import { Badge } from '@/components/ui/badge';
import { Article } from '@/types/article';
import { useLanguage } from '@/contexts/LanguageContext';

interface ArticleHeroProps {
  article: Article;
}

export const ArticleHero = ({ article }: ArticleHeroProps) => {
  const { language } = useLanguage();
  const title = language === 'ar' && article.title_ar ? article.title_ar : article.title_en;
  const summary = language === 'ar' && article.summary_ar ? article.summary_ar : article.summary_en;
  
  return (
    <section 
      className="relative min-h-[40vh] flex items-end pb-12 pt-24 overflow-hidden"
      style={{
        backgroundColor: article.hero_bg_color || '#000000',
      }}
    >
      {/* Background image with opacity */}
      {article.hero_use_image && article.hero_bg_image_url && (
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${article.hero_bg_image_url})`,
            opacity: (article.hero_bg_opacity || 15) / 100,
          }}
        />
      )}
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      
      {/* Content */}
      <div className="container relative z-10 px-4 max-w-4xl mx-auto">
        {article.category && (
          <Badge variant="secondary" className="mb-4 bg-primary/20 text-primary border-primary/30">
            {article.category}
          </Badge>
        )}
        
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 leading-tight">
          {title}
        </h1>
        
        {summary && (
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
            {summary}
          </p>
        )}
      </div>
    </section>
  );
};
