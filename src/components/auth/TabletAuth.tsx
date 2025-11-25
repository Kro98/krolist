import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, ArrowRight, Twitter, Music } from 'lucide-react';
import krolistLogo from '@/assets/krolist-text-logo-new.png';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';

interface TabletAuthProps {
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

export default function TabletAuth({
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
}: TabletAuthProps) {
  useSwipeGesture({
    onSwipeLeft: () => {
      if (activeTab === 'signin') setActiveTab('signup');
    },
    onSwipeRight: () => {
      if (activeTab === 'signup') setActiveTab('signin');
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center px-8 py-10">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6 animate-fade-in">
          <img src={krolistLogo} alt="Krolist" className="h-14 mx-auto mb-3" />
          <h1 className="text-2xl font-bold mb-2 text-warning">Welcome to Krolist</h1>
          <p className="text-base text-muted-foreground">collection of cool products and more</p>
        </div>

        {/* Auth Card */}
        <div className="bg-card border border-border rounded-xl shadow-lg p-6 animate-scale-in">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-5 h-10">
              <TabsTrigger value="signin" className="text-base">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="text-base">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4 animate-fade-in">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email" className="text-base">Email</Label>
                  <Input 
                    id="signin-email" 
                    type="email" 
                    placeholder="Enter your email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                    disabled={isLoading} 
                    className="h-10 text-base" 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signin-password" className="text-base">Password</Label>
                  <div className="relative">
                    <Input 
                      id="signin-password" 
                      type={showPassword ? 'text' : 'password'} 
                      placeholder="Enter your password" 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      required 
                      disabled={isLoading} 
                      className="pr-10 h-10 text-base" 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full group h-10 text-base" disabled={isLoading}>
                  {isLoading ? 'Please wait...' : (
                    <>
                      Sign In
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 animate-fade-in">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-username" className="text-base">Username</Label>
                  <Input 
                    id="signup-username" 
                    type="text" 
                    placeholder="Enter your username" 
                    value={username} 
                    onChange={e => setUsername(e.target.value)} 
                    required 
                    disabled={isLoading} 
                    className="h-10 text-base" 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-base">Email</Label>
                  <Input 
                    id="signup-email" 
                    type="email" 
                    placeholder="Enter your email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                    disabled={isLoading} 
                    className="h-10 text-base" 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-base">Password</Label>
                  <div className="relative">
                    <Input 
                      id="signup-password" 
                      type={showPassword ? 'text' : 'password'} 
                      placeholder="Enter your password" 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      required 
                      disabled={isLoading} 
                      className="pr-10 h-10 text-base" 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full group h-10 text-base" disabled={isLoading}>
                  {isLoading ? 'Please wait...' : (
                    <>
                      Create Account
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-5 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm uppercase">
                <span className="bg-card px-3 text-muted-foreground">Or</span>
              </div>
            </div>

            <Button 
              type="button" 
              variant="outline" 
              className="w-full h-10 text-base" 
              onClick={handleGuestMode}
            >
              Continue as Guest
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-7 space-y-4">
          {/* Links - Two columns for tablet */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
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
            <a 
              href="https://twitter.com/krolist_help" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-muted-foreground hover:text-foreground transition-colors" 
              aria-label="Twitter"
            >
              <Twitter className="w-5 h-5" />
            </a>
            <a 
              href="https://tiktok.com/@krolist_help" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-muted-foreground hover:text-foreground transition-colors" 
              aria-label="TikTok"
            >
              <Music className="w-5 h-5" />
            </a>
          </div>

          {/* Legal Text */}
          <p className="text-sm text-center text-primary">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
