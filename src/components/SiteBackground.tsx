import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function SiteBackground() {
  const [bgImage, setBgImage] = useState("");
  const [bgBlur, setBgBlur] = useState(0);
  const [bgOpacity, setBgOpacity] = useState(20);
  const [bgOverlay, setBgOverlay] = useState(60);
  const [bgBrightness, setBgBrightness] = useState(100);
  const [bgSaturation, setBgSaturation] = useState(100);
  const [bgScale, setBgScale] = useState(100);
  const [bgPosX, setBgPosX] = useState(50);
  const [bgPosY, setBgPosY] = useState(50);

  const fetchBg = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('page_content')
        .select('page_key, content_en')
        .in('page_key', [
          'admin_bg_image', 'admin_bg_blur', 'admin_bg_opacity',
          'admin_bg_overlay', 'admin_bg_brightness', 'admin_bg_saturation',
          'admin_bg_scale', 'admin_bg_pos_x', 'admin_bg_pos_y',
        ]);
      if (data) {
        const m: Record<string, string> = {};
        data.forEach(row => { m[row.page_key] = row.content_en; });
        if (m['admin_bg_image']) setBgImage(m['admin_bg_image']);
        if (m['admin_bg_blur']) setBgBlur(Number(m['admin_bg_blur']));
        if (m['admin_bg_opacity']) setBgOpacity(Number(m['admin_bg_opacity']));
        if (m['admin_bg_overlay']) setBgOverlay(Number(m['admin_bg_overlay']));
        if (m['admin_bg_brightness']) setBgBrightness(Number(m['admin_bg_brightness']));
        if (m['admin_bg_saturation']) setBgSaturation(Number(m['admin_bg_saturation']));
        if (m['admin_bg_scale']) setBgScale(Number(m['admin_bg_scale']));
        if (m['admin_bg_pos_x']) setBgPosX(Number(m['admin_bg_pos_x']));
        if (m['admin_bg_pos_y']) setBgPosY(Number(m['admin_bg_pos_y']));
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchBg();
    const handler = () => fetchBg();
    window.addEventListener('admin-bg-updated', handler);
    return () => window.removeEventListener('admin-bg-updated', handler);
  }, [fetchBg]);

  if (!bgImage) return null;

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <img
        src={bgImage}
        alt=""
        className="absolute inset-0 w-full h-full"
        style={{
          filter: `blur(${bgBlur}px) brightness(${bgBrightness}%) saturate(${bgSaturation}%)`,
          opacity: bgOpacity / 100,
          objectFit: 'cover',
          objectPosition: `${bgPosX}% ${bgPosY}%`,
          transform: `scale(${bgScale / 100})`,
        }}
      />
      <div className="absolute inset-0" style={{ backgroundColor: `hsl(var(--background) / ${bgOverlay / 100})` }} />
    </div>
  );
}
