import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessRequest {
  imageUrl: string;
  quality?: number; // 1-100
  addWatermark?: boolean;
  maxWidth?: number;
  maxHeight?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const imageUrl = url.searchParams.get('url');
    const quality = parseInt(url.searchParams.get('quality') || '80');
    const addWatermark = url.searchParams.get('watermark') === 'true';
    const maxWidth = parseInt(url.searchParams.get('maxWidth') || '800');

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'Image URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing image: ${imageUrl}, quality: ${quality}, watermark: ${addWatermark}`);

    // If watermark is requested, return an HTML page with the image and overlay
    // No need to fetch the image - just embed it in the HTML
    if (addWatermark) {
      const html = generateWatermarkedHtml(imageUrl);
      return new Response(html, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html',
          'Cache-Control': 'public, max-age=31536000',
        },
      });
    }

    // For non-watermarked images, redirect to the original with cache headers
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': imageUrl,
        'Cache-Control': 'public, max-age=31536000',
      },
    });

  } catch (error) {
    console.error('Image processing error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process image' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateWatermarkedHtml(imageUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Krolist Sticker</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0a0a0a;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .container {
      position: relative;
      display: inline-block;
      max-width: 100%;
      max-height: 100vh;
    }
    .sticker-image {
      max-width: 100%;
      max-height: 100vh;
      display: block;
      object-fit: contain;
    }
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-size: clamp(40px, 15vw, 120px);
      font-weight: 900;
      color: rgba(255, 255, 255, 0.25);
      text-transform: uppercase;
      letter-spacing: 8px;
      pointer-events: none;
      user-select: none;
      white-space: nowrap;
      text-shadow: 
        2px 2px 4px rgba(0,0,0,0.3),
        -2px -2px 4px rgba(0,0,0,0.3);
    }
    .watermark-small {
      position: absolute;
      bottom: 20px;
      right: 20px;
      font-size: 14px;
      color: rgba(255, 255, 255, 0.4);
      pointer-events: none;
      user-select: none;
    }
    /* Prevent right-click save */
    .container::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: transparent;
    }
  </style>
</head>
<body oncontextmenu="return false;">
  <div class="container">
    <img 
      src="${imageUrl}" 
      alt="Krolist Sticker" 
      class="sticker-image"
      draggable="false"
    />
    <div class="watermark">KROLIST</div>
    <div class="watermark-small">© krolist.com</div>
  </div>
  <script>
    // Disable keyboard shortcuts for saving
    document.addEventListener('keydown', function(e) {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        return false;
      }
    });
    // Disable drag
    document.querySelectorAll('img').forEach(img => {
      img.addEventListener('dragstart', e => e.preventDefault());
    });
  </script>
</body>
</html>`;
}
