import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, ArrowRight, Twitter, Music } from 'lucide-react';
import krolistLogo from '@/assets/krolist-text-logo-new.png';
interface DesktopAuthProps {
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
  rememberMe: boolean;
  setRememberMe: (remember: boolean) => void;
  handleSignUp: (e: React.FormEvent) => void;
  handleSignIn: (e: React.FormEvent) => void;
  handleGuestMode: () => void;
}
export default function DesktopAuth({
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
  rememberMe,
  setRememberMe,
  handleSignUp,
  handleSignIn,
  handleGuestMode
}: DesktopAuthProps) {
  return <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center px-12 py-16">
      <div className="w-full max-w-lg mx-[10px]">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <img src={krolistLogo} alt="Krolist" className="h-20 mx-auto mb-5" />
          <h1 className="text-4xl font-bold mb-3 text-warning text-center">Welcome to Krolist</h1>
          <p className="text-lg text-muted-foreground text-center">collection of cool products and more</p>
        </div>

        {/* Auth Card */}
        <div className="bg-card border border-border rounded-2xl shadow-xl p-10 animate-scale-in px-[20px] my-[50px] py-[20px] mx-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 h-12">
              <TabsTrigger value="signin" className="text-lg">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="text-lg">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-6 animate-fade-in">
              <form onSubmit={handleSignIn} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="signin-email" className="text-lg">Email</Label>
                  <Input id="signin-email" type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required disabled={isLoading} className="h-12 text-lg" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signin-password" className="text-lg">Password</Label>
                  <div className="relative">
                    <Input id="signin-password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required disabled={isLoading} className="pr-12 h-12 text-lg" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="remember-me" 
                    checked={rememberMe} 
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  />
                  <Label htmlFor="remember-me" className="text-sm font-normal cursor-pointer">
                    Remember me
                  </Label>
                </div>

                <Button type="submit" className="w-full group h-12 text-lg hover:shadow-lg transition-all" disabled={isLoading}>
                  {isLoading ? 'Please wait...' : <>
                      Sign In
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-6 animate-fade-in">
              <form onSubmit={handleSignUp} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="signup-username" className="text-lg">Username</Label>
                  <Input id="signup-username" type="text" placeholder="Enter your username" value={username} onChange={e => setUsername(e.target.value)} required disabled={isLoading} className="h-12 text-lg" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-lg">Email</Label>
                  <Input id="signup-email" type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required disabled={isLoading} className="h-12 text-lg" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-lg">Password</Label>
                  <div className="relative">
                    <Input id="signup-password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required disabled={isLoading} className="pr-12 h-12 text-lg" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full group h-12 text-lg hover:shadow-lg transition-all" disabled={isLoading}>
                  {isLoading ? 'Please wait...' : <>
                      Create Account
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-7 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm uppercase">
                <span className="bg-card px-3 text-muted-foreground">Or</span>
              </div>
            </div>

            <Button type="button" variant="outline" className="w-full h-12 text-lg hover:shadow-md transition-all" onClick={handleGuestMode}>
              Continue as Guest
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 space-y-5">
          {/* Links - Horizontal for desktop */}
          <div className="flex justify-center gap-8 text-base">
            <Link to="/auth/contact-us" className="text-muted-foreground hover:text-foreground transition-colors hover:underline">
              Contact Us
            </Link>
            <Link to="/auth/privacy-policy" className="text-muted-foreground hover:text-foreground transition-colors hover:underline">
              Privacy Policy
            </Link>
            <Link to="/auth/terms-of-service" className="text-muted-foreground hover:text-foreground transition-colors hover:underline">
              Terms of Service
            </Link>
          </div>

          {/* Social Icons */}
          <div className="flex justify-center gap-5">
            <a href="https://twitter.com/krolist_help" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground hover:scale-110 transition-all" aria-label="Twitter">
              <Twitter className="w-6 h-6" />
            </a>
            <a href="https://tiktok.com/@krolist_help" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground hover:scale-110 transition-all" aria-label="TikTok">
              <Music className="w-6 h-6" />
            </a>
          </div>

          {/* Legal Text */}
          <p className="text-sm text-primary text-center">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>;
}