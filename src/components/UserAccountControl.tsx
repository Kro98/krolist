import { useState, useEffect } from 'react';
import { User, LogOut, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { AuthModal } from './AuthModal';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export function UserAccountControl() {
  const { user, isGuest, signOut } = useAuth();
  const { t } = useLanguage();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [username, setUsername] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchUsername();
    checkAdminRole();
  }, [user, t]);

  const checkAdminRole = async () => {
    if (!user || isGuest) {
      setIsAdmin(false);
      return;
    }
    
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();
    
    setIsAdmin(!!data);
  };

  const fetchUsername = async () => {
    // Check if user is in guest mode
    if (isGuest) {
      setUsername(t('user.guest'));
      return;
    }
    
    if (!user) return;
    
    const { data, error } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();
    
    if (data) {
      setUsername(data.username);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success(t('auth.signOutSuccess') || 'Signed out successfully');
  };

  const handleAdminClick = () => {
    window.location.href = '/admin';
  };

  // For guests, directly open auth modal instead of dropdown
  if (!user || isGuest) {
    return (
      <>
        <Button 
          variant="outline" 
          size="icon" 
          className="relative"
          onClick={() => setShowAuthModal(true)}
        >
          <User className="h-5 w-5" />
        </Button>
        <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
      </>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="relative rounded-full">
            <User className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="w-64 backdrop-blur-xl bg-background/80 border border-border/50 shadow-xl rounded-xl overflow-hidden"
        >
          {/* User Profile Section */}
          <div className="p-4 bg-gradient-to-br from-primary/5 to-primary/10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {username || user.email?.split('@')[0]}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </div>
            
            {/* Role Badge */}
            <div className="mt-3">
              <Badge 
                variant={isAdmin ? "default" : "secondary"} 
                className={`text-xs flex items-center gap-1.5 w-fit px-2.5 py-1 ${
                  isAdmin 
                    ? 'cursor-pointer hover:opacity-90 transition-all bg-primary/90 hover:bg-primary shadow-sm' 
                    : 'bg-muted/50'
                }`}
                onClick={isAdmin ? handleAdminClick : undefined}
              >
                {isAdmin && <Shield className="h-3 w-3" />}
                {isAdmin ? t('user.admin') : t('user.user')}
              </Badge>
            </div>
          </div>
          
          <DropdownMenuSeparator className="bg-border/30" />
          
          {/* Sign Out Action */}
          <div className="p-2">
            <DropdownMenuItem 
              onClick={handleSignOut} 
              className="cursor-pointer text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg px-3 py-2.5 transition-colors"
            >
              <LogOut className="mr-2.5 h-4 w-4" />
              <span className="font-medium">{t('auth.signOut') || 'Log Out'}</span>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </>
  );
}
