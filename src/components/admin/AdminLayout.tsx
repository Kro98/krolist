import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminRole } from "@/hooks/useAdminRole";
import { FunnyLoadingText } from "@/components/FunnyLoadingText";
import { Shield, LogIn, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, loading: authLoading, signIn } = useAuth();
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

  // Element styles
  const [cardBlur, setCardBlur] = useState(12);
  const [cardOpacity, setCardOpacity] = useState(80);
  const [cardColor, setCardColor] = useState('');
  const [borderBlur, setBorderBlur] = useState(0);
  const [borderOpacity, setBorderOpacity] = useState(50);
  const [borderColor, setBorderColor] = useState('');
  const [headerBlur, setHeaderBlur] = useState(24);
  const [headerOpacity, setHeaderOpacity] = useState(80);
  const [headerColor, setHeaderColor] = useState('');

  // Login form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  // Rate limiting: 3 attempts, then 15-minute lockout
  const MAX_ATTEMPTS = 3;
  const LOCKOUT_MS = 15 * 60 * 1000;
  const STORAGE_KEY = 'admin_login_attempts';

  const getAttemptData = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { count: 0, lockedUntil: 0 };
      return JSON.parse(raw) as { count: number; lockedUntil: number };
    } catch { return { count: 0, lockedUntil: 0 }; }
  };

  const [attemptData, setAttemptData] = useState(getAttemptData);

  const isLocked = useMemo(() => attemptData.lockedUntil > Date.now(), [attemptData]);
  const remainingMinutes = useMemo(() => Math.ceil((attemptData.lockedUntil - Date.now()) / 60000), [attemptData]);

  // Refresh lock state every 30s
  useEffect(() => {
    if (!isLocked) return;
    const t = setInterval(() => setAttemptData(getAttemptData()), 30000);
    return () => clearInterval(t);
  }, [isLocked]);

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
        // Element styles
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    // Check lockout
    const current = getAttemptData();
    if (current.lockedUntil > Date.now()) {
      toast.error('Too many attempts. Try again later.');
      setAttemptData(current);
      return;
    }

    setLoggingIn(true);
    try {
      const { error } = await signIn(email, password, true);
      if (error) {
        const newCount = current.count + 1;
        const locked = newCount >= MAX_ATTEMPTS;
        const data = {
          count: newCount,
          lockedUntil: locked ? Date.now() + LOCKOUT_MS : 0,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        setAttemptData(data);

        if (locked) {
          toast.error('Too many failed attempts. Locked for 15 minutes.');
        } else {
          toast.error(`${error.message || 'Login failed'} (${MAX_ATTEMPTS - newCount} attempts left)`);
        }
      } else {
        // Success — reset attempts
        localStorage.removeItem(STORAGE_KEY);
        setAttemptData({ count: 0, lockedUntil: 0 });
      }
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoggingIn(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <FunnyLoadingText />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h1 className="text-2xl font-bold mb-1">Admin Access</h1>
            <p className="text-sm text-muted-foreground">
              {user ? 'Your account does not have admin privileges.' : 'Sign in with your admin account to continue.'}
            </p>
          </div>

          {!user && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email" className="text-sm font-medium">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loggingIn || isLocked}>
                <LogIn className="w-4 h-4 mr-2" />
                {isLocked ? `Locked (${remainingMinutes}m)` : loggingIn ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen"
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
      {/* Background layer */}
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
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
