import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Free Google Translate API (no API key required).
 * Falls back to MyMemory translation API if Google fails.
 * No Lovable dependency.
 */
async function translateWithGoogle(text: string, sourceLang: string, targetLang: string): Promise<string> {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;

  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });

  if (!response.ok) {
    throw new Error(`Google Translate returned ${response.status}`);
  }

  const data = await response.json();

  // Google returns nested arrays: [[["translated text","original text",null,null,x],...]]
  if (!Array.isArray(data) || !Array.isArray(data[0])) {
    throw new Error("Unexpected Google Translate response format");
  }

  const translated = data[0]
    .filter((segment: any) => Array.isArray(segment) && segment[0])
    .map((segment: any) => segment[0])
    .join('');

  if (!translated) {
    throw new Error("Empty translation result from Google");
  }

  return translated;
}

async function translateWithMyMemory(text: string, sourceLang: string, targetLang: string): Promise<string> {
  const langPair = `${sourceLang}|${targetLang}`;
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`MyMemory returned ${response.status}`);
  }

  const data = await response.json();
  const translated = data?.responseData?.translatedText;

  if (!translated) {
    throw new Error("No translation from MyMemory");
  }

  return translated;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, targetLanguage } = await req.json();

    if (!text || !targetLanguage) {
      return new Response(
        JSON.stringify({ error: 'Text and targetLanguage are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sourceLang = targetLanguage === 'ar' ? 'en' : 'ar';
    const targetLang = targetLanguage === 'ar' ? 'ar' : 'en';

    let translatedText: string;

    try {
      // Primary: Google Translate (free, no key)
      translatedText = await translateWithGoogle(text, sourceLang, targetLang);
    } catch (googleError) {
      console.warn("Google Translate failed, falling back to MyMemory:", googleError);
      try {
        // Fallback: MyMemory (free, no key, 5000 chars/day limit for anonymous)
        translatedText = await translateWithMyMemory(text, sourceLang, targetLang);
      } catch (mmError) {
        console.error("Both translation services failed:", mmError);
        throw new Error("All translation services unavailable. Please try again later.");
      }
    }

    return new Response(
      JSON.stringify({ translatedText }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Translation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
