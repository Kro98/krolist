import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SITE_URL = Deno.env.get('SITE_URL') || 'https://krolist.com';
const OG_IMAGE = 'https://storage.googleapis.com/gpt-engineer-file-uploads/YFgGWEsxfNOaFdRM8i5OBPIS5c33/social-images/social-1766587034681-1000242010.png';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildHtml({
  title,
  description,
  canonicalUrl,
  ogImage,
  ogType = 'website',
  bodyContent = '',
  structuredData = [],
  extraMeta = '',
}: {
  title: string;
  description: string;
  canonicalUrl: string;
  ogImage?: string;
  ogType?: string;
  bodyContent?: string;
  structuredData?: object[];
  extraMeta?: string;
}): string {
  const img = ogImage || OG_IMAGE;
  const fullTitle = title.includes('Krolist') ? title : `${title} | Krolist`;

  const schemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Krolist',
      url: SITE_URL,
      logo: `${SITE_URL}/krolist-logo.png`,
      sameAs: [
        'https://x.com/Krolist_help',
        'https://www.tiktok.com/@krolist',
      ],
    },
    ...structuredData,
  ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(fullTitle)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">

  <meta property="og:type" content="${ogType}">
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
  <meta property="og:title" content="${escapeHtml(fullTitle)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${escapeHtml(img)}">
  <meta property="og:site_name" content="Krolist">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@Krolist_help">
  <meta name="twitter:title" content="${escapeHtml(fullTitle)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(img)}">
  ${extraMeta}
  ${schemas.map(s => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join('\n  ')}
</head>
<body>
  <header><h1>${escapeHtml(fullTitle)}</h1></header>
  <main>${bodyContent}</main>
  <footer><p>&copy; Krolist</p></footer>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.searchParams.get('path') || '/';

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let html: string;

    // ── Article pages ──────────────────────────────
    const articleMatch = path.match(/^\/articles\/([^/?#]+)/);
    if (articleMatch) {
      const slug = decodeURIComponent(articleMatch[1]);
      const { data: article } = await supabase
        .from('articles')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (article) {
        // Fetch blocks for content
        const { data: blocks } = await supabase
          .from('article_blocks')
          .select('*')
          .eq('article_id', article.id)
          .order('display_order', { ascending: true });

        // Build body from blocks
        let body = `<p>${escapeHtml(article.summary_en || '')}</p>`;
        for (const block of blocks || []) {
          if (block.block_type === 'text') {
            body += `<div>${block.content?.html_en || block.content?.html_ar || ''}</div>`;
          } else if (block.block_type === 'heading') {
            body += `<h2>${escapeHtml(block.content?.text_en || '')}</h2>`;
          } else if (block.block_type === 'faq') {
            const items = (block.content?.items as { question: string; answer: string }[]) || [];
            for (const item of items) {
              body += `<h3>${escapeHtml(item.question)}</h3><p>${escapeHtml(item.answer)}</p>`;
            }
          }
        }

        // FAQ schema
        const faqBlocks = (blocks || []).filter(b => b.block_type === 'faq');
        const faqItems = faqBlocks.flatMap(block => {
          const items = (block.content?.items as { question: string; answer: string }[]) || [];
          return items.map(item => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: { '@type': 'Answer', text: item.answer },
          }));
        });

        const schemas: object[] = [
          {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: article.title_en,
            description: article.summary_en,
            image: article.og_image_url,
            datePublished: article.published_at,
            dateModified: article.updated_at,
            author: { '@type': 'Organization', name: 'Krolist', url: SITE_URL },
            publisher: {
              '@type': 'Organization',
              name: 'Krolist',
              logo: { '@type': 'ImageObject', url: `${SITE_URL}/krolist-logo.png` },
            },
            mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/articles/${article.slug}` },
          },
        ];

        if (faqItems.length > 0) {
          schemas.push({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqItems,
          });
        }

        const extraMeta = [
          article.published_at ? `<meta property="article:published_time" content="${article.published_at}">` : '',
          article.updated_at ? `<meta property="article:modified_time" content="${article.updated_at}">` : '',
          article.category ? `<meta property="article:section" content="${escapeHtml(article.category)}">` : '',
          ...(article.tags || []).map((t: string) => `<meta property="article:tag" content="${escapeHtml(t)}">`),
        ].filter(Boolean).join('\n  ');

        html = buildHtml({
          title: article.meta_title_en || article.title_en,
          description: article.meta_description_en || article.summary_en || '',
          canonicalUrl: article.canonical_url || `${SITE_URL}/articles/${article.slug}`,
          ogImage: article.og_image_url,
          ogType: 'article',
          bodyContent: body,
          structuredData: schemas,
          extraMeta,
        });
      } else {
        html = buildHtml({
          title: 'Article Not Found',
          description: 'This article could not be found.',
          canonicalUrl: `${SITE_URL}${path}`,
        });
      }

      return new Response(html, {
        headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
      });
    }

    // ── Articles listing ───────────────────────────
    if (path === '/articles') {
      const { data: articles } = await supabase
        .from('articles')
        .select('slug, title_en, summary_en, published_at')
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(50);

      let body = '<h2>Latest Articles</h2><ul>';
      for (const a of articles || []) {
        body += `<li><a href="${SITE_URL}/articles/${a.slug}">${escapeHtml(a.title_en)}</a> — ${escapeHtml(a.summary_en || '')}</li>`;
      }
      body += '</ul>';

      html = buildHtml({
        title: 'Articles — Curated Deals & Gift Guides',
        description: 'Browse curated articles about the best deals, gift ideas, and product reviews.',
        canonicalUrl: `${SITE_URL}/articles`,
        bodyContent: body,
      });

      return new Response(html, {
        headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, s-maxage=1800' },
      });
    }

    // ── Products / home ────────────────────────────
    if (path === '/' || path === '/products') {
      const { data: products } = await supabase
        .from('krolist_products')
        .select('title, current_price, currency, store, product_url')
        .eq('is_featured', true)
        .order('updated_at', { ascending: false })
        .limit(30);

      let body = '<h2>Featured Products</h2><ul>';
      for (const p of products || []) {
        body += `<li><a href="${escapeHtml(p.product_url)}">${escapeHtml(p.title)}</a> — ${p.current_price} ${p.currency} (${escapeHtml(p.store)})</li>`;
      }
      body += '</ul>';

      html = buildHtml({
        title: path === '/' ? 'Krolist — Gifts and Cool Stuff' : 'Products — Krolist',
        description: 'Curated cool stuff, deals, and gift ideas for you and your loved ones.',
        canonicalUrl: `${SITE_URL}${path}`,
        bodyContent: body,
      });

      return new Response(html, {
        headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, s-maxage=1800' },
      });
    }

    // ── Static pages ───────────────────────────────
    const staticPages: Record<string, { title: string; description: string }> = {
      '/promo-codes': { title: 'Promo Codes & Coupons', description: 'Find the latest promo codes and discount coupons for popular stores.' },
      '/stickers': { title: 'Stickers', description: 'Browse and order custom stickers from Krolist.' },
      '/contact-us': { title: 'Contact Us', description: 'Get in touch with the Krolist team.' },
      '/privacy-policy': { title: 'Privacy Policy', description: 'Krolist privacy policy — how we handle your data.' },
      '/terms-of-service': { title: 'Terms of Service', description: 'Krolist terms of service and usage agreement.' },
      '/donation': { title: 'Support Krolist', description: 'Support Krolist and help us keep curating great deals.' },
    };

    const staticPage = staticPages[path];
    if (staticPage) {
      html = buildHtml({
        title: staticPage.title,
        description: staticPage.description,
        canonicalUrl: `${SITE_URL}${path}`,
      });

      return new Response(html, {
        headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, s-maxage=86400' },
      });
    }

    // ── Fallback ───────────────────────────────────
    html = buildHtml({
      title: 'Krolist — Gifts and Cool Stuff',
      description: 'Curated cool stuff, deals, and gift ideas for you and your loved ones.',
      canonicalUrl: `${SITE_URL}${path}`,
    });

    return new Response(html, {
      headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, s-maxage=3600' },
    });
  } catch (error) {
    console.error('Prerender error:', error);
    return new Response(
      buildHtml({
        title: 'Krolist',
        description: 'Curated cool stuff, deals, and gift ideas.',
        canonicalUrl: SITE_URL,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' }, status: 200 },
    );
  }
});
