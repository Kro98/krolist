import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useIntegrations } from "@/hooks/useIntegrations";

/**
 * Auto-injects Google Analytics and Meta Pixel scripts
 * based on Integration Hub settings. No code changes needed —
 * just enable the integration and set the tracking ID in config.
 *
 * Expected service_key / config:
 *   google_analytics  → config.measurement_id  (e.g. "G-XXXXXXXXXX")
 *   meta_pixel        → config.pixel_id        (e.g. "1234567890")
 */
export function TrackingScripts() {
  const { isServiceEnabled, getServiceConfig, isLoading } = useIntegrations();
  const location = useLocation();
  const gaReady = useRef(false);
  const metaReady = useRef(false);

  // ---------- Google Analytics ----------
  useEffect(() => {
    if (isLoading) return;
    const enabled = isServiceEnabled("google_analytics");
    const { measurement_id } = getServiceConfig("google_analytics");

    if (!enabled || !measurement_id || gaReady.current) return;

    // Inject gtag script
    const script = document.createElement("script");
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurement_id}`;
    script.async = true;
    document.head.appendChild(script);

    // Initialise dataLayer
    (window as any).dataLayer = (window as any).dataLayer || [];
    function gtag(...args: any[]) {
      (window as any).dataLayer.push(args);
    }
    (window as any).gtag = gtag;
    gtag("js", new Date());
    gtag("config", measurement_id, { send_page_view: true });

    gaReady.current = true;
  }, [isLoading, isServiceEnabled, getServiceConfig]);

  // GA page-view on route change
  useEffect(() => {
    if (!gaReady.current) return;
    (window as any).gtag?.("config",
      getServiceConfig("google_analytics").measurement_id,
      { page_path: location.pathname + location.search }
    );
  }, [location, getServiceConfig]);

  // ---------- Meta Pixel ----------
  useEffect(() => {
    if (isLoading) return;
    const enabled = isServiceEnabled("meta_pixel");
    const { pixel_id } = getServiceConfig("meta_pixel");

    if (!enabled || !pixel_id || metaReady.current) return;

    // fbq snippet
    const n = (window as any);
    if (n.fbq) return;
    const f: any = n.fbq = function (...args: any[]) {
      f.callMethod ? f.callMethod.apply(f, args) : f.queue.push(args);
    };
    if (!n._fbq) n._fbq = f;
    f.push = f;
    f.loaded = true;
    f.version = "2.0";
    f.queue = [];

    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    script.async = true;
    document.head.appendChild(script);

    // noscript pixel fallback
    const noscript = document.createElement("noscript");
    const img = document.createElement("img");
    img.height = 1;
    img.width = 1;
    img.style.display = "none";
    img.src = `https://www.facebook.com/tr?id=${pixel_id}&ev=PageView&noscript=1`;
    noscript.appendChild(img);
    document.body.appendChild(noscript);

    n.fbq("init", pixel_id);
    n.fbq("track", "PageView");

    metaReady.current = true;
  }, [isLoading, isServiceEnabled, getServiceConfig]);

  // Meta Pixel page-view on route change
  useEffect(() => {
    if (!metaReady.current) return;
    (window as any).fbq?.("track", "PageView");
  }, [location]);

  return null;
}
