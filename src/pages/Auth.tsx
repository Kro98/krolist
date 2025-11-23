import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { z } from 'zod';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Twitter } from 'lucide-react';
import { Music } from 'lucide-react';
import krolistLogo from '@/assets/krolist-text-logo-new.png';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
const signUpSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});
const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});
export default function Auth() {
  const [activeTab, setActiveTab] = useState('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const {
    signUp,
    signIn,
    user,
    continueAsGuest
  } = useAuth();
  const navigate = useNavigate();
  if (user) {
    navigate('/products');
    return null;
  }
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const validatedData = signUpSchema.parse({
        username,
        email,
        password
      });
      const {
        error
      } = await signUp(validatedData.email, validatedData.password, validatedData.username);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Account created! Please check your email to verify.');
        navigate('/products');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    } finally {
      setIsLoading(false);
    }
  };
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const validatedData = signInSchema.parse({
        email,
        password
      });
      const {
        error
      } = await signIn(validatedData.email, validatedData.password);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Welcome back!');
        navigate('/products');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    } finally {
      setIsLoading(false);
    }
  };
  const handleGuestMode = () => {
    continueAsGuest();
    navigate('/products');
  };
  useSwipeGesture({
    onSwipeLeft: () => {
      if (activeTab === 'signin') setActiveTab('signup');
    },
    onSwipeRight: () => {
      if (activeTab === 'signup') setActiveTab('signin');
    }
  });
  return <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md md:max-w-lg lg:max-w-xl mx-auto">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <img src={krolistLogo} alt="Krolist" className="h-16 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome to Krolist</h1>
          <p className="text-muted-foreground">collection of cool products and more



























































































































































        </p>
        </div>

        {/* Auth Card */}
        <div className="bg-card border border-border rounded-2xl shadow-lg p-8 animate-scale-in mx-0 px-[15px] py-[15px]">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-6 animate-fade-in">
              <form onSubmit={handleSignIn} className="space-y-6 px-0 mx-0">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input id="signin-email" type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required disabled={isLoading} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <div className="relative">
                    <Input id="signin-password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required disabled={isLoading} className="pr-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full group" disabled={isLoading}>
                  {isLoading ? 'Please wait...' : <>
                      Sign In
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-6 animate-fade-in">
              <form onSubmit={handleSignUp} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="signup-username">Username</Label>
                  <Input id="signup-username" type="text" placeholder="Enter your username" value={username} onChange={e => setUsername(e.target.value)} required disabled={isLoading} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required disabled={isLoading} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input id="signup-password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required disabled={isLoading} className="pr-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full group" disabled={isLoading}>
                  {isLoading ? 'Please wait...' : <>
                      Create Account
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <Button type="button" variant="outline" className="w-full" onClick={handleGuestMode}>
              Continue as Guest
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 space-y-4">
          {/* Links */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            <Link 
              to="/auth/contact-us" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Contact Us
            </Link>
            <Link 
              to="/auth/privacy-policy" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
            <Link 
              to="/auth/terms-of-service" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
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
          <p className="text-center text-xs text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>;
}