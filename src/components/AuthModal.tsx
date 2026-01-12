import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
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

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const { signUp, signIn } = useAuth();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isArabic = language === 'ar';

  const signUpSchema = z.object({
    username: z.string().min(3, t('auth.usernameMin')),
    email: z.string().email(t('auth.invalidEmail')),
    password: z.string().min(6, t('auth.passwordMin'))
  });

  const signInSchema = z.object({
    email: z.string().email(t('auth.invalidEmail')),
    password: z.string().min(6, t('auth.passwordMin'))
  });

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const validatedData = signUpSchema.parse({ username, email, password });
      const { error } = await signUp(validatedData.email, validatedData.password, validatedData.username);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(t('auth.accountCreated'));
        onOpenChange(false);
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
        toast.success(t('auth.welcomeBack'));
        onOpenChange(false);
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
            {t('auth.welcomeTo')}
          </h2>
          <p className={`${isMobile ? 'text-sm' : 'text-base'} text-muted-foreground text-center`}>
            {t('auth.collectionOfCool')}
          </p>
        </div>

        {/* Auth Form */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full grid-cols-2 mb-4 ${isMobile ? 'h-9' : 'h-11'}`}>
            <TabsTrigger value="signin" className={isMobile ? 'text-sm' : 'text-base'}>{t('auth.signIn')}</TabsTrigger>
            <TabsTrigger value="signup" className={isMobile ? 'text-sm' : 'text-base'}>{t('auth.signUp')}</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className={`space-y-${isMobile ? '3' : '4'} animate-fade-in`}>
            <form onSubmit={handleSignIn} className={`space-y-${isMobile ? '3' : '4'}`}>
              <div className="space-y-2">
                <Label htmlFor="signin-email" className={isMobile ? 'text-sm' : 'text-base'}>{t('auth.email')}</Label>
                <Input 
                  id="signin-email" 
                  type="email" 
                  placeholder={t('auth.enterEmail')} 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required 
                  disabled={isLoading}
                  className={isMobile ? 'h-9 text-sm' : 'h-10 text-base'}
                  dir={isArabic ? 'rtl' : 'ltr'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signin-password" className={isMobile ? 'text-sm' : 'text-base'}>{t('auth.password')}</Label>
                <div className="relative">
                  <Input 
                    id="signin-password" 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder={t('auth.enterPassword')} 
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

              <div className={`flex items-center ${isArabic ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                <input 
                  type="checkbox" 
                  id="remember-me" 
                  checked={rememberMe} 
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className={`${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} rounded border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2`}
                />
                <Label htmlFor="remember-me" className={`${isMobile ? 'text-xs' : 'text-sm'} font-normal cursor-pointer`}>
                  {t('auth.rememberMe')}
                </Label>
              </div>

              <Button 
                type="submit" 
                className={`w-full group ${isMobile ? 'h-9 text-sm' : 'h-10 text-base'} hover:shadow-lg transition-all`}
                disabled={isLoading}
              >
                {isLoading ? t('auth.pleaseWait') : (
                  <>
                    {t('auth.signIn')}
                    <ArrowRight className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} ${isArabic ? 'mr-2 rotate-180' : 'ml-2'} group-hover:translate-x-1 transition-transform`} />
                  </>
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className={`space-y-${isMobile ? '3' : '4'} animate-fade-in`}>
            <form onSubmit={handleSignUp} className={`space-y-${isMobile ? '3' : '4'}`}>
              <div className="space-y-2">
                <Label htmlFor="signup-username" className={isMobile ? 'text-sm' : 'text-base'}>{t('auth.username')}</Label>
                <Input 
                  id="signup-username" 
                  type="text" 
                  placeholder={t('auth.enterUsername')} 
                  value={username} 
                  onChange={e => setUsername(e.target.value)} 
                  required 
                  disabled={isLoading}
                  className={isMobile ? 'h-9 text-sm' : 'h-10 text-base'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email" className={isMobile ? 'text-sm' : 'text-base'}>{t('auth.email')}</Label>
                <Input 
                  id="signup-email" 
                  type="email" 
                  placeholder={t('auth.enterEmail')} 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required 
                  disabled={isLoading}
                  className={isMobile ? 'h-9 text-sm' : 'h-10 text-base'}
                  dir={isArabic ? 'rtl' : 'ltr'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password" className={isMobile ? 'text-sm' : 'text-base'}>{t('auth.password')}</Label>
                <div className="relative">
                  <Input 
                    id="signup-password" 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder={t('auth.enterPassword')} 
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
                {isLoading ? t('auth.pleaseWait') : (
                  <>
                    {t('auth.createAccount')}
                    <ArrowRight className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} ${isArabic ? 'mr-2 rotate-180' : 'ml-2'} group-hover:translate-x-1 transition-transform`} />
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