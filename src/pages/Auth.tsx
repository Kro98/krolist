import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import krolistCircleLogo from "@/assets/krolist-circle-logo.png";
import krolistTextLogo from "@/assets/krolist-text-logo.png";
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
  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
      {/* Header Logo */}
      <div className="absolute top-6 left-8 z-10">
        <img src={krolistTextLogo} alt="Krolist" className="h-8" />
      </div>

      {/* Main Content Container */}
      <div className="flex-1 flex items-center justify-center px-8 py-16">
        <div className="w-full max-w-[1400px] flex items-center justify-between gap-16">
          {/* Left Side - Logo Section */}
          <div className="flex-1 flex flex-col items-start justify-center min-w-[300px]">
            <img src={krolistCircleLogo} alt="Krolist Logo" className="w-64 h-64 object-contain mb-6" />
            <p className="text-lg text-white mb-6">Your ultimate shopping manager.</p>
            <div className="flex gap-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#FDB913] transition-colors">
                <Facebook className="w-6 h-6" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#FDB913] transition-colors">
                <Twitter className="w-6 h-6" />
              </a>
            </div>
          </div>

          {/* Center - Auth Form */}
          <div className="w-[420px] flex-shrink-0">
            <div className="bg-[#2A2A2A] rounded-2xl p-10">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2 text-white flex items-center justify-center gap-2">
                  Welcome to <img src={krolistWelcomeLogo} alt="Krolist" className="h-8" />
                </h1>
                <p className="text-gray-400 text-sm">
                  {isSignUp ? "Create an account to get started" : "Sign in to your account to continue"}
                </p>
              </div>

              {!isSignUp && (
                <>
                  <Button 
                    onClick={handleGoogleSignIn} 
                    disabled={googleLoading}
                    className="w-full h-12 bg-black hover:bg-black/80 text-white font-medium mb-6 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    {googleLoading ? "Signing in..." : "Sign in with Google"}
                  </Button>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-600"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-[#2A2A2A] text-gray-400">or</span>
                    </div>
                  </div>
                </>
              )}

              <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-5">
                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-white text-sm font-normal">
                      Username
                    </Label>
                    <Input 
                      id="username" 
                      name="username" 
                      type="text" 
                      placeholder="johndoe" 
                      className="h-12 bg-[#3A3A3A] border-0 text-white placeholder:text-gray-500 rounded-lg" 
                      required 
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white text-sm font-normal">
                    Email
                  </Label>
                  <Input 
                    id="email" 
                    name={isSignUp ? "signup-email" : "signin-email"} 
                    type="email" 
                    placeholder="john.doe@example.com" 
                    className="h-12 bg-[#3A3A3A] border-0 text-white placeholder:text-gray-500 rounded-lg" 
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white text-sm font-normal">
                    Password
                  </Label>
                  <div className="relative">
                    <Input 
                      id="password" 
                      name={isSignUp ? "signup-password" : "signin-password"} 
                      type={isSignUp ? (showSignUpPassword ? "text" : "password") : (showSignInPassword ? "text" : "password")} 
                      placeholder="••••••••" 
                      className="h-12 bg-[#3A3A3A] border-0 text-white placeholder:text-gray-500 rounded-lg pr-12" 
                      required 
                    />
                    <button 
                      type="button" 
                      onClick={() => isSignUp ? setShowSignUpPassword(!showSignUpPassword) : setShowSignInPassword(!showSignInPassword)} 
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {(isSignUp ? showSignUpPassword : showSignInPassword) ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-[#FDB913] hover:bg-[#FDB913]/90 text-black font-semibold rounded-lg mt-6" 
                  disabled={loading}
                >
                  {loading ? (isSignUp ? "Creating account..." : "Signing in...") : (isSignUp ? "Sign Up" : "Login")}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                <span className="text-gray-400">
                  {isSignUp ? "Already have an account?" : "Don't have an account?"}
                </span>{" "}
                <button 
                  onClick={() => setIsSignUp(!isSignUp)} 
                  className="text-[#4A90E2] hover:underline font-medium"
                >
                  {isSignUp ? "Sign in" : "Create an account"}
                </button>
              </div>
            </div>
          </div>

          {/* Right Side - Resources */}
          <div className="flex-1 flex flex-col items-end justify-center min-w-[200px]">
            <div className="text-right">
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <div className="space-y-3 text-gray-400">
                <div>
                  <Link to="/contact" className="hover:text-white transition-colors">
                    About Us
                  </Link>
                </div>
                <div>
                  <Link to="/contact" className="hover:text-white transition-colors">
                    Support
                  </Link>
                </div>
                <div>
                  <Link to="/contact" className="hover:text-white transition-colors">
                    Help Center
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 left-8">
        <p className="text-gray-400 text-sm">© 2025-2030 Krolist. All rights reserved.</p>
      </div>

      {/* Guest Mode Button - Hidden but accessible */}
      <button 
        onClick={() => {
          continueAsGuest();
          navigate("/products");
        }}
        className="fixed bottom-4 right-4 opacity-0 hover:opacity-100 transition-opacity text-xs text-gray-500 hover:text-gray-300"
      >
        Continue as Guest
      </button>
    </div>
  );
}
