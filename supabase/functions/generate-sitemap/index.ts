import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/xml',
};

// Configure your custom domain here when migrating away from Lovable
const SITE_URL = Deno.env.get('SITE_URL') || 'https://krolist.lovable.app';

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const urls: SitemapUrl[] = [];

    // Static pages
    const staticPages = [
      { path: '/', changefreq: 'daily' as const, priority: 1.0 },
      { path: '/products', changefreq: 'daily' as const, priority: 0.9 },
      { path: '/promo-codes', changefreq: 'daily' as const, priority: 0.9 },
      { path: '/stickers', changefreq: 'weekly' as const, priority: 0.8 },
      { path: '/events', changefreq: 'weekly' as const, priority: 0.8 },
      { path: '/articles', changefreq: 'daily' as const, priority: 0.9 },
      { path: '/categories', changefreq: 'weekly' as const, priority: 0.8 },
      { path: '/donation', changefreq: 'monthly' as const, priority: 0.5 },
      { path: '/contact-us', changefreq: 'monthly' as const, priority: 0.5 },
      { path: '/privacy-policy', changefreq: 'yearly' as const, priority: 0.3 },
      { path: '/terms-of-service', changefreq: 'yearly' as const, priority: 0.3 },
    ];

    for (const page of staticPages) {
      urls.push({
        loc: `${SITE_URL}${page.path}`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: page.changefreq,
        priority: page.priority,
      });
    }

    // Fetch published articles
    console.log('Fetching articles...');
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('slug, updated_at, published_at')
      .eq('is_published', true)
      .order('published_at', { ascending: false });

    if (articlesError) {
      console.error('Error fetching articles:', articlesError);
    } else if (articles) {
      console.log(`Found ${articles.length} published articles`);
      for (const article of articles) {
        urls.push({
          loc: `${SITE_URL}/articles/${article.slug}`,
          lastmod: article.updated_at?.split('T')[0] || article.published_at?.split('T')[0],
          changefreq: 'weekly',
          priority: 0.8,
        });
      }
    }

    // Fetch active categories
    console.log('Fetching categories...');
    const { data: categories, error: categoriesError } = await supabase
      .from('category_collections')
      .select('id, title, updated_at')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
    } else if (categories) {
      console.log(`Found ${categories.length} active categories`);
      for (const category of categories) {
        // Use URL-safe title for category path
        const categorySlug = encodeURIComponent(category.title);
        urls.push({
          loc: `${SITE_URL}/category/${category.id}`,
          lastmod: category.updated_at?.split('T')[0],
          changefreq: 'weekly',
          priority: 0.7,
        });
      }
    }

    // Fetch featured krolist products (optional - adds product pages if they exist)
    console.log('Fetching featured products...');
    const { data: products, error: productsError } = await supabase
      .from('krolist_products')
      .select('id, title, updated_at')
      .eq('is_featured', true)
      .order('updated_at', { ascending: false })
      .limit(100);

    if (productsError) {
      console.error('Error fetching products:', productsError);
    } else if (products) {
      console.log(`Found ${products.length} featured products`);
      // Products are listed on the main products page, not individual pages
      // But we could add them if individual product pages exist
    }

    // Generate XML sitemap
    const xml = generateSitemapXML(urls);
    
    console.log(`Generated sitemap with ${urls.length} URLs`);

    return new Response(xml, {
      headers: corsHeaders,
      status: 200,
    });
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <priority>1.0</priority>
  </url>
</urlset>`,
      {
        headers: corsHeaders,
        status: 200,
      }
    );
  }
});

function generateSitemapXML(urls: SitemapUrl[]): string {
  const urlElements = urls
    .map(
      (url) => `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority.toFixed(1)}</priority>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
