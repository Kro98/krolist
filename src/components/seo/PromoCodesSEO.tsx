import { PageSEO } from './PageSEO';
import { useLanguage } from '@/contexts/LanguageContext';

interface PromoCodesSEOProps {
  promoCount?: number;
  featuredStores?: string[];
}

export const PromoCodesSEO = ({ promoCount, featuredStores = [] }: PromoCodesSEOProps) => {
  const { language } = useLanguage();
  
  const isArabic = language === 'ar';
  
  const title = isArabic 
    ? 'أكواد خصم وكوبونات - كروليست' 
    : 'Promo Codes & Coupons - Krolist';
    
  const description = isArabic
    ? `احصل على أحدث أكواد الخصم والكوبونات${featuredStores.length ? ` من ${featuredStores.slice(0, 3).join('، ')}` : ''}. وفر المال على مشترياتك.`
    : `Get the latest promo codes and coupons${featuredStores.length ? ` from ${featuredStores.slice(0, 3).join(', ')}` : ''}. ${promoCount ? `${promoCount}+ active codes` : 'Save money'} on your purchases.`;

  const keywords = isArabic
    ? ['أكواد خصم', 'كوبونات', 'عروض', 'توفير', ...featuredStores]
    : ['promo codes', 'coupons', 'discount codes', 'deals', 'savings', ...featuredStores];

  // OfferCatalog schema for promo codes
  const offerCatalogSchema = {
    '@context': 'https://schema.org',
    '@type': 'OfferCatalog',
    name: 'Krolist Promo Codes',
    description: 'Curated collection of promo codes and discount coupons',
    url: 'https://krolist.com/promo-codes',
    ...(promoCount && { numberOfItems: promoCount }),
    itemListElement: featuredStores.map((store, index) => ({
      '@type': 'Offer',
      position: index + 1,
      seller: {
        '@type': 'Organization',
        name: store,
      },
    })),
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
        name: isArabic ? 'أكواد الخصم' : 'Promo Codes',
        item: 'https://krolist.com/promo-codes',
      },
    ],
  };

  return (
    <PageSEO
      title={title}
      description={description}
      canonicalUrl="https://krolist.com/promo-codes"
      keywords={keywords}
      structuredData={[offerCatalogSchema, breadcrumbSchema]}
      alternateLanguages={[
        { lang: 'en', url: 'https://krolist.com/promo-codes' },
        { lang: 'ar', url: 'https://krolist.com/promo-codes?lang=ar' },
      ]}
    />
  );
};
