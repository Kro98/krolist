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
  return <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center px-4 py-6 md:px-8 md:py-10 lg:px-12 lg:py-16">
      <div className="w-full max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl">
        {/* Logo */}
        <div className="text-center mb-6 md:mb-8 lg:mb-10 animate-fade-in px-0">
          <img src={krolistLogo} alt="Krolist" className="h-12 md:h-14 lg:h-16 xl:h-20 mx-auto mb-3 md:mb-4 lg:mb-5" />
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-1.5 md:mb-2 lg:mb-3 text-center text-warning">Welcome to Krolist</h1>
          <p className="text-sm md:text-base lg:text-lg text-center text-slate-300">collection of cool products and more



























































































































































        </p>
        </div>

        {/* Auth Card */}
        <div className="bg-card border border-border rounded-xl md:rounded-2xl lg:rounded-3xl shadow-lg p-5 md:p-7 lg:p-9 xl:p-10 animate-scale-in mx-0 px-[10px]">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4 md:mb-5 lg:mb-6 h-10 md:h-11 lg:h-12">
              <TabsTrigger value="signin" className="text-sm md:text-base">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="text-sm md:text-base">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4 md:space-y-5 lg:space-y-6 animate-fade-in">
              <form onSubmit={handleSignIn} className="space-y-4 md:space-y-5 lg:space-y-6">
                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="signin-email" className="text-sm md:text-base">Email</Label>
                  <Input id="signin-email" type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required disabled={isLoading} className="h-10 md:h-11 lg:h-12 text-sm md:text-base" />
                </div>

                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="signin-password" className="text-sm md:text-base">Password</Label>
                  <div className="relative">
                    <Input id="signin-password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required disabled={isLoading} className="pr-10 h-10 md:h-11 lg:h-12 text-sm md:text-base" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4 md:w-5 md:h-5" /> : <Eye className="w-4 h-4 md:w-5 md:h-5" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full group h-10 md:h-11 lg:h-12 text-sm md:text-base" disabled={isLoading}>
                  {isLoading ? 'Please wait...' : <>
                      Sign In
                      <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 md:space-y-5 lg:space-y-6 animate-fade-in">
              <form onSubmit={handleSignUp} className="space-y-4 md:space-y-5 lg:space-y-6">
                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="signup-username" className="text-sm md:text-base">Username</Label>
                  <Input id="signup-username" type="text" placeholder="Enter your username" value={username} onChange={e => setUsername(e.target.value)} required disabled={isLoading} className="h-10 md:h-11 lg:h-12 text-sm md:text-base" />
                </div>

                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="signup-email" className="text-sm md:text-base">Email</Label>
                  <Input id="signup-email" type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required disabled={isLoading} className="h-10 md:h-11 lg:h-12 text-sm md:text-base" />
                </div>

                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="signup-password" className="text-sm md:text-base">Password</Label>
                  <div className="relative">
                    <Input id="signup-password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required disabled={isLoading} className="pr-10 h-10 md:h-11 lg:h-12 text-sm md:text-base" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4 md:w-5 md:h-5" /> : <Eye className="w-4 h-4 md:w-5 md:h-5" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full group h-10 md:h-11 lg:h-12 text-sm md:text-base" disabled={isLoading}>
                  {isLoading ? 'Please wait...' : <>
                      Create Account
                      <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-5 md:mt-6 lg:mt-7 space-y-3 md:space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs md:text-sm uppercase">
                <span className="bg-card px-2 md:px-3 text-muted-foreground">Or</span>
              </div>
            </div>

            <Button type="button" variant="outline" className="w-full h-10 md:h-11 lg:h-12 text-sm md:text-base" onClick={handleGuestMode}>
              Continue as Guest
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 md:mt-8 lg:mt-10 space-y-3 md:space-y-4 lg:space-y-5">
          {/* Links */}
          <div className="flex flex-wrap justify-center gap-x-4 md:gap-x-6 lg:gap-x-8 gap-y-2 text-xs md:text-sm lg:text-base">
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
          <div className="flex justify-center gap-3 md:gap-4 lg:gap-5">
            <a href="https://twitter.com/krolist_help" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Twitter">
              <Twitter className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" />
            </a>
            <a href="https://tiktok.com/@krolist_help" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="TikTok">
              <Music className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" />
            </a>
          </div>

          {/* Legal Text */}
          <p className="text-xs md:text-sm px-2 text-center text-primary">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>;
}