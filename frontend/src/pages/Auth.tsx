import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Lock, Eye, EyeOff, User, LogIn, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function Auth() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        handlePostAuth();
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session && event === "SIGNED_IN") {
        await handlePostAuth();
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handlePostAuth = async () => {
    const pendingGoal = localStorage.getItem("pendingGoal");
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;
    
    if (pendingGoal) {
      // Save pending goal to database
      await supabase
        .from("users")
        .update({ 
          goal: pendingGoal,
          goal_selected_at: new Date().toISOString()
        })
        .eq("id", user.id);
      
      localStorage.removeItem("pendingGoal");
      
      // Navigate based on goal
      if (pendingGoal === "JEE") {
        navigate("/");
      } else {
        navigate("/buildlife");
      }
      return;
    }
    
    // No pending goal, check if user has goal
    const { data } = await supabase
      .from("users")
      .select("goal")
      .eq("id", user.id)
      .maybeSingle();
    
    if (!data?.goal) {
      // No goal set, go to goal selection
      navigate("/goal-selection");
    } else {
      // Has goal, navigate appropriately
      if (data.goal === "JEE") {
        navigate("/");
      } else {
        navigate("/buildlife");
      }
    }
  };

  const validateEmail = (email: string): string | null => {
    if (!email) return "Email is required";
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!emailRegex.test(email)) return "Enter a valid email";
    return null;
  };

  const validatePassword = (password: string): string | null => {
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    return null;
  };

  const handleForgotPassword = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const emailError = validateEmail(normalizedEmail);
    
    if (emailError) {
      toast.error(emailError);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke("otp_generator", {
        body: { email: normalizedEmail, purpose: "forgot" },
      });

      if (invokeError) throw invokeError;

      if (data?.success) {
        if (data.user_exists) {
          toast.success("OTP sent to your email!");
          navigate("/otp-verification", {
            state: { email: normalizedEmail, flow: "forgot" },
          });
        } else {
          toast.error("Email not registered. Please sign up first.");
        }
      } else {
        toast.error(data?.message || "Could not send OTP");
      }
    } catch (e: any) {
      console.error("Forgot password error:", e);
      toast.error(e.message || "Error sending OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const normalizedEmail = email.trim().toLowerCase();
    const emailError = validateEmail(normalizedEmail);
    const passwordError = validatePassword(password);

    if (emailError) {
      setError(emailError);
      return;
    }
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        // Send OTP for signup verification
        const { data, error: invokeError } = await supabase.functions.invoke("otp_generator", {
          body: { email: normalizedEmail, purpose: "signup" },
        });

        if (invokeError) throw invokeError;

        if (data?.success) {
          toast.success("OTP sent! Please verify.");
          navigate("/otp-verification", {
            state: { email: normalizedEmail, password, flow: "signup" },
          });
        } else {
          setError(data?.message || "Could not send OTP");
        }
      } else {
        // Login
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (signInError) throw signInError;

        if (data.user) {
          toast.success("🎉 Welcome back!");
          navigate("/");
        }
      }
    } catch (e: any) {
      console.error("Auth error:", e);
      const errorMessage = getReadableError(e.message);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getReadableError = (error: string): string => {
    if (error.includes("Invalid login credentials")) {
      return "❌ Invalid email or password. Please try again.";
    } else if (error.includes("Email not confirmed")) {
      return "⚠️ Please verify your email address before logging in.";
    } else if (error.includes("User already registered")) {
      return "⚠️ This email is already registered. Please login instead.";
    } else if (error.includes("Password should be at least 6 characters")) {
      return "❌ Password must be at least 6 characters long.";
    }
    return error;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <div className="glass-card p-8 rounded-2xl">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="flex justify-center mb-8"
          >
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-10 h-10 text-primary" />
            </div>
          </motion.div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-center text-foreground mb-2">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h1>
          <p className="text-muted-foreground text-center mb-8">
            {isSignUp
              ? "Start your exam preparation journey"
              : "Sign in to continue your journey"}
          </p>

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-5">
            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="pl-12 h-14 bg-muted/50 border-border/50 focus:border-primary text-foreground"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="pl-12 pr-12 h-14 bg-muted/50 border-border/50 focus:border-primary text-foreground"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Forgot Password */}
            {!isSignUp && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={isLoading}
                  className="text-sm text-primary hover:underline disabled:opacity-50"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-gradient-to-r from-primary to-orange text-primary-foreground font-semibold text-lg rounded-xl"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  {isSignUp ? "Sign Up" : "Login"}
                </>
              )}
            </Button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <span className="text-muted-foreground">
              {isSignUp ? "Already have an account? " : "Don't have an account? "}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              disabled={isLoading}
              className="text-primary font-semibold hover:underline disabled:opacity-50"
            >
              {isSignUp ? "Login" : "Sign Up"}
            </button>
          </div>

          {/* Terms */}
          <p className="mt-8 text-center text-xs text-muted-foreground">
            By continuing, you agree to our
            <br />
            Terms of Service and Privacy Policy
          </p>
        </div>
      </motion.div>
    </div>
  );
}
