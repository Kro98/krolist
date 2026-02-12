import { useState, useMemo, useEffect } from "react";
import { Shield, LogIn, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { edgeFunctionUrl } from "@/config/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
import krolistLogo from "@/assets/krolist-welcome-logo.png";

interface AdminLoginPageProps {
  hasUser: boolean;
}

export function AdminLoginPage({ hasUser }: AdminLoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  const MAX_ATTEMPTS = 3;
  const LOCKOUT_MS = 15 * 60 * 1000;
  const STORAGE_KEY = "admin_login_attempts";

  const getAttemptData = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { count: 0, lockedUntil: 0 };
      return JSON.parse(raw) as { count: number; lockedUntil: number };
    } catch {
      return { count: 0, lockedUntil: 0 };
    }
  };

  const [attemptData, setAttemptData] = useState(getAttemptData);
  const isLocked = useMemo(() => attemptData.lockedUntil > Date.now(), [attemptData]);
  const remainingMinutes = useMemo(
    () => Math.ceil((attemptData.lockedUntil - Date.now()) / 60000),
    [attemptData]
  );

  useEffect(() => {
    if (!isLocked) return;
    const t = setInterval(() => setAttemptData(getAttemptData()), 30000);
    return () => clearInterval(t);
  }, [isLocked]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    const current = getAttemptData();
    if (current.lockedUntil > Date.now()) {
      toast.error("Too many attempts. Try again later.");
      setAttemptData(current);
      return;
    }

    setLoggingIn(true);
    try {
      const res = await fetch(edgeFunctionUrl("admin-login-guard"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await res.json();

      if (res.status === 429) {
        const data = {
          count: MAX_ATTEMPTS,
          lockedUntil: Date.now() + (result.remaining_minutes || 30) * 60 * 1000,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        setAttemptData(data);
        toast.error(result.error || "Too many failed attempts.");
        return;
      }

      if (!res.ok) {
        const newCount = current.count + 1;
        const locked = newCount >= MAX_ATTEMPTS;
        const data = {
          count: newCount,
          lockedUntil: locked ? Date.now() + LOCKOUT_MS : 0,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        setAttemptData(data);

        if (locked) {
          toast.error("Too many failed attempts. Locked for 15 minutes.");
        } else {
          const left = result.attempts_left ?? MAX_ATTEMPTS - newCount;
          toast.error(`${result.error || "Login failed"} (${left} attempts left)`);
        }
        return;
      }

      if (result.session) {
        await supabase.auth.setSession({
          access_token: result.session.access_token,
          refresh_token: result.session.refresh_token,
        });
      }
      localStorage.removeItem(STORAGE_KEY);
      setAttemptData({ count: 0, lockedUntil: 0 });
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(215,25%,10%)] via-[hsl(220,30%,15%)] to-[hsl(215,25%,8%)]" />

      {/* Animated orbs */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full opacity-20"
        style={{
          background: "radial-gradient(circle, hsl(31 98% 51% / 0.4), transparent 70%)",
          filter: "blur(80px)",
        }}
        animate={{
          x: [0, 100, -50, 0],
          y: [0, -80, 60, 0],
          scale: [1, 1.2, 0.9, 1],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full opacity-15"
        style={{
          background: "radial-gradient(circle, hsl(210 60% 50% / 0.4), transparent 70%)",
          filter: "blur(80px)",
          right: "10%",
          top: "20%",
        }}
        animate={{
          x: [0, -60, 80, 0],
          y: [0, 100, -40, 0],
          scale: [1, 0.8, 1.1, 1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-[300px] h-[300px] rounded-full opacity-10"
        style={{
          background: "radial-gradient(circle, hsl(280 60% 50% / 0.3), transparent 70%)",
          filter: "blur(60px)",
          left: "15%",
          bottom: "10%",
        }}
        animate={{
          x: [0, 50, -30, 0],
          y: [0, -60, 40, 0],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(0 0% 100%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100%) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Back button */}
      <motion.a
        href="/"
        className="absolute top-6 left-6 z-20 inline-flex items-center gap-2 text-sm text-[hsl(0,0%,100%,0.5)] hover:text-[hsl(0,0%,100%,0.9)] transition-colors"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to site
      </motion.a>

      {/* Login card */}
      <motion.div
        className="relative z-10 w-full max-w-sm mx-4"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="rounded-2xl border border-[hsl(0,0%,100%,0.08)] bg-[hsl(0,0%,100%,0.04)] backdrop-blur-2xl p-8 shadow-2xl">
          {/* Logo & header */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.5 }}
          >
            <motion.img
              src={krolistLogo}
              alt="Krolist"
              className="h-16 mx-auto mb-5"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="flex items-center justify-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold text-[hsl(0,0%,100%,0.95)]">Admin Access</h1>
            </div>
            <p className="text-sm text-[hsl(0,0%,100%,0.45)]">
              {hasUser
                ? "Your account does not have admin privileges."
                : "Sign in with your admin account to continue."}
            </p>
          </motion.div>

          {/* Login form */}
          {!hasUser && (
            <motion.form
              onSubmit={handleLogin}
              className="space-y-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="space-y-2">
                <Label htmlFor="admin-email" className="text-sm font-medium text-[hsl(0,0%,100%,0.7)]">
                  Email
                </Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  className="bg-[hsl(0,0%,100%,0.06)] border-[hsl(0,0%,100%,0.1)] text-[hsl(0,0%,100%,0.9)] placeholder:text-[hsl(0,0%,100%,0.25)] focus-visible:ring-primary/50 focus-visible:border-primary/40"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password" className="text-sm font-medium text-[hsl(0,0%,100%,0.7)]">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    className="pr-10 bg-[hsl(0,0%,100%,0.06)] border-[hsl(0,0%,100%,0.1)] text-[hsl(0,0%,100%,0.9)] placeholder:text-[hsl(0,0%,100%,0.25)] focus-visible:ring-primary/50 focus-visible:border-primary/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(0,0%,100%,0.3)] hover:text-[hsl(0,0%,100%,0.7)] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                disabled={loggingIn || isLocked}
              >
                <LogIn className="w-4 h-4 mr-2" />
                {isLocked
                  ? `Locked (${remainingMinutes}m)`
                  : loggingIn
                  ? "Signing in..."
                  : "Sign In"}
              </Button>
            </motion.form>
          )}
        </div>

        {/* Subtle glow under card */}
        <div
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 opacity-20 blur-2xl rounded-full"
          style={{ background: "hsl(31 98% 51% / 0.5)" }}
        />
      </motion.div>
    </div>
  );
}
