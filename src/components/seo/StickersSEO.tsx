import { PageSEO } from './PageSEO';
import { useLanguage } from '@/contexts/LanguageContext';

interface StickersSEOProps {
  stickerCount?: number;
  featuredStickers?: string[];
}

export const StickersSEO = ({ stickerCount, featuredStickers = [] }: StickersSEOProps) => {
  const { language } = useLanguage();
  
  const isArabic = language === 'ar';
  
  const title = isArabic 
    ? 'ستيكرات وملصقات مميزة - كروليست' 
    : 'Stickers & Decals - Krolist';
    
  const description = isArabic
    ? `تسوق من مجموعة ${stickerCount ? `${stickerCount}+` : ''} ستيكر وملصق مميز. ستيكرات للابتوب، الموبايل، والمزيد.`
    : `Shop from ${stickerCount ? `${stickerCount}+` : 'our collection of'} unique stickers and decals. Perfect for laptops, phones, and more.`;

  const keywords = isArabic
    ? ['ستيكرات', 'ملصقات', 'ستيكر لابتوب', 'ستيكر موبايل', 'كروليست']
    : ['stickers', 'decals', 'laptop stickers', 'phone stickers', 'vinyl stickers', 'krolist', ...featuredStickers];

  // Product schema for sticker store
  const productCatalogSchema = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: 'Krolist Stickers',
    description: 'Unique stickers and decals for personalization',
    url: 'https://krolist.com/stickers',
    ...(stickerCount && { numberOfItems: stickerCount }),
    priceRange: '$',
    image: 'https://krolist.com/sticker-collection.jpg',
    potentialAction: {
      '@type': 'BuyAction',
      target: 'https://krolist.com/stickers',
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
        name: 'Home',
        item: 'https://krolist.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: isArabic ? 'ستيكرات' : 'Stickers',
        item: 'https://krolist.com/stickers',
      },
    ],
  };

  return (
    <PageSEO
      title={title}
      description={description}
      canonicalUrl="https://krolist.com/stickers"
      keywords={keywords}
      structuredData={[productCatalogSchema, breadcrumbSchema]}
      alternateLanguages={[
        { lang: 'en', url: 'https://krolist.com/stickers' },
        { lang: 'ar', url: 'https://krolist.com/stickers?lang=ar' },
      ]}
    />
  );
};
