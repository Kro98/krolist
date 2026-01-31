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
import { Eye, EyeOff, ArrowRight, Mail, Lock, User, AlertCircle } from 'lucide-react';
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
  const [errors, setErrors] = useState<{ email?: string; password?: string; username?: string }>({});

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

  const clearErrors = () => setErrors({});

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    clearErrors();
    try {
      const validatedData = signUpSchema.parse({ username, email, password });
      const { error } = await signUp(validatedData.email, validatedData.password, validatedData.username);
      if (error) {
        if (error.message.toLowerCase().includes('email')) {
          setErrors({ email: error.message });
        } else if (error.message.toLowerCase().includes('password')) {
          setErrors({ password: error.message });
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success(t('auth.accountCreated'));
        onOpenChange(false);
        setUsername('');
        setEmail('');
        setPassword('');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: { email?: string; password?: string; username?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0] === 'email') newErrors.email = err.message;
          if (err.path[0] === 'password') newErrors.password = err.message;
          if (err.path[0] === 'username') newErrors.username = err.message;
        });
        setErrors(newErrors);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    clearErrors();
    try {
      const validatedData = signInSchema.parse({ email, password });
      const { error } = await signIn(validatedData.email, validatedData.password, rememberMe);
      if (error) {
        // Check for user not found or invalid credentials
        if (error.message.toLowerCase().includes('invalid') || 
            error.message.toLowerCase().includes('not found') ||
            error.message.toLowerCase().includes('user')) {
          setErrors({ email: t('auth.userNotFound') || 'User not found', password: ' ' });
        } else if (error.message.toLowerCase().includes('password')) {
          setErrors({ password: error.message });
        } else {
          setErrors({ email: error.message });
        }
      } else {
        toast.success(t('auth.welcomeBack'));
        onOpenChange(false);
        setEmail('');
        setPassword('');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: { email?: string; password?: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0] === 'email') newErrors.email = err.message;
          if (err.path[0] === 'password') newErrors.password = err.message;
        });
        setErrors(newErrors);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const inputBaseClasses = `
    bg-background/50 border-border/50 
    focus:border-primary/50 focus:ring-primary/20
    placeholder:text-muted-foreground/50
    transition-all duration-200
  `;

  const inputErrorClasses = `
    border-destructive/70 bg-destructive/5
    focus:border-destructive focus:ring-destructive/20
    text-destructive
  `;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={`
          ${isMobile ? 'max-w-[95vw] p-5' : 'max-w-md p-0'} 
          backdrop-blur-2xl bg-background/90 
          border border-border/40 
          shadow-2xl rounded-2xl 
          overflow-hidden
          data-[state=open]:animate-scale-in
          data-[state=closed]:animate-scale-out
        `}
      >
        {/* Gradient Background Decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none animate-fade-in" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none animate-[fade-in_0.5s_ease-out_0.1s_both]" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none animate-[fade-in_0.5s_ease-out_0.2s_both]" />
        
        <div className={`relative z-10 ${isMobile ? '' : 'p-8'}`}>
          {/* Logo Section */}
          <div className={`text-center ${isMobile ? 'mb-5' : 'mb-8'} animate-[fade-in_0.4s_ease-out_0.1s_both]`}>
            <div className="relative inline-block animate-[scale-in_0.3s_ease-out_0.15s_both]">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150 opacity-50 animate-pulse" />
              <img 
                src={krolistLogo} 
                alt="Krolist" 
                className={`${isMobile ? 'h-14' : 'h-16'} mx-auto relative z-10 drop-shadow-lg`} 
              />
            </div>
            <h2 className={`${isMobile ? 'text-xl mt-3' : 'text-2xl mt-4'} font-bold text-warning animate-[fade-in_0.4s_ease-out_0.2s_both]`}>
              {t('auth.welcomeTo')}
            </h2>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground/80 mt-1 animate-[fade-in_0.4s_ease-out_0.25s_both]`}>
              {t('auth.collectionOfCool')}
            </p>
          </div>

          {/* Auth Form */}
          <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); clearErrors(); }} className="w-full animate-[fade-in_0.4s_ease-out_0.3s_both]">
            <TabsList className={`grid w-full grid-cols-2 ${isMobile ? 'mb-4 h-10' : 'mb-6 h-11'} bg-muted/30 backdrop-blur-sm rounded-xl p-1`}>
              <TabsTrigger 
                value="signin" 
                className={`${isMobile ? 'text-sm' : 'text-sm'} rounded-lg data-[state=active]:bg-background/80 data-[state=active]:shadow-sm transition-all duration-200`}
              >
                {t('auth.signIn')}
              </TabsTrigger>
              <TabsTrigger 
                value="signup" 
                className={`${isMobile ? 'text-sm' : 'text-sm'} rounded-lg data-[state=active]:bg-background/80 data-[state=active]:shadow-sm transition-all duration-200`}
              >
                {t('auth.signUp')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4 animate-fade-in">
              <form onSubmit={handleSignIn} className="space-y-4">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="signin-email" className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-foreground/80 flex items-center gap-2`}>
                    <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                    {t('auth.email')}
                  </Label>
                  <div className="relative">
                    <Input 
                      id="signin-email" 
                      type="email" 
                      placeholder={t('auth.enterEmail')} 
                      value={email} 
                      onChange={e => { setEmail(e.target.value); if (errors.email) clearErrors(); }}
                      required 
                      disabled={isLoading}
                      className={`
                        ${isMobile ? 'h-10 text-sm' : 'h-11 text-sm'} 
                        rounded-xl
                        ${inputBaseClasses}
                        ${errors.email ? inputErrorClasses : ''}
                      `}
                      dir={isArabic ? 'rtl' : 'ltr'}
                    />
                    {errors.email && errors.email !== ' ' && (
                      <div className="flex items-center gap-1.5 mt-1.5 text-destructive">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span className="text-xs">{errors.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="signin-password" className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-foreground/80 flex items-center gap-2`}>
                    <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                    {t('auth.password')}
                  </Label>
                  <div className="relative">
                    <Input 
                      id="signin-password" 
                      type={showPassword ? 'text' : 'password'} 
                      placeholder={t('auth.enterPassword')} 
                      value={password} 
                      onChange={e => { setPassword(e.target.value); if (errors.password) clearErrors(); }}
                      required 
                      disabled={isLoading}
                      className={`
                        ${isMobile ? 'pr-10 h-10 text-sm' : 'pr-12 h-11 text-sm'}
                        rounded-xl
                        ${inputBaseClasses}
                        ${errors.password ? inputErrorClasses : ''}
                      `}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute ${isMobile ? 'right-3' : 'right-4'} top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors`}
                    >
                      {showPassword ? <EyeOff className={isMobile ? 'w-4 h-4' : 'w-4.5 h-4.5'} /> : <Eye className={isMobile ? 'w-4 h-4' : 'w-4.5 h-4.5'} />}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className={`flex items-center gap-2.5`}>
                  <input 
                    type="checkbox" 
                    id="remember-me" 
                    checked={rememberMe} 
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded-md border-border/50 text-primary focus:ring-2 focus:ring-primary/30 focus:ring-offset-0 bg-background/50 cursor-pointer"
                  />
                  <Label htmlFor="remember-me" className={`${isMobile ? 'text-xs' : 'text-sm'} font-normal cursor-pointer text-muted-foreground`}>
                    {t('auth.rememberMe')}
                  </Label>
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className={`
                    w-full group 
                    ${isMobile ? 'h-10 text-sm' : 'h-11 text-sm'} 
                    rounded-xl
                    bg-gradient-to-r from-primary to-primary/90
                    hover:from-primary/90 hover:to-primary
                    shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30
                    transition-all duration-300
                  `}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t('auth.pleaseWait')}
                    </div>
                  ) : (
                    <>
                      {t('auth.signIn')}
                      <ArrowRight className={`w-4 h-4 ${isArabic ? 'mr-2 rotate-180' : 'ml-2'} group-hover:translate-x-1 transition-transform`} />
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 animate-fade-in">
              <form onSubmit={handleSignUp} className="space-y-4">
                {/* Username Field */}
                <div className="space-y-2">
                  <Label htmlFor="signup-username" className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-foreground/80 flex items-center gap-2`}>
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    {t('auth.username')}
                  </Label>
                  <div className="relative">
                    <Input 
                      id="signup-username" 
                      type="text" 
                      placeholder={t('auth.enterUsername')} 
                      value={username} 
                      onChange={e => { setUsername(e.target.value); if (errors.username) clearErrors(); }}
                      required 
                      disabled={isLoading}
                      className={`
                        ${isMobile ? 'h-10 text-sm' : 'h-11 text-sm'}
                        rounded-xl
                        ${inputBaseClasses}
                        ${errors.username ? inputErrorClasses : ''}
                      `}
                    />
                    {errors.username && (
                      <div className="flex items-center gap-1.5 mt-1.5 text-destructive">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span className="text-xs">{errors.username}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-foreground/80 flex items-center gap-2`}>
                    <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                    {t('auth.email')}
                  </Label>
                  <div className="relative">
                    <Input 
                      id="signup-email" 
                      type="email" 
                      placeholder={t('auth.enterEmail')} 
                      value={email} 
                      onChange={e => { setEmail(e.target.value); if (errors.email) clearErrors(); }}
                      required 
                      disabled={isLoading}
                      className={`
                        ${isMobile ? 'h-10 text-sm' : 'h-11 text-sm'}
                        rounded-xl
                        ${inputBaseClasses}
                        ${errors.email ? inputErrorClasses : ''}
                      `}
                      dir={isArabic ? 'rtl' : 'ltr'}
                    />
                    {errors.email && (
                      <div className="flex items-center gap-1.5 mt-1.5 text-destructive">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span className="text-xs">{errors.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-foreground/80 flex items-center gap-2`}>
                    <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                    {t('auth.password')}
                  </Label>
                  <div className="relative">
                    <Input 
                      id="signup-password" 
                      type={showPassword ? 'text' : 'password'} 
                      placeholder={t('auth.enterPassword')} 
                      value={password} 
                      onChange={e => { setPassword(e.target.value); if (errors.password) clearErrors(); }}
                      required 
                      disabled={isLoading}
                      className={`
                        ${isMobile ? 'pr-10 h-10 text-sm' : 'pr-12 h-11 text-sm'}
                        rounded-xl
                        ${inputBaseClasses}
                        ${errors.password ? inputErrorClasses : ''}
                      `}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute ${isMobile ? 'right-3' : 'right-4'} top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors`}
                    >
                      {showPassword ? <EyeOff className={isMobile ? 'w-4 h-4' : 'w-4.5 h-4.5'} /> : <Eye className={isMobile ? 'w-4 h-4' : 'w-4.5 h-4.5'} />}
                    </button>
                    {errors.password && (
                      <div className="flex items-center gap-1.5 mt-1.5 text-destructive">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span className="text-xs">{errors.password}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className={`
                    w-full group 
                    ${isMobile ? 'h-10 text-sm' : 'h-11 text-sm'} 
                    rounded-xl
                    bg-gradient-to-r from-primary to-primary/90
                    hover:from-primary/90 hover:to-primary
                    shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30
                    transition-all duration-300
                  `}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t('auth.pleaseWait')}
                    </div>
                  ) : (
                    <>
                      {t('auth.createAccount')}
                      <ArrowRight className={`w-4 h-4 ${isArabic ? 'mr-2 rotate-180' : 'ml-2'} group-hover:translate-x-1 transition-transform`} />
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* Footer */}
          <p className={`text-center ${isMobile ? 'text-[10px] mt-4' : 'text-xs mt-6'} text-muted-foreground/60`}>
            {t('auth.agreeToTerms') || 'By continuing, you agree to our Terms of Service'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
