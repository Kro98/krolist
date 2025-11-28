import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { z } from 'zod';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import krolistLogo from '@/assets/krolist-text-logo-new.png';

const signUpSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const { signUp, signIn } = useAuth();
  const isMobile = useMediaQuery('(max-width: 767px)');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const validatedData = signUpSchema.parse({ username, email, password });
      const { error } = await signUp(validatedData.email, validatedData.password, validatedData.username);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Account created! Please check your email to verify.');
        onOpenChange(false);
        // Reset form
        setUsername('');
        setEmail('');
        setPassword('');
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
      const validatedData = signInSchema.parse({ email, password });
      const { error } = await signIn(validatedData.email, validatedData.password, rememberMe);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Welcome back!');
        onOpenChange(false);
        // Reset form
        setEmail('');
        setPassword('');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${isMobile ? 'max-w-[95vw] p-4' : 'max-w-lg p-8'} bg-card border-border`}>
        {/* Logo */}
        <div className={`text-center ${isMobile ? 'mb-4' : 'mb-6'} animate-fade-in`}>
          <img src={krolistLogo} alt="Krolist" className={`${isMobile ? 'h-12' : 'h-16'} mx-auto mb-3`} />
          <h2 className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold mb-2 text-warning text-center`}>
            Welcome to Krolist
          </h2>
          <p className={`${isMobile ? 'text-sm' : 'text-base'} text-muted-foreground text-center`}>
            collection of cool products and more
          </p>
        </div>

        {/* Auth Form */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full grid-cols-2 mb-4 ${isMobile ? 'h-9' : 'h-11'}`}>
            <TabsTrigger value="signin" className={isMobile ? 'text-sm' : 'text-base'}>Sign In</TabsTrigger>
            <TabsTrigger value="signup" className={isMobile ? 'text-sm' : 'text-base'}>Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className={`space-y-${isMobile ? '3' : '4'} animate-fade-in`}>
            <form onSubmit={handleSignIn} className={`space-y-${isMobile ? '3' : '4'}`}>
              <div className="space-y-2">
                <Label htmlFor="signin-email" className={isMobile ? 'text-sm' : 'text-base'}>Email</Label>
                <Input 
                  id="signin-email" 
                  type="email" 
                  placeholder="Enter your email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required 
                  disabled={isLoading}
                  className={isMobile ? 'h-9 text-sm' : 'h-10 text-base'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signin-password" className={isMobile ? 'text-sm' : 'text-base'}>Password</Label>
                <div className="relative">
                  <Input 
                    id="signin-password" 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="Enter your password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    required 
                    disabled={isLoading}
                    className={`${isMobile ? 'pr-10 h-9 text-sm' : 'pr-12 h-10 text-base'}`}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute ${isMobile ? 'right-3' : 'right-4'} top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors`}
                  >
                    {showPassword ? <EyeOff className={isMobile ? 'w-4 h-4' : 'w-5 h-5'} /> : <Eye className={isMobile ? 'w-4 h-4' : 'w-5 h-5'} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="remember-me" 
                  checked={rememberMe} 
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} rounded border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2`}
                />
                <Label htmlFor="remember-me" className={`${isMobile ? 'text-xs' : 'text-sm'} font-normal cursor-pointer`}>
                  Remember me
                </Label>
              </div>

              <Button 
                type="submit" 
                className={`w-full group ${isMobile ? 'h-9 text-sm' : 'h-10 text-base'} hover:shadow-lg transition-all`}
                disabled={isLoading}
              >
                {isLoading ? 'Please wait...' : (
                  <>
                    Sign In
                    <ArrowRight className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} ml-2 group-hover:translate-x-1 transition-transform`} />
                  </>
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className={`space-y-${isMobile ? '3' : '4'} animate-fade-in`}>
            <form onSubmit={handleSignUp} className={`space-y-${isMobile ? '3' : '4'}`}>
              <div className="space-y-2">
                <Label htmlFor="signup-username" className={isMobile ? 'text-sm' : 'text-base'}>Username</Label>
                <Input 
                  id="signup-username" 
                  type="text" 
                  placeholder="Enter your username" 
                  value={username} 
                  onChange={e => setUsername(e.target.value)} 
                  required 
                  disabled={isLoading}
                  className={isMobile ? 'h-9 text-sm' : 'h-10 text-base'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email" className={isMobile ? 'text-sm' : 'text-base'}>Email</Label>
                <Input 
                  id="signup-email" 
                  type="email" 
                  placeholder="Enter your email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required 
                  disabled={isLoading}
                  className={isMobile ? 'h-9 text-sm' : 'h-10 text-base'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password" className={isMobile ? 'text-sm' : 'text-base'}>Password</Label>
                <div className="relative">
                  <Input 
                    id="signup-password" 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="Enter your password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    required 
                    disabled={isLoading}
                    className={`${isMobile ? 'pr-10 h-9 text-sm' : 'pr-12 h-10 text-base'}`}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute ${isMobile ? 'right-3' : 'right-4'} top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors`}
                  >
                    {showPassword ? <EyeOff className={isMobile ? 'w-4 h-4' : 'w-5 h-5'} /> : <Eye className={isMobile ? 'w-4 h-4' : 'w-5 h-5'} />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                className={`w-full group ${isMobile ? 'h-9 text-sm' : 'h-10 text-base'} hover:shadow-lg transition-all`}
                disabled={isLoading}
              >
                {isLoading ? 'Please wait...' : (
                  <>
                    Create Account
                    <ArrowRight className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} ml-2 group-hover:translate-x-1 transition-transform`} />
                  </>
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
