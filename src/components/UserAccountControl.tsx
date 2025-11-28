import { useState } from 'react';
import { User, LogIn, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from './AuthModal';
import { toast } from 'sonner';

export function UserAccountControl() {
  const { user, isGuest, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="relative">
            <User className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-popover">
          {!user || isGuest ? (
            <DropdownMenuItem onClick={() => setShowAuthModal(true)} className="cursor-pointer">
              <LogIn className="mr-2 h-4 w-4" />
              Log In
            </DropdownMenuItem>
          ) : (
            <>
              <div className="px-2 py-1.5 text-sm font-medium border-b">
                {user.email}
              </div>
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Log Out
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </>
  );
}
