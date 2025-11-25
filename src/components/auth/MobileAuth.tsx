import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, ArrowRight, Twitter, Music } from 'lucide-react';
import krolistLogo from '@/assets/krolist-text-logo-new.png';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
interface MobileAuthProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  username: string;
  setUsername: (username: string) => void;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  isLoading: boolean;
  handleSignUp: (e: React.FormEvent) => void;
  handleSignIn: (e: React.FormEvent) => void;
  handleGuestMode: () => void;
}
export default function MobileAuth({
  activeTab,
  setActiveTab,
  showPassword,
  setShowPassword,
  username,
  setUsername,
  email,
  setEmail,
  password,
  setPassword,
  isLoading,
  handleSignUp,
  handleSignIn,
  handleGuestMode
}: MobileAuthProps) {
  useSwipeGesture({
    onSwipeLeft: () => {
      if (activeTab === 'signin') setActiveTab('signup');
    },
    onSwipeRight: () => {
      if (activeTab === 'signup') setActiveTab('signin');
    }
  });
  return <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-4 animate-fade-in px-0 py-0 my-0">
          <img src={krolistLogo} alt="Krolist" className="h-10 mx-auto mb-2" />
          <h1 className="text-xl font-bold mb-1 text-warning text-center">Welcome to Krolist</h1>
          <p className="text-sm text-muted-foreground text-center">collection of cool products and more</p>
        </div>

        {/* Auth Card */}
        <div className="bg-card border border-border rounded-lg shadow-md p-4 animate-scale-in">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4 h-9">
              <TabsTrigger value="signin" className="text-sm">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="text-sm">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-3 animate-fade-in">
              <form onSubmit={handleSignIn} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="signin-email" className="text-sm">Email</Label>
                  <Input id="signin-email" type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required disabled={isLoading} className="h-9 text-sm" />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="signin-password" className="text-sm">Password</Label>
                  <div className="relative">
                    <Input id="signin-password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required disabled={isLoading} className="pr-10 h-9 text-sm" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full group h-9 text-sm" disabled={isLoading}>
                  {isLoading ? 'Please wait...' : <>
                      Sign In
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-3 animate-fade-in">
              <form onSubmit={handleSignUp} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="signup-username" className="text-sm">Username</Label>
                  <Input id="signup-username" type="text" placeholder="Enter your username" value={username} onChange={e => setUsername(e.target.value)} required disabled={isLoading} className="h-9 text-sm" />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="signup-email" className="text-sm">Email</Label>
                  <Input id="signup-email" type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required disabled={isLoading} className="h-9 text-sm" />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="signup-password" className="text-sm">Password</Label>
                  <div className="relative">
                    <Input id="signup-password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required disabled={isLoading} className="pr-10 h-9 text-sm" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full group h-9 text-sm" disabled={isLoading}>
                  {isLoading ? 'Please wait...' : <>
                      Create Account
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-4 space-y-3">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <Button type="button" variant="outline" className="w-full h-9 text-sm" onClick={handleGuestMode}>
              Continue as Guest
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 space-y-3">
          {/* Links - Stacked for mobile */}
          <div className="flex flex-col items-center gap-2 text-xs">
            <Link to="/auth/contact-us" className="text-muted-foreground hover:text-foreground transition-colors">
              Contact Us
            </Link>
            <Link to="/auth/privacy-policy" className="text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link to="/auth/terms-of-service" className="text-muted-foreground hover:text-foreground transition-colors">
              Terms of Service
            </Link>
          </div>

          {/* Social Icons */}
          <div className="flex justify-center gap-4">
            <a href="https://twitter.com/krolist_help" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Twitter">
              <Twitter className="w-4 h-4" />
            </a>
            <a href="https://tiktok.com/@krolist_help" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="TikTok">
              <Music className="w-4 h-4" />
            </a>
          </div>

          {/* Legal Text */}
          <p className="text-xs px-2 text-primary text-center">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>;
}