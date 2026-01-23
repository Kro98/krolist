import { PageSEO } from './PageSEO';
import { useLanguage } from '@/contexts/LanguageContext';

interface Event {
  name: string;
  startDate: string;
  endDate?: string;
  description?: string;
  location?: string;
}

interface EventsSEOProps {
  eventCount?: number;
  upcomingEvents?: Event[];
}

export const EventsSEO = ({ eventCount, upcomingEvents = [] }: EventsSEOProps) => {
  const { language } = useLanguage();
  
  const isArabic = language === 'ar';
  
  const title = isArabic 
    ? 'الفعاليات والعروض القادمة - كروليست' 
    : 'Sales Events & Deals Calendar - Krolist';
    
  const description = isArabic
    ? `لا تفوت أي عرض! تتبع ${eventCount ? `${eventCount}+` : ''} فعالية وتخفيض قادم من أفضل المتاجر.`
    : `Never miss a deal! Track ${eventCount ? `${eventCount}+` : 'upcoming'} sales events and promotions from top stores.`;

  const keywords = isArabic
    ? ['عروض', 'تخفيضات', 'فعاليات', 'الجمعة البيضاء', 'العيد', 'كروليست']
    : ['sales', 'deals', 'events', 'black friday', 'white friday', 'promotions', 'krolist'];

  // Event schemas for upcoming events
  const eventSchemas = upcomingEvents.slice(0, 5).map((event) => ({
    '@context': 'https://schema.org',
    '@type': 'SaleEvent',
    name: event.name,
    startDate: event.startDate,
    ...(event.endDate && { endDate: event.endDate }),
    description: event.description || `${event.name} - Special deals and discounts`,
    url: 'https://krolist.com/events',
    ...(event.location && {
      location: {
        '@type': 'Place',
        name: event.location,
      },
    }),
    organizer: {
      '@type': 'Organization',
      name: 'Krolist',
      url: 'https://krolist.com',
    },
  }));

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
        name: isArabic ? 'الفعاليات' : 'Events',
        item: 'https://krolist.com/events',
      },
    ],
  };

  return (
    <PageSEO
      title={title}
      description={description}
      canonicalUrl="https://krolist.com/events"
      keywords={keywords}
      structuredData={[...eventSchemas, breadcrumbSchema]}
      alternateLanguages={[
        { lang: 'en', url: 'https://krolist.com/events' },
        { lang: 'ar', url: 'https://krolist.com/events?lang=ar' },
      ]}
    />
  );
};
