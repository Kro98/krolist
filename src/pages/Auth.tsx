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
  password: z.string().min(6, "Password must be at least 6 characters"),
});
const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
export default function Auth() {
  const navigate = useNavigate();
  const { signUp, signIn, signInWithGoogle, user, continueAsGuest } = useAuth();
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
        password,
      });
      const { error } = await signUp(email, password, username);
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
        password,
      });
      const { error } = await signIn(email, password);
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
      const { error } = await signInWithGoogle();
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
    <div className="min-h-screen bg-black text-white flex flex-col">
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
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">
                  Welcome to <img src={krolistWelcomeLogo} alt="Krolist" className="inline h-8 mb-1" />
                </h1>
                <p className="text-gray-400">
                  {isSignUp ? "Create an account to get started" : "Sign in to your account to continue"}
                </p>
              </div>

              {!isSignUp}

              {!isSignUp && (
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-700"></div>
                  </div>
                </div>
              )}

              <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-white">
                      Username
                    </Label>
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      placeholder="johndoe"
                      className="bg-[#2a2a2a] border-gray-700 text-white placeholder:text-gray-500"
                      required
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name={isSignUp ? "signup-email" : "signin-email"}
                    type="email"
                    placeholder="john.doe@example.com"
                    className="bg-[#2a2a2a] border-gray-700 text-white placeholder:text-gray-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name={isSignUp ? "signup-password" : "signin-password"}
                      type={
                        isSignUp ? (showSignUpPassword ? "text" : "password") : showSignInPassword ? "text" : "password"
                      }
                      placeholder="••••••••"
                      className="bg-[#2a2a2a] border-gray-700 text-white placeholder:text-gray-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        isSignUp
                          ? setShowSignUpPassword(!showSignUpPassword)
                          : setShowSignInPassword(!showSignInPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    >
                      {(isSignUp ? showSignUpPassword : showSignInPassword) ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#F5A623] hover:bg-[#E09612] text-black font-semibold"
                  disabled={loading}
                >
                  {loading ? (isSignUp ? "Creating account..." : "Signing in...") : isSignUp ? "Sign Up" : "Login"}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                <span className="text-gray-400">
                  {isSignUp ? "Already have an account?" : "Don't have an account?"}
                </span>{" "}
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-blue-400 hover:text-blue-300"
                >
                  {isSignUp ? "Sign in" : "Create an account"}
                </button>
              </div>

              <div className="mt-4 text-center">
                <Button
                  type="button"
                  onClick={() => {
                    continueAsGuest();
                    navigate("/products");
                  }}
                  variant="outline"
                  className="w-full border-gray-700 hover:bg-gray-800"
                >
                  Continue as Guest
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  Limited features available in guest mode
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <Facebook className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" />
            <Twitter className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" />
          </div>

          <div>
            <h3 className="text-white font-semibold mb-2">Resources</h3>
            <ul className="space-y-1 text-sm text-gray-400">
              <li>
                <Link to="/auth/privacy-policy" className="hover:text-white cursor-pointer">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/auth/terms-of-service" className="hover:text-white cursor-pointer">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/auth/contact-us" className="hover:text-white cursor-pointer">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-6 pt-6 border-t border-gray-800 text-center text-sm text-gray-400">
          © 2025-2030 Krolist. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
