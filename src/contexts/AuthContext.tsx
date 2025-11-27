import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isGuest: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    // Load guest status from localStorage
    const guestStatus = localStorage.getItem('isGuest') === 'true';
    setIsGuest(guestStatus);

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        // Clear guest mode when user signs in
        if (session?.user) {
          setIsGuest(false);
          localStorage.removeItem('isGuest');
        }
        
        // Handle remember me functionality
        if (session?.user && !sessionStorage.getItem('rememberMeSession')) {
          // User has a session but no session marker - check if they want to be remembered
          const rememberMe = localStorage.getItem('rememberMe') === 'true';
          if (!rememberMe) {
            // User didn't want to be remembered and tab was closed/reopened
            setTimeout(() => {
              supabase.auth.signOut();
            }, 0);
          }
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Check remember me on initial load
      if (session?.user) {
        const rememberMe = localStorage.getItem('rememberMe') === 'true';
        if (!rememberMe && !sessionStorage.getItem('rememberMeSession')) {
          // Sign out if user didn't want to be remembered
          setTimeout(() => {
            supabase.auth.signOut();
          }, 0);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          username
        }
      }
    });
    
    return { error };
  };

  const signIn = async (email: string, password: string, rememberMe: boolean = true) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (!error) {
      // Store remember me preference
      localStorage.setItem('rememberMe', rememberMe.toString());
      
      if (rememberMe) {
        // Mark this session as valid for the browser session
        sessionStorage.setItem('rememberMeSession', 'true');
      } else {
        // Don't create a session marker - session will be cleared on tab close
        sessionStorage.removeItem('rememberMeSession');
      }
    }
    
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/products`
      }
    });
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsGuest(false);
    localStorage.removeItem('isGuest');
    // Redirect to auth page after logout
    window.location.href = '/auth';
  };

  const continueAsGuest = () => {
    setIsGuest(true);
    localStorage.setItem('isGuest', 'true');
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isGuest, signUp, signIn, signInWithGoogle, signOut, continueAsGuest }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
