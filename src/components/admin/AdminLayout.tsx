import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminRole } from "@/hooks/useAdminRole";
import { FunnyLoadingText } from "@/components/FunnyLoadingText";
import { Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

  const fetchBg = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('page_content')
        .select('page_key, content_en')
        .in('page_key', ['admin_bg_image', 'admin_bg_blur', 'admin_bg_opacity']);
      if (data) {
        data.forEach(row => {
          if (row.page_key === 'admin_bg_image') setBgImage(row.content_en || '');
          if (row.page_key === 'admin_bg_blur') setBgBlur(Number(row.content_en) || 0);
          if (row.page_key === 'admin_bg_opacity') setBgOpacity(Number(row.content_en) || 20);
        });
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

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Background layer */}
      {bgImage && (
        <div className="fixed inset-0 z-0 pointer-events-none">
          <img
            src={bgImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              filter: `blur(${bgBlur}px)`,
              opacity: bgOpacity / 100,
            }}
          />
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px]" />
        </div>
      )}
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
