import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import krolistCircleLogo from "@/assets/krolist-circle-logo.png";
import krolistHeaderLogo from "@/assets/krolist-header-logo.png";
import krolistWelcomeLogo from "@/assets/krolist-welcome-logo.png";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";
import { Facebook, Twitter, Eye, EyeOff } from "lucide-react";
const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  username: z.string().min(3, "Username must be at least 3 characters").max(20),
  password: z.string().min(6, "Password must be at least 6 characters")
});
const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required")
});
export default function Auth() {
  const navigate = useNavigate();
  const {
    signUp,
    signIn,
    signInWithGoogle,
    user,
    continueAsGuest
  } = useAuth();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  // Redirect if already logged in
  if (user) {
    navigate("/products");
    return null;
  }
  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("signup-email") as string;
    const username = formData.get("username") as string;
    const password = formData.get("signup-password") as string;
    try {
      signUpSchema.parse({
        email,
        username,
        password
      });
      const {
        error
      } = await signUp(email, password, username);
      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("This email is already registered. Please sign in instead.");
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success("Account created! no need to varify go ahead ,log in.");
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      }
    } finally {
      setLoading(false);
    }
  };
  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("signin-email") as string;
    const password = formData.get("signin-password") as string;
    try {
      signInSchema.parse({
        email,
        password
      });
      const {
        error
      } = await signIn(email, password);
      if (error) {
        if (error.message.includes("Invalid")) {
          toast.error("Invalid email or password");
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success("Welcome back!");
        navigate("/products");
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
      }
    } finally {
      setLoading(false);
    }
  };
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const {
        error
      } = await signInWithGoogle();
      if (error) {
        toast.error(error.message || "Failed to sign in with Google");
      }
    } catch (err) {
      toast.error("An error occurred during Google sign-in");
    } finally {
      setGoogleLoading(false);
    }
  };
  const [isSignUp, setIsSignUp] = useState(false);
  return <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="p-6 flex justify-center">
        <img src={krolistHeaderLogo} alt="Krolist" className="h-16 object-contain" />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 pb-20">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Logo */}
          <div className="hidden lg:flex flex-col items-center justify-center">
            <img src={krolistCircleLogo} alt="Krolist Logo" className="w-80 h-80 object-contain mb-8" />
            <p className="text-xl text-gray-400">Your ultimate shopping manager.</p>
          </div>

          {/* Right Side - Auth Form */}
          <div className="w-full max-w-md mx-auto">
            <div className="bg-[#1a1a1a] rounded-lg p-8">
              <div className="text-center mb-10">
                <h1 className="text-4xl font-bold mb-3 text-foreground">
                  Welcome to <img src={krolistWelcomeLogo} alt="Krolist" className="inline h-10 mb-1" />
                </h1>
                <p className="text-muted-foreground text-lg">
                  {isSignUp ? "Create an account to get started" : "Sign in to your account to continue"}
                </p>
              </div>

              {!isSignUp}

              {!isSignUp && <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                </div>}

              <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-6">
                {isSignUp && <div className="space-y-3">
                    <Label htmlFor="username" className="text-foreground text-sm font-medium">
                      Username
                    </Label>
                    <Input id="username" name="username" type="text" placeholder="johndoe" className="h-12 bg-background border-input text-foreground placeholder:text-muted-foreground" required />
                  </div>}

                <div className="space-y-3">
                  <Label htmlFor="email" className="text-foreground text-sm font-medium">
                    Email
                  </Label>
                  <Input id="email" name={isSignUp ? "signup-email" : "signin-email"} type="email" placeholder="john.doe@example.com" className="h-12 bg-background border-input text-foreground placeholder:text-muted-foreground" required />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="password" className="text-foreground text-sm font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Input id="password" name={isSignUp ? "signup-password" : "signin-password"} type={isSignUp ? showSignUpPassword ? "text" : "password" : showSignInPassword ? "text" : "password"} placeholder="••••••••" className="h-12 bg-background border-input text-foreground placeholder:text-muted-foreground pr-12" required />
                    <button type="button" onClick={() => isSignUp ? setShowSignUpPassword(!showSignUpPassword) : setShowSignInPassword(!showSignInPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {(isSignUp ? showSignUpPassword : showSignInPassword) ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base" disabled={loading}>
                  {loading ? isSignUp ? "Creating account..." : "Signing in..." : isSignUp ? "Sign Up" : "Login"}
                </Button>
              </form>

              <div className="mt-8 text-center">
                <span className="text-muted-foreground">
                  {isSignUp ? "Already have an account?" : "Don't have an account?"}
                </span>{" "}
                <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-primary hover:text-primary/80 font-medium transition-colors">
                  {isSignUp ? "Sign in" : "Create an account"}
                </button>
              </div>

              <div className="mt-6 text-center">
                <Button type="button" onClick={() => {
                continueAsGuest();
                navigate("/products");
              }} variant="outline" className="w-full h-12 border-border text-foreground hover:bg-accent hover:text-accent-foreground">
                  Continue as Guest
                </Button>
                <p className="text-sm text-muted-foreground mt-3">
                  Limited features available in guest mode
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="flex items-center gap-6">
            <Facebook className="w-6 h-6 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
            <Twitter className="w-6 h-6 text-muted-foreground hover:text-primary cursor-pointer transition-colors" onClick={() => window.open('https://x.com/Krolist_help?t=FORGVQQEW-wvycDY09pzKg&s=03', '_blank')} />
          </div>

          <div>
            <h3 className="text-foreground font-semibold mb-3 text-lg">Resources</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <Link to="/auth/privacy-policy" className="hover:text-primary cursor-pointer transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/auth/terms-of-service" className="hover:text-primary cursor-pointer transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/auth/contact-us" className="hover:text-primary cursor-pointer transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-8 pt-8 border-t border-border/50 text-center text-muted-foreground">
          © 2025-2030 Krolist. All rights reserved.
        </div>
      </footer>
    </div>;
}