import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminRole } from "@/hooks/useAdminRole";
import { FunnyLoadingText } from "@/components/FunnyLoadingText";
import { supabase } from "@/integrations/supabase/client";
import { AdminLoginPage } from "./AdminLoginPage";
import { AnimatePresence, motion } from "framer-motion";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useAdminRole();
  const isLoading = authLoading || roleLoading;

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <FunnyLoadingText />
      </div>
    );
  }

  const isAuthenticated = !!user && isAdmin;

  return (
    <AnimatePresence mode="wait">
      {!isAuthenticated ? (
        <motion.div
          key="admin-login"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.04, filter: "blur(8px)" }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <AdminLoginPage hasUser={!!user} />
        </motion.div>
      ) : (
        <motion.div
          key="admin-dashboard"
          className="relative min-h-screen"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20, filter: "blur(6px)" }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          style={{
            '--admin-card-blur': `${cardBlur}px`,
            '--admin-card-opacity': cardOpacity / 100,
            '--admin-card-color': cardColor || undefined,
            '--admin-border-blur': `${borderBlur}px`,
            '--admin-border-opacity': borderOpacity / 100,
            '--admin-border-color': borderColor || undefined,
            '--admin-header-blur': `${headerBlur}px`,
            '--admin-header-opacity': headerOpacity / 100,
            '--admin-header-color': headerColor || undefined,
          } as React.CSSProperties}
        >
          {bgImage && (
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
          )}
          <div className="relative z-10">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
