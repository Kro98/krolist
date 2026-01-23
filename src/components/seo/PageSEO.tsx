import { Helmet } from 'react-helmet-async';

interface PageSEOProps {
  title: string;
  description: string;
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  keywords?: string[];
  noIndex?: boolean;
  structuredData?: object | object[];
  alternateLanguages?: {
    lang: string;
    url: string;
  }[];
}

export const PageSEO = ({
  title,
  description,
  canonicalUrl,
  ogImage = 'https://storage.googleapis.com/gpt-engineer-file-uploads/YFgGWEsxfNOaFdRM8i5OBPIS5c33/social-images/social-1766587034681-1000242010.png',
  ogType = 'website',
  keywords = [],
  noIndex = false,
  structuredData,
  alternateLanguages = [],
}: PageSEOProps) => {
  const fullTitle = title.includes('Krolist') ? title : `${title} | Krolist`;
  const baseUrl = 'https://krolist.com';
  const canonical = canonicalUrl || baseUrl;

  // Organization schema - always present
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Krolist',
    url: baseUrl,
    logo: 'https://krolist.com/krolist-logo.png',
    sameAs: [
      'https://x.com/Krolist_help',
      'https://www.tiktok.com/@krolist',
      'https://whatsapp.com/channel/0029VbBpXPrAO7RImVlY0v3t',
    ],
    description: 'Curated cool stuff, deals, and gift ideas for you and your loved ones.',
  };

  // WebSite schema with search action
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Krolist',
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search-products?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  const allStructuredData = [
    organizationSchema,
    websiteSchema,
    ...(Array.isArray(structuredData) ? structuredData : structuredData ? [structuredData] : []),
  ];

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      {keywords.length > 0 && <meta name="keywords" content={keywords.join(', ')} />}
      
      {/* Robots */}
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}
      
      {/* Canonical */}
      <link rel="canonical" href={canonical} />
      
      {/* Alternate Languages */}
      {alternateLanguages.map(({ lang, url }) => (
        <link key={lang} rel="alternate" hrefLang={lang} href={url} />
      ))}
      
      {/* Open Graph */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="Krolist" />
      <meta property="og:locale" content="en_US" />
      <meta property="og:locale:alternate" content="ar_SA" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@Krolist_help" />
      <meta name="twitter:creator" content="@Krolist_help" />
      <meta name="twitter:url" content={canonical} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* Structured Data */}
      {allStructuredData.map((data, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(data)}
        </script>
      ))}
    </Helmet>
  );
};
