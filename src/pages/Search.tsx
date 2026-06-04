import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Search as SearchIcon, Info, Newspaper, Sparkles, Trash2, History, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getAffiliateTag } from "@/config/stores";
import { useSectionLocks } from "@/hooks/useSectionLocks";
import { AffiliateInfoPage } from "@/components/affiliate/AffiliateInfoPage";
import { FunnyLoadingText } from "@/components/FunnyLoadingText";
import { Footer } from "@/components/Footer";
import krolistLogo from "@/assets/krolist-logo.png";
import amazonIcon from "@/assets/shop-icons/amazon-icon.png";

interface SearchProduct {
  id: string;
  title: string;
  image_url: string | null;
  store: string;
  product_url: string;
}

const HISTORY_KEY = "krolist_search_history_v1";
const MAX_HISTORY = 20;

function readHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writeHistory(items: string[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, MAX_HISTORY)));
  } catch {
    /* ignore */
  }
}

export default function SearchPage() {
  const { language } = useLanguage();
  const sectionLocks = useSectionLocks();
  const [params, setParams] = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState(params.get("q") ?? "");
  const [history, setHistory] = useState<string[]>(() => readHistory());
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInfoPage, setShowInfoPage] = useState(false);

  // Load product strip
  useEffect(() => {
    supabase
      .from("krolist_products")
      .select("id, title, image_url, store, product_url")
      .eq("is_featured", true)
      .eq("availability_status", "available")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setProducts((data as SearchProduct[]) || []);
        setLoading(false);
      });
  }, []);

  // If arriving with ?q=, auto-trigger Amazon redirect once
  const autoFiredRef = useRef(false);
  useEffect(() => {
    const initial = params.get("q");
    if (!autoFiredRef.current && initial && initial.trim()) {
      autoFiredRef.current = true;
      // Save to history
      const next = [initial.trim(), ...history.filter((h) => h !== initial.trim())].slice(0, MAX_HISTORY);
      setHistory(next);
      writeHistory(next);
      goAmazon(initial.trim());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goAmazon = useCallback((q: string) => {
    const tag = getAffiliateTag("amazon");
    const url = `https://www.amazon.sa/s?k=${encodeURIComponent(q)}&linkCode=sl2&tag=${tag}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  const submitSearch = useCallback(
    (raw?: string) => {
      const q = (raw ?? query).trim();
      if (!q) return;
      const next = [q, ...history.filter((h) => h !== q)].slice(0, MAX_HISTORY);
      setHistory(next);
      writeHistory(next);
      setParams({ q }, { replace: true });
      goAmazon(q);
    },
    [query, history, goAmazon, setParams]
  );

  const purgeHistory = () => {
    setHistory([]);
    writeHistory([]);
  };

  const removeHistoryItem = (item: string) => {
    const next = history.filter((h) => h !== item);
    setHistory(next);
    writeHistory(next);
  };

  const t = (ar: string, en: string) => (language === "ar" ? ar : en);

  return (
    <div
      className="min-h-screen bg-background flex flex-col"
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      <Helmet>
        <title>{t("ابحث على أمازون | Krolist", "Search on Amazon | Krolist")}</title>
        <meta
          name="description"
          content={t(
            "ابحث على أمازون مباشرة عبر Krolist مع تتبّع تابع وعمولة.",
            "Search Amazon directly through Krolist with affiliate tracking."
          )}
        />
        <link rel="canonical" href="https://krolist.com/search" />
      </Helmet>

      <AffiliateInfoPage isOpen={showInfoPage} onClose={() => setShowInfoPage(false)} />

      {/* Header (matches AffiliateMode style, no notification) */}
      <header
        className="sticky top-0 z-50 h-16 flex items-center justify-between border-b px-4"
        style={{
          backdropFilter: `blur(var(--admin-header-blur, 12px))`,
          WebkitBackdropFilter: `blur(var(--admin-header-blur, 12px))`,
          backgroundColor: `var(--admin-header-color, hsl(var(--card) / var(--admin-header-opacity, 0.95)))`,
          borderColor: `var(--admin-border-color, hsl(var(--border) / var(--admin-border-opacity, 0.5)))`,
        }}
      >
        <div className="flex items-center gap-2">
          {!sectionLocks.articles && (
            <Link
              to="/articles"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-muted/50 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <Newspaper className="w-4 h-4" />
              <span className="hidden sm:inline">{t("مقالات", "Articles")}</span>
            </Link>
          )}
          {!sectionLocks.stickers && (
            <Link
              to="/stickers"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-muted/50 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">{t("ملصقات", "Stickers")}</span>
            </Link>
          )}
        </div>

        <Link to="/" className="flex items-center gap-2">
          <img src={krolistLogo} alt="Krolist" className="h-8 object-contain" />
        </Link>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowInfoPage(true)}
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            aria-label={t("الأسئلة الشائعة", "FAQ")}
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 pb-20 max-w-5xl w-full mx-auto">
        {/* Hero / Search */}
        <section className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
            {t("ابحث على أمازون", "Search on Amazon")}
          </h1>
          <p className="text-sm text-muted-foreground mb-5">
            {t(
              "اكتب ما تريد ثم اضغط بحث — سنفتح نتائج أمازون فوراً عبر رابطنا التابع.",
              "Type what you want and hit search — we'll open Amazon results instantly via our affiliate link."
            )}
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitSearch();
            }}
            className="relative max-w-2xl mx-auto flex gap-2"
          >
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("ابحث عن أي منتج…", "Search any product…")}
                className="pl-10 h-12 text-base"
              />
            </div>
            <Button type="submit" size="lg" className="h-12 px-5 gap-2">
              <img src={amazonIcon} alt="" className="w-5 h-5" />
              <span className="hidden sm:inline">{t("بحث", "Search")}</span>
            </Button>
          </form>
        </section>

        {/* Search history */}
        <section className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <History className="w-4 h-4" />
              <span>{t("سجل البحث", "Search history")}</span>
            </div>
            {history.length > 0 && (
              <button
                onClick={purgeHistory}
                className="flex items-center gap-1.5 text-xs text-destructive hover:underline"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {t("مسح الكل", "Purge all")}
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <p className="text-xs text-muted-foreground/70 italic">
              {t("لا يوجد سجل بعد.", "No history yet.")}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {history.map((h) => (
                <span
                  key={h}
                  className="group inline-flex items-center gap-1 pl-3 pr-1.5 py-1.5 rounded-full bg-muted/60 hover:bg-muted text-sm border border-border/50"
                >
                  <button
                    onClick={() => {
                      setQuery(h);
                      submitSearch(h);
                    }}
                    className="text-foreground/90"
                  >
                    {h}
                  </button>
                  <button
                    onClick={() => removeHistoryItem(h)}
                    className="w-5 h-5 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    aria-label={t("حذف", "Remove")}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Featured products – horizontal scroll, name + image + store only */}
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-lg font-semibold">
              {t("منتجات مختارة", "Featured items")}
            </h2>
            <Link to="/" className="text-xs text-primary hover:underline">
              {t("عرض الكل", "View all")}
            </Link>
          </div>

          {loading ? (
            <div className="py-10 flex justify-center">
              <FunnyLoadingText />
            </div>
          ) : products.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("لا توجد منتجات حالياً.", "No products available.")}
            </p>
          ) : (
            <div
              className={cn(
                "flex gap-3 overflow-x-auto pb-3 -mx-4 px-4",
                "snap-x snap-mandatory scroll-smooth",
                "[scrollbar-width:thin]"
              )}
            >
              {products.map((p) => (
                <a
                  key={p.id}
                  href={p.product_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group snap-start shrink-0 w-40 sm:w-44 rounded-xl border border-border/60 bg-card hover:border-primary/40 hover:shadow-md transition-all overflow-hidden"
                >
                  <div className="relative aspect-square bg-muted/40">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.title}
                        loading="lazy"
                        className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">
                        📦
                      </div>
                    )}
                    <span className="absolute top-1.5 left-1.5 text-[10px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded-md bg-background/90 border border-border/60 text-muted-foreground">
                      {p.store}
                    </span>
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-medium line-clamp-2 leading-snug text-foreground/90">
                      {p.title}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
