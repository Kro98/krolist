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

  const [cardBlur, setCardBlur] = useState(12);
  const [cardOpacity, setCardOpacity] = useState(80);
  const [cardColor, setCardColor] = useState('');
  const [borderBlur, setBorderBlur] = useState(0);
  const [borderOpacity, setBorderOpacity] = useState(50);
  const [borderColor, setBorderColor] = useState('');
  const [headerBlur, setHeaderBlur] = useState(24);
  const [headerOpacity, setHeaderOpacity] = useState(80);
  const [headerColor, setHeaderColor] = useState('');

  const fetchBg = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('page_content')
        .select('page_key, content_en')
        .in('page_key', [
          'admin_bg_image', 'admin_bg_blur', 'admin_bg_opacity',
          'admin_bg_overlay', 'admin_bg_brightness', 'admin_bg_saturation',
          'admin_bg_scale', 'admin_bg_pos_x', 'admin_bg_pos_y',
          'admin_el_card_blur', 'admin_el_card_opacity', 'admin_el_card_color',
          'admin_el_border_blur', 'admin_el_border_opacity', 'admin_el_border_color',
          'admin_el_header_blur', 'admin_el_header_opacity', 'admin_el_header_color',
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
        if (m['admin_el_card_blur'] !== undefined) setCardBlur(Number(m['admin_el_card_blur']));
        if (m['admin_el_card_opacity'] !== undefined) setCardOpacity(Number(m['admin_el_card_opacity']));
        if (m['admin_el_card_color'] !== undefined) setCardColor(m['admin_el_card_color']);
        if (m['admin_el_border_blur'] !== undefined) setBorderBlur(Number(m['admin_el_border_blur']));
        if (m['admin_el_border_opacity'] !== undefined) setBorderOpacity(Number(m['admin_el_border_opacity']));
        if (m['admin_el_border_color'] !== undefined) setBorderColor(m['admin_el_border_color']);
        if (m['admin_el_header_blur'] !== undefined) setHeaderBlur(Number(m['admin_el_header_blur']));
        if (m['admin_el_header_opacity'] !== undefined) setHeaderOpacity(Number(m['admin_el_header_opacity']));
        if (m['admin_el_header_color'] !== undefined) setHeaderColor(m['admin_el_header_color']);
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchBg();
    const handler = () => fetchBg();
    window.addEventListener('admin-bg-updated', handler);
    return () => window.removeEventListener('admin-bg-updated', handler);
  }, [fetchBg]);

  // Set element style CSS variables on <html> so they're available site-wide
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--admin-card-blur', `${cardBlur}px`);
    root.style.setProperty('--admin-card-opacity', String(cardOpacity / 100));
    root.style.setProperty('--admin-card-color', cardColor || '');
    root.style.setProperty('--admin-border-blur', `${borderBlur}px`);
    root.style.setProperty('--admin-border-opacity', String(borderOpacity / 100));
    root.style.setProperty('--admin-border-color', borderColor || '');
    root.style.setProperty('--admin-header-blur', `${headerBlur}px`);
    root.style.setProperty('--admin-header-opacity', String(headerOpacity / 100));
    root.style.setProperty('--admin-header-color', headerColor || '');
    return () => {
      // Clean up when unmounted
      ['--admin-card-blur','--admin-card-opacity','--admin-card-color',
       '--admin-border-blur','--admin-border-opacity','--admin-border-color',
       '--admin-header-blur','--admin-header-opacity','--admin-header-color',
      ].forEach(v => root.style.removeProperty(v));
    };
  }, [cardBlur, cardOpacity, cardColor, borderBlur, borderOpacity, borderColor, headerBlur, headerOpacity, headerColor]);

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
