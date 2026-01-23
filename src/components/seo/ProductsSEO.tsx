import { PageSEO } from './PageSEO';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProductsSEOProps {
  productCount?: number;
}

export const ProductsSEO = ({ productCount }: ProductsSEOProps) => {
  const { language } = useLanguage();
  
  const isArabic = language === 'ar';
  
  const title = isArabic 
    ? 'كروليست - هدايا وأشياء رائعة' 
    : 'Krolist - Gifts and Cool Stuff';
    
  const description = isArabic
    ? 'اكتشف قائمة منسقة من المنتجات الرائعة والصفقات وأفكار الهدايا لك ولأحبائك. تتبع الأسعار واحصل على تنبيهات عند انخفاض الأسعار.'
    : `Discover ${productCount ? `${productCount}+` : 'curated'} cool products, deals, and gift ideas for you and your loved ones. Track prices and get alerts when they drop.`;

  const keywords = isArabic
    ? ['هدايا', 'صفقات', 'منتجات رائعة', 'تتبع الأسعار', 'السعودية', 'تسوق أونلاين']
    : ['gifts', 'deals', 'cool products', 'price tracking', 'Saudi Arabia', 'online shopping', 'gift ideas', 'curated products'];

  // ItemList schema for product collection
  const itemListSchema = productCount ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Krolist Curated Products',
    description: 'A curated list of cool products and gift ideas',
    numberOfItems: productCount,
    itemListElement: [], // Could be populated with actual products
  } : undefined;

  return (
    <PageSEO
      title={title}
      description={description}
      canonicalUrl="https://krolist.com/products"
      keywords={keywords}
      structuredData={itemListSchema}
      alternateLanguages={[
        { lang: 'en', url: 'https://krolist.com/products' },
        { lang: 'ar', url: 'https://krolist.com/products?lang=ar' },
      ]}
    />
  );
};
