import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import krolistCircleLogo from "@/assets/krolist-circle-logo.png";
import krolistTextLogo from "@/assets/krolist-text-logo.png";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";
import { Facebook, Twitter } from "lucide-react";

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
  const { signUp, signIn, user } = useAuth();
  const [loading, setLoading] = useState(false);

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
      signUpSchema.parse({ email, username, password });

      const { error } = await signUp(email, password, username);

      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("This email is already registered. Please sign in instead.");
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success("Account created! Please check your email to verify your account.");
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
      signInSchema.parse({ email, password });

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

  const [isSignUp, setIsSignUp] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="p-6">
        <img 
          src={krolistTextLogo} 
          alt="Krolist" 
          className="h-8 object-contain"
        />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 pb-20">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Logo */}
          <div className="hidden lg:flex flex-col items-center justify-center">
            <img 
              src={krolistCircleLogo} 
              alt="Krolist Logo" 
              className="w-80 h-80 object-contain mb-8"
            />
            <p className="text-xl text-gray-400">Your ultimate shopping manager.</p>
          </div>

          {/* Right Side - Auth Form */}
          <div className="w-full max-w-md mx-auto">
            <div className="bg-[#1a1a1a] rounded-lg p-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">
                  Welcome to <img src={krolistTextLogo} alt="Krolist" className="inline h-8 mb-1" />
                </h1>
                <p className="text-gray-400">
                  {isSignUp ? "Create an account to get started" : "Sign in to your account to continue"}
                </p>
              </div>

              {!isSignUp && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full mb-4 bg-black text-white border-gray-700 hover:bg-gray-900"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign in with Google
                </Button>
              )}

              {!isSignUp && (
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-700"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-[#1a1a1a] text-gray-400">or</span>
                  </div>
                </div>
              )}

              <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-white">Username</Label>
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
                  <Label htmlFor="email" className="text-white">Email</Label>
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
                  <Label htmlFor="password" className="text-white">Password</Label>
                  <Input
                    id="password"
                    name={isSignUp ? "signup-password" : "signin-password"}
                    type="password"
                    placeholder="••••••••"
                    className="bg-[#2a2a2a] border-gray-700 text-white placeholder:text-gray-500"
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-[#F5A623] hover:bg-[#E09612] text-black font-semibold"
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
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-blue-400 hover:text-blue-300"
                >
                  {isSignUp ? "Sign in" : "Create an account"}
                </button>
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
              <li className="hover:text-white cursor-pointer">About Us</li>
              <li className="hover:text-white cursor-pointer">Support</li>
              <li className="hover:text-white cursor-pointer">Help Center</li>
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
