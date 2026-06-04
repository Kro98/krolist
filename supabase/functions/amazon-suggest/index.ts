// Public edge function: proxies Amazon's autocomplete suggestions API.
// No auth required (verify_jwt = false).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const prefix = (url.searchParams.get("q") || "").trim();
    const market = url.searchParams.get("market") || "sa"; // amazon.sa

    if (!prefix) {
      return new Response(JSON.stringify({ suggestions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Marketplace IDs
    const mids: Record<string, string> = {
      sa: "A17E79C6D8DWNP", // amazon.sa
      ae: "A2VIGQ35RCS4UG", // amazon.ae
      com: "ATVPDKIKX0DER", // amazon.com
    };
    const mid = mids[market] ?? mids.sa;

    const params = new URLSearchParams({
      "session-id": "000-0000000-0000000",
      "customer-id": "",
      "request-id": crypto.randomUUID(),
      "page-type": "Gateway",
      lop: "en_US",
      "site-variant": "desktop",
      "client-info": "amazon-search-ui",
      mid,
      alias: "aps",
      b2b: "0",
      fresh: "0",
      ks: "71",
      prefix,
      event: "onKeyPress",
      limit: "11",
      fb: "1",
      "suggestion-type": "KEYWORD",
    });

    const target = `https://completion.amazon.${market}/api/2017/suggestions?${params.toString()}`;

    const resp = await fetch(target, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        Accept: "application/json, text/plain, */*",
      },
    });

    if (!resp.ok) {
      return new Response(
        JSON.stringify({ suggestions: [], error: `upstream ${resp.status}` }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const data = await resp.json();
    const suggestions: string[] = Array.isArray(data?.suggestions)
      ? data.suggestions
          .map((s: any) => (typeof s?.value === "string" ? s.value : null))
          .filter((s: string | null): s is string => !!s)
      : [];

    return new Response(JSON.stringify({ suggestions }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=120",
      },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ suggestions: [], error: String(e) }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
