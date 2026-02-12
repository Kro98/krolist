import { useState } from "react";
import { AlertTriangle, CheckCircle, XCircle, ExternalLink, ChevronDown, ChevronRight, Server, Globe, Zap, ShoppingBag, Brain, Flame, Bell, BarChart3, FileText, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface ServiceDependency {
  id: string;
  name: string;
  icon: React.ReactNode;
  category: 'core' | 'lovable' | 'external';
  requiredSecrets: string[];
  status: 'ok' | 'warning' | 'critical';
  description: string;
  whatBreaks: string[];
  affectedFiles: { path: string; description: string }[];
  migrationSteps: string[];
  docsUrl?: string;
}

const DEPENDENCIES: ServiceDependency[] = [
  {
    id: 'supabase',
    name: 'Supabase (Database, Auth, Storage)',
    icon: <Server className="w-4 h-4" />,
    category: 'core',
    requiredSecrets: ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'],
    status: 'ok',
    description: 'Core backend — database, authentication, file storage, and edge functions. This is your own Supabase project and is fully portable.',
    whatBreaks: ['Everything — the entire app relies on Supabase for data, auth, and server-side logic.'],
    affectedFiles: [
      { path: 'src/integrations/supabase/client.ts', description: 'Supabase client initialization — update SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY with your new project credentials' },
      { path: 'All supabase/functions/*/index.ts', description: 'Edge functions use SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from env' },
    ],
    migrationSteps: [
      'Your Supabase project (cnmdwgdizfrvyplllmdn) is already yours — no migration needed.',
      'To move to a new Supabase project: export your database schema and data from the current project.',
      'Update src/integrations/supabase/client.ts with the new URL and anon key.',
      'Re-deploy all edge functions to the new project.',
      'Update all hardcoded URLs (search for "cnmdwgdizfrvyplllmdn" in the codebase).',
    ],
    docsUrl: 'https://supabase.com/docs/guides/getting-started',
  },
  {
    id: 'lovable-ai',
    name: 'Lovable AI Gateway',
    icon: <Brain className="w-4 h-4" />,
    category: 'lovable',
    requiredSecrets: ['LOVABLE_API_KEY'],
    status: 'critical',
    description: 'Used for AI-powered text translation (Arabic ↔ English) in the article editor. This is the ONLY Lovable-specific dependency.',
    whatBreaks: [
      'Article translation (translate-text edge function) — the admin "Translate" button in the article editor will fail.',
    ],
    affectedFiles: [
      { path: 'supabase/functions/translate-text/index.ts', description: 'Calls ai.gateway.lovable.dev for chat completions. Replace with OpenAI API or any compatible endpoint.' },
    ],
    migrationSteps: [
      'Open supabase/functions/translate-text/index.ts',
      'Replace the URL "https://ai.gateway.lovable.dev/v1/chat/completions" with "https://api.openai.com/v1/chat/completions"',
      'Replace LOVABLE_API_KEY with OPENAI_API_KEY (already configured)',
      'Change the Authorization header to use the OPENAI_API_KEY instead',
      'The request/response format is identical (OpenAI-compatible), so no other changes needed.',
    ],
    docsUrl: 'https://platform.openai.com/docs/api-reference/chat',
  },
  {
    id: 'lovable-domain',
    name: 'Lovable Hosting Domain',
    icon: <Globe className="w-4 h-4" />,
    category: 'lovable',
    requiredSecrets: [],
    status: 'warning',
    description: 'The sitemap generator and published URL use krolist.lovable.app. If you use a custom domain, update these.',
    whatBreaks: [
      'SEO sitemap will reference the old lovable.app domain instead of your custom domain.',
    ],
    affectedFiles: [
      { path: 'supabase/functions/generate-sitemap/index.ts', description: 'Hardcoded SITE_URL = "https://krolist.lovable.app" — change to your custom domain' },
      { path: 'public/robots.txt', description: 'May reference the lovable.app sitemap URL' },
      { path: 'public/sitemap.xml', description: 'Static fallback sitemap — update domain references' },
    ],
    migrationSteps: [
      'Open supabase/functions/generate-sitemap/index.ts and change SITE_URL to your custom domain.',
      'Update public/robots.txt sitemap reference if present.',
      'Update any canonical URLs in the codebase.',
      'If self-hosting, deploy the Vite build output to your hosting provider (Vercel, Netlify, etc.).',
    ],
    docsUrl: 'https://docs.lovable.dev/tips-tricks/self-hosting',
  },
  {
    id: 'amazon-paapi',
    name: 'Amazon Product Advertising API',
    icon: <ShoppingBag className="w-4 h-4" />,
    category: 'external',
    requiredSecrets: ['AMAZON_ACCESS_KEY', 'AMAZON_SECRET_KEY', 'AMAZON_PARTNER_TAG'],
    status: 'ok',
    description: 'Used to auto-fill product details from Amazon URLs and auto-update prices for Amazon products.',
    whatBreaks: [
      'Auto-fill when adding products via Amazon URL (scrape-products function).',
      'Automatic price updates for Amazon products (auto-update-prices function).',
      'Note: Manual product entry and manual price editing still work without this.',
    ],
    affectedFiles: [
      { path: 'supabase/functions/scrape-products/index.ts', description: 'Amazon PA-API integration for product lookup by ASIN' },
      { path: 'supabase/functions/auto-update-prices/index.ts', description: 'Batch price refresh using Amazon PA-API' },
    ],
    migrationSteps: [
      'Get your Amazon PA-API credentials from https://affiliate-program.amazon.com/',
      'You need: Access Key, Secret Key, and Partner Tag',
      'Add them as secrets: AMAZON_ACCESS_KEY, AMAZON_SECRET_KEY, AMAZON_PARTNER_TAG',
      'Note: Amazon requires 3 qualifying sales in 180 days for API access.',
    ],
    docsUrl: 'https://webservices.amazon.com/paapi5/documentation/',
  },
  {
    id: 'openai',
    name: 'OpenAI API',
    icon: <Brain className="w-4 h-4" />,
    category: 'external',
    requiredSecrets: ['OPENAI_API_KEY'],
    status: 'ok',
    description: 'Powers AI product search suggestions and price extraction from scraped pages.',
    whatBreaks: [
      'AI product search (ai-product-search function) — the smart search feature.',
      'Price extraction fallback in refresh-product-prices and user-refresh-prices.',
    ],
    affectedFiles: [
      { path: 'supabase/functions/ai-product-search/index.ts', description: 'Uses OpenAI for intelligent product recommendations' },
      { path: 'supabase/functions/refresh-product-prices/index.ts', description: 'Uses OpenAI to extract prices from HTML' },
      { path: 'supabase/functions/user-refresh-prices/index.ts', description: 'Uses OpenAI for user-triggered price refresh' },
    ],
    migrationSteps: [
      'Get an API key from https://platform.openai.com/api-keys',
      'Add it as secret: OPENAI_API_KEY',
      'Compatible with any OpenAI-compatible API (Azure OpenAI, Anthropic via adapter, etc.)',
    ],
    docsUrl: 'https://platform.openai.com/docs',
  },
  {
    id: 'firecrawl',
    name: 'Firecrawl',
    icon: <Flame className="w-4 h-4" />,
    category: 'external',
    requiredSecrets: ['FIRECRAWL_API_KEY'],
    status: 'ok',
    description: 'Web scraping service used to refresh Krolist product prices by crawling store pages.',
    whatBreaks: [
      'Admin "Refresh Prices" for non-Amazon products (admin-refresh-krolist-prices function).',
    ],
    affectedFiles: [
      { path: 'supabase/functions/admin-refresh-krolist-prices/index.ts', description: 'Uses Firecrawl to scrape product pages for updated prices' },
    ],
    migrationSteps: [
      'Get an API key from https://firecrawl.dev/',
      'Add it as secret: FIRECRAWL_API_KEY',
      'Alternative: Replace with any web scraping service (Puppeteer, Playwright, etc.)',
    ],
    docsUrl: 'https://docs.firecrawl.dev/',
  },
  {
    id: 'sb-management',
    name: 'Supabase Management API',
    icon: <Server className="w-4 h-4" />,
    category: 'external',
    requiredSecrets: ['SB_MANAGEMENT_TOKEN'],
    status: 'ok',
    description: 'Used by the API Keys tab to list, create, update, and delete edge function secrets via the Supabase Management API.',
    whatBreaks: [
      'The API Keys management UI (this page) — listing, adding, updating, and deleting secrets.',
    ],
    affectedFiles: [
      { path: 'supabase/functions/manage-secrets/index.ts', description: 'Proxies requests to Supabase Management API for secret CRUD' },
      { path: 'supabase/functions/test-secret-connection/index.ts', description: 'Tests if secrets are set by reading them from env' },
    ],
    migrationSteps: [
      'Generate a Supabase Management API token at https://supabase.com/dashboard/account/tokens',
      'Add it as secret: SB_MANAGEMENT_TOKEN',
      'Update the PROJECT_REF in manage-secrets/index.ts if you change Supabase projects.',
    ],
    docsUrl: 'https://supabase.com/docs/reference/api/introduction',
  },
  {
    id: 'vapid',
    name: 'Web Push Notifications (VAPID)',
    icon: <Bell className="w-4 h-4" />,
    category: 'external',
    requiredSecrets: ['VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY'],
    status: 'ok',
    description: 'VAPID keys for web push notifications via the service worker.',
    whatBreaks: [
      'Push notifications to users — the sw-push.js service worker.',
    ],
    affectedFiles: [
      { path: 'public/sw-push.js', description: 'Service worker that handles push events' },
    ],
    migrationSteps: [
      'Generate VAPID keys using: npx web-push generate-vapid-keys',
      'Add them as secrets: VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY',
    ],
    docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API/Push_API',
  },
  {
    id: 'adsense',
    name: 'Google AdSense',
    icon: <BarChart3 className="w-4 h-4" />,
    category: 'external',
    requiredSecrets: [],
    status: 'ok',
    description: 'Display ads in articles and product listings. Loaded client-side via script tag — no secrets needed.',
    whatBreaks: [
      'Ad revenue — ads will not display if AdSense script is removed or account is deactivated.',
    ],
    affectedFiles: [
      { path: 'src/components/article/ArticleInlineAd.tsx', description: 'Renders AdSense ad units inline in articles' },
      { path: 'src/components/affiliate/AffiliateProductAd.tsx', description: 'Renders AdSense ads between product cards' },
      { path: 'index.html', description: 'AdSense script tag in the HTML head' },
    ],
    migrationSteps: [
      'No secrets needed — AdSense uses a client-side script with your publisher ID.',
      'To change accounts, update the data-ad-client attribute in the ad components and index.html.',
    ],
    docsUrl: 'https://support.google.com/adsense/answer/9274019',
  },
];

const categoryLabels = {
  core: { label: 'Core Infrastructure', color: 'text-blue-500' },
  lovable: { label: 'Lovable-Specific (Migration Required)', color: 'text-amber-500' },
  external: { label: 'External Services', color: 'text-emerald-500' },
};

const statusConfig = {
  ok: { icon: <CheckCircle className="w-4 h-4 text-emerald-500" />, label: 'Configured', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  warning: { icon: <AlertTriangle className="w-4 h-4 text-amber-500" />, label: 'Review Needed', bg: 'bg-amber-500/10 border-amber-500/20' },
  critical: { icon: <XCircle className="w-4 h-4 text-red-500" />, label: 'Lovable-Dependent', bg: 'bg-red-500/10 border-red-500/20' },
};

function DependencyCard({ dep, existingSecrets }: { dep: ServiceDependency; existingSecrets: string[] }) {
  const [expanded, setExpanded] = useState(false);
  
  const missingSecrets = dep.requiredSecrets.filter(s => !existingSecrets.includes(s));
  const effectiveStatus = missingSecrets.length > 0 && dep.requiredSecrets.length > 0 
    ? (dep.category === 'lovable' ? 'critical' : 'warning')
    : dep.status;
  const config = statusConfig[effectiveStatus];
  
  return (
    <div className={cn("rounded-xl border transition-all", config.bg)}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3.5 text-left"
      >
        <span className="text-muted-foreground">{dep.icon}</span>
        <div className="flex-1 min-w-0">
          <span className="font-medium text-sm">{dep.name}</span>
          {missingSecrets.length > 0 && (
            <span className="ml-2 text-xs text-destructive">({missingSecrets.length} missing)</span>
          )}
        </div>
        {config.icon}
        {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </button>
      
      {expanded && (
        <div className="px-3.5 pb-3.5 space-y-3 border-t border-border/30 pt-3">
          <p className="text-sm text-muted-foreground">{dep.description}</p>
          
          {/* Required Secrets */}
          {dep.requiredSecrets.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Required Secrets</h4>
              <div className="flex flex-wrap gap-1.5">
                {dep.requiredSecrets.map(s => (
                  <span
                    key={s}
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono",
                      existingSecrets.includes(s)
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-red-500/10 text-red-600 dark:text-red-400"
                    )}
                  >
                    {existingSecrets.includes(s) ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* What Breaks */}
          <div>
            <h4 className="text-xs font-semibold text-destructive uppercase tracking-wider mb-1.5">What Breaks Without This</h4>
            <ul className="space-y-1">
              {dep.whatBreaks.map((item, i) => (
                <li key={i} className="text-xs text-muted-foreground flex gap-2">
                  <AlertTriangle className="w-3 h-3 text-destructive shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Affected Files */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Affected Files</h4>
            <ul className="space-y-1.5">
              {dep.affectedFiles.map((file, i) => (
                <li key={i} className="text-xs">
                  <code className="font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">{file.path}</code>
                  <p className="text-muted-foreground mt-0.5 ml-1">{file.description}</p>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Migration Steps */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              {dep.category === 'lovable' ? '🚀 Migration Steps' : 'Setup / Migration Steps'}
            </h4>
            <ol className="space-y-1 list-decimal list-inside">
              {dep.migrationSteps.map((step, i) => (
                <li key={i} className="text-xs text-muted-foreground">{step}</li>
              ))}
            </ol>
          </div>
          
          {dep.docsUrl && (
            <a
              href={dep.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              Documentation
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default function ServiceDependenciesAudit({ existingSecrets }: { existingSecrets: string[] }) {
  const categories = ['lovable', 'core', 'external'] as const;
  
  const lovableDeps = DEPENDENCIES.filter(d => d.category === 'lovable');
  
  return (
    <div className="space-y-6">
      {/* Lovable Migration Summary */}
      <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-amber-600 dark:text-amber-400">Lovable Migration Summary</p>
            <p className="text-muted-foreground mt-1">
              This app has <strong>{lovableDeps.length} Lovable-specific dependencies</strong>. 
              The only code that depends on Lovable is the <strong>translate-text</strong> edge function (uses Lovable AI Gateway) 
              and the <strong>published domain</strong> (krolist.lovable.app). Both are simple to migrate — 
              see the migration steps below for each.
            </p>
            <p className="text-muted-foreground mt-1">
              Everything else (database, auth, storage, edge functions) runs on <strong>your own Supabase project</strong> 
              and is fully portable. The frontend is a standard Vite + React app that can be deployed anywhere.
            </p>
          </div>
        </div>
      </div>
      
      {categories.map(cat => {
        const deps = DEPENDENCIES.filter(d => d.category === cat);
        if (deps.length === 0) return null;
        const catConfig = categoryLabels[cat];
        
        return (
          <div key={cat} className="space-y-2">
            <h3 className={cn("text-xs font-semibold uppercase tracking-wider", catConfig.color)}>
              {catConfig.label} ({deps.length})
            </h3>
            {deps.map(dep => (
              <DependencyCard key={dep.id} dep={dep} existingSecrets={existingSecrets} />
            ))}
          </div>
        );
      })}
    </div>
  );
}
