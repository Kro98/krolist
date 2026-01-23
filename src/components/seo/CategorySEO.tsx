import { PageSEO } from './PageSEO';
import { useLanguage } from '@/contexts/LanguageContext';

interface CategorySEOProps {
  categoryTitle: string;
  categoryTitleAr?: string;
  categoryDescription?: string;
  productCount?: number;
  categoryId?: string;
  categoryImage?: string;
}

export const CategorySEO = ({
  categoryTitle,
  categoryTitleAr,
  categoryDescription,
  productCount,
  categoryId,
  categoryImage,
}: CategorySEOProps) => {
  const { language } = useLanguage();
  
  const isArabic = language === 'ar';
  const displayTitle = isArabic && categoryTitleAr ? categoryTitleAr : categoryTitle;
  
  const title = `${displayTitle} - Krolist`;
  
  const description = categoryDescription || (isArabic
    ? `اكتشف ${productCount ? `${productCount}` : ''} منتجات في فئة ${displayTitle}. أفضل الصفقات وأفكار الهدايا.`
    : `Discover ${productCount ? `${productCount}` : 'curated'} products in ${displayTitle}. Best deals and gift ideas.`);

  const keywords = [
    categoryTitle.toLowerCase(),
    'deals',
    'gifts',
    'krolist',
    'curated',
    ...(categoryTitleAr ? [categoryTitleAr] : []),
  ];

  const canonicalUrl = categoryId 
    ? `https://krolist.com/category/${categoryId}` 
    : 'https://krolist.com/categories';

  // CollectionPage schema
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: displayTitle,
    description: description,
    url: canonicalUrl,
    ...(categoryImage && { image: categoryImage }),
    ...(productCount && { numberOfItems: productCount }),
    isPartOf: {
      '@type': 'WebSite',
      name: 'Krolist',
      url: 'https://krolist.com',
    },
  };

  // BreadcrumbList schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Products',
        item: 'https://krolist.com/products',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Categories',
        item: 'https://krolist.com/categories',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: displayTitle,
        item: canonicalUrl,
      },
    ],
  };

  return (
    <PageSEO
      title={title}
      description={description}
      canonicalUrl={canonicalUrl}
      keywords={keywords}
      ogImage={categoryImage}
      structuredData={[collectionSchema, breadcrumbSchema]}
      alternateLanguages={[
        { lang: 'en', url: canonicalUrl },
        { lang: 'ar', url: `${canonicalUrl}?lang=ar` },
      ]}
    />
  );
};
