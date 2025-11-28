import { useState, useEffect } from 'react';
import { User, LogIn, LogOut, Shield } from 'lucide-react';
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

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="relative">
            <User className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-popover">
          {!user || isGuest ? (
            <DropdownMenuItem onClick={() => setShowAuthModal(true)} className="cursor-pointer">
              <LogIn className="mr-2 h-4 w-4" />
              {t('auth.login') || 'Log In'}
            </DropdownMenuItem>
          ) : (
            <>
              <div className="px-2 py-2 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground truncate font-medium">
                    {username || user.email}
                  </span>
                </div>
                <Badge 
                  variant={isAdmin ? "default" : "secondary"} 
                  className={`text-xs flex items-center gap-1 w-fit ${isAdmin ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                  onClick={isAdmin ? handleAdminClick : undefined}
                >
                  {isAdmin && <Shield className="h-3 w-3" />}
                  {isAdmin ? t('user.admin') : t('user.user')}
                </Badge>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                {t('auth.signOut') || 'Log Out'}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </>
  );
}
