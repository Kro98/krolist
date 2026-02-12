import { Server, Globe, Terminal, FileCode, Copy, CheckCircle2, ExternalLink, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { cn } from "@/lib/utils";

function CopyBlock({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative group">
      {label && <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>}
      <div className="mt-1 rounded-lg bg-background/80 border border-border/50 p-3 font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap break-all">
        {code}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 h-7 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={copy}
      >
        {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
      </Button>
    </div>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
        {number}
      </div>
      <div className="flex-1 space-y-2">
        <h4 className="text-sm font-semibold">{title}</h4>
        <div className="text-xs text-muted-foreground space-y-2">{children}</div>
      </div>
    </div>
  );
}

const ENV_TEMPLATE = `VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key`;

const CONFIG_NOTE = `// src/config/supabase.ts
// Update these two values to point to your Supabase project:
export const SUPABASE_URL = "https://your-project.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "your-anon-key";`;

export default function SelfHostingGuide() {
  const [activeHost, setActiveHost] = useState<"vercel" | "netlify" | "vps">("vercel");

  const hosts = [
    { key: "vercel" as const, label: "Vercel", icon: Globe },
    { key: "netlify" as const, label: "Netlify", icon: Globe },
    { key: "vps" as const, label: "VPS / Docker", icon: Server },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 px-4">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5">
        <BookOpen className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium">Self-Hosting Guide</p>
          <p className="text-muted-foreground mt-1">
            Everything you need to export this project and deploy it anywhere — Vercel, Netlify, a VPS, or any static hosting provider.
          </p>
        </div>
      </div>

      {/* Prerequisites */}
      <div className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <FileCode className="w-4 h-4 text-primary" /> Prerequisites
        </h3>
        <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
          <li>Node.js 18+ and npm/bun installed</li>
          <li>Git installed and project pushed to a GitHub repository</li>
          <li>A Supabase project (the database and edge functions run there)</li>
        </ul>
      </div>

      {/* Step 1: Export */}
      <div className="rounded-xl border border-border bg-card/50 p-4 space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Terminal className="w-4 h-4 text-primary" /> Step 1: Export & Configure
        </h3>
        <Step number={1} title="Connect your GitHub repo">
          <p>In Lovable, go to <strong>Settings → GitHub</strong> and connect your repository. This syncs all code automatically.</p>
        </Step>
        <Step number={2} title="Clone the repo locally">
          <CopyBlock code="git clone https://github.com/your-org/your-repo.git
cd your-repo
npm install" />
        </Step>
        <Step number={3} title="Update Supabase config">
          <p>
            All Supabase references are centralized in <code className="text-[11px] bg-muted px-1 py-0.5 rounded">src/config/supabase.ts</code>.
            Update the URL and anon key to match your Supabase project:
          </p>
          <CopyBlock code={CONFIG_NOTE} label="src/config/supabase.ts" />
        </Step>
        <Step number={4} title="Build the project">
          <CopyBlock code="npm run build" />
          <p>This produces a <code className="text-[11px] bg-muted px-1 py-0.5 rounded">dist/</code> folder with static files ready to deploy.</p>
        </Step>
      </div>

      {/* Step 2: Deploy — tabbed */}
      <div className="rounded-xl border border-border bg-card/50 p-4 space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" /> Step 2: Deploy
        </h3>

        <div className="flex gap-2">
          {hosts.map(h => (
            <Button
              key={h.key}
              variant={activeHost === h.key ? "default" : "outline"}
              size="sm"
              className="text-xs gap-1.5"
              onClick={() => setActiveHost(h.key)}
            >
              <h.icon className="w-3.5 h-3.5" />
              {h.label}
            </Button>
          ))}
        </div>

        {activeHost === "vercel" && (
          <div className="space-y-4">
            <Step number={1} title="Import project on Vercel">
              <p>Go to <a href="https://vercel.com/new" target="_blank" rel="noopener noreferrer" className="text-primary underline">vercel.com/new</a> and import your GitHub repo.</p>
            </Step>
            <Step number={2} title="Configure build settings">
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Framework:</strong> Vite</li>
                <li><strong>Build command:</strong> <code className="text-[11px] bg-muted px-1 py-0.5 rounded">npm run build</code></li>
                <li><strong>Output directory:</strong> <code className="text-[11px] bg-muted px-1 py-0.5 rounded">dist</code></li>
              </ul>
            </Step>
            <Step number={3} title="Add SPA redirect">
              <p>Create a <code className="text-[11px] bg-muted px-1 py-0.5 rounded">vercel.json</code> in the project root:</p>
              <CopyBlock code={`{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}`} label="vercel.json" />
            </Step>
            <Step number={4} title="Deploy">
              <p>Click <strong>Deploy</strong>. Vercel auto-deploys on every push to your main branch.</p>
            </Step>
          </div>
        )}

        {activeHost === "netlify" && (
          <div className="space-y-4">
            <Step number={1} title="Import project on Netlify">
              <p>Go to <a href="https://app.netlify.com/start" target="_blank" rel="noopener noreferrer" className="text-primary underline">app.netlify.com/start</a> and connect your GitHub repo.</p>
            </Step>
            <Step number={2} title="Configure build settings">
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Build command:</strong> <code className="text-[11px] bg-muted px-1 py-0.5 rounded">npm run build</code></li>
                <li><strong>Publish directory:</strong> <code className="text-[11px] bg-muted px-1 py-0.5 rounded">dist</code></li>
              </ul>
            </Step>
            <Step number={3} title="Add SPA redirect">
              <p>Create a <code className="text-[11px] bg-muted px-1 py-0.5 rounded">public/_redirects</code> file:</p>
              <CopyBlock code="/*    /index.html   200" label="public/_redirects" />
            </Step>
            <Step number={4} title="Deploy">
              <p>Click <strong>Deploy site</strong>. Netlify auto-deploys on every push.</p>
            </Step>
          </div>
        )}

        {activeHost === "vps" && (
          <div className="space-y-4">
            <Step number={1} title="Build locally or in CI">
              <CopyBlock code="npm run build" />
            </Step>
            <Step number={2} title="Serve with Nginx">
              <CopyBlock code={`server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/krolist/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}`} label="nginx.conf" />
            </Step>
            <Step number={3} title="Or use Docker">
              <CopyBlock code={`FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80`} label="Dockerfile" />
            </Step>
            <Step number={4} title="Deploy">
              <CopyBlock code={`docker build -t krolist .
docker run -d -p 80:80 krolist`} />
            </Step>
          </div>
        )}
      </div>

      {/* Edge Functions note */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-2">
        <h3 className="text-sm font-semibold flex items-center gap-2 text-amber-600 dark:text-amber-400">
          ⚠️ Edge Functions & Backend
        </h3>
        <p className="text-xs text-muted-foreground">
          Edge functions (price scraping, AI search, service proxy, etc.) run on <strong>Supabase</strong>, not on your hosting provider.
          They deploy automatically when you push to your Supabase project. Your frontend just calls them via the Supabase URL configured in
          <code className="text-[11px] bg-muted px-1 py-0.5 rounded mx-1">src/config/supabase.ts</code>.
        </p>
        <p className="text-xs text-muted-foreground">
          To migrate edge functions to a new Supabase project, use the <strong>Supabase CLI</strong>:
        </p>
        <CopyBlock code={`supabase link --project-ref your-new-project-ref
supabase functions deploy`} />
      </div>

      {/* Checklist */}
      <div className="rounded-xl border border-border bg-card/50 p-4 space-y-3">
        <h3 className="text-sm font-semibold">✅ Pre-Deploy Checklist</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
          {[
            "Update src/config/supabase.ts with your project URL & key",
            "Ensure Supabase edge functions are deployed",
            "Verify Supabase secrets are set (API keys, etc.)",
            "Update favicon, OG images, and meta tags in index.html",
            "Test login & admin access on the new domain",
            "Set up custom domain DNS (CNAME or A record)",
            "Enable HTTPS (auto on Vercel/Netlify, use Certbot on VPS)",
            "Add your new domain to Supabase Auth redirect URLs",
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-background/40 border border-border/30">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
