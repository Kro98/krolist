import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { z } from 'zod';
import { useMediaQuery } from '@/hooks/use-media-query';
import MobileAuth from '@/components/auth/MobileAuth';
import TabletAuth from '@/components/auth/TabletAuth';
import DesktopAuth from '@/components/auth/DesktopAuth';

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

  const { signUp, signIn, user, continueAsGuest } = useAuth();
  const navigate = useNavigate();

  // Media queries for device detection
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  if (user) {
    navigate('/products');
    return null;
  }

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
      const validatedData = signInSchema.parse({ email, password });
      const { error } = await signIn(validatedData.email, validatedData.password);

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

  const sharedProps = {
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
  };

  // Render the appropriate component based on screen size
  if (isMobile) {
    return <MobileAuth {...sharedProps} />;
  }

  if (isTablet) {
    return <TabletAuth {...sharedProps} />;
  }

  if (isDesktop) {
    return <DesktopAuth {...sharedProps} />;
  }

  // Fallback to desktop if media queries haven't resolved yet
  return <DesktopAuth {...sharedProps} />;
}
