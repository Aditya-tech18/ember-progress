import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Lock, Eye, EyeOff, User, LogIn, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";

export default function Auth() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isHandlingAuth = useRef(false);

  const handlePostAuth = useCallback(async () => {
    if (isHandlingAuth.current) return;
    isHandlingAuth.current = true;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        setIsGoogleLoading(false);
        isHandlingAuth.current = false;
        return;
      }

      const pendingGoal = localStorage.getItem("pendingGoal");
      if (pendingGoal) {
        await supabase
          .from("users")
          .update({
            goal: pendingGoal,
            goal_selected_at: new Date().toISOString(),
          })
          .eq("id", user.id);
        localStorage.removeItem("pendingGoal");
        window.dispatchEvent(new Event("goalSaved"));
        navigate("/");
        return;
      }

      const { data } = await supabase
        .from("users")
        .select("goal")
        .eq("id", user.id)
        .maybeSingle();

      if (!data?.goal) {
        navigate("/goal-selection");
      } else {
        window.dispatchEvent(new Event("goalSaved"));
        navigate("/");
      }
    } catch (err) {
      console.error("handlePostAuth error:", err);
      setIsLoading(false);
      setIsGoogleLoading(false);
      isHandlingAuth.current = false;
    }
  }, [navigate]);

  // On mount: silently redirect if already logged in, no spinner
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        handlePostAuth();
      }
    });
  }, [handlePostAuth]);

  // Deep link handler — ONLY path for Google OAuth on Android
  useEffect(() => {
    let listener: any;

    const setupDeepLink = async () => {
      listener = await App.addListener("appUrlOpen", async ({ url }) => {
        console.log("OAuth Callback URL:", url);

        if (
          !url.includes("access_token") &&
          !url.includes("auth/callback") &&
          !url.includes("code")
        ) return;

        // Spinner was already set in handleGoogleSignIn before Browser.open
        try {
          let session = null;
          for (let i = 0; i < 10; i++) {
            await new Promise((r) => setTimeout(r, 500));
            const { data } = await supabase.auth.getSession();
            if (data.session) {
              session = data.session;
              break;
            }
          }

          if (session) {
            await handlePostAuth();
            return;
          }

          // Fallback: token in URL fragment
          if (url.includes("#")) {
            const hash = url.split("#")[1] || "";
            const params = new URLSearchParams(hash);
            const access_token = params.get("access_token");
            const refresh_token = params.get("refresh_token");

            if (access_token && refresh_token) {
              const { error } = await supabase.auth.setSession({
                access_token,
                refresh_token,
              });
              if (error) {
                console.error("setSession error:", error);
                setIsGoogleLoading(false);
                return;
              }
              await handlePostAuth();
              return;
            }
          }

          toast.error("Sign in failed. Please try again.");
          setIsGoogleLoading(false);
        } catch (err) {
          console.error("OAuth callback error:", err);
          setIsGoogleLoading(false);
        }
      });
    };

    setupDeepLink();
    return () => { listener?.remove(); };
  }, [handlePostAuth]);

  // onAuthStateChange ONLY for email/password sign-in
  // NOT used for Google OAuth — that goes through deep link only
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("AUTH EVENT:", event);
        // Only handle INITIAL_SESSION is ignored;
        // SIGNED_IN only acts if it came from email/password (isLoading is true)
        if (event === "SIGNED_IN" && session && isLoading) {
          await handlePostAuth();
        }
      }
    );
    return () => { subscription.unsubscribe(); };
  }, [handlePostAuth, isLoading]);

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
    if (emailError) { toast.error(emailError); return; }

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

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      isHandlingAuth.current = false;
      setIsGoogleLoading(true);

      const redirectUrl = Capacitor.isNativePlatform()
        ? "com.prepixo.aimup://auth/callback"
        : `${window.location.origin}/auth`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: Capacitor.isNativePlatform(),
        },
      });

      if (error) throw error;

      if (Capacitor.isNativePlatform() && data?.url) {
        const { Browser } = await import("@capacitor/browser");
        await Browser.open({ url: data.url });
        // Spinner stays on — deep link handler will call handlePostAuth
        // which navigates away, unmounting this component and clearing state
      } else {
        // Web: browser redirects away, clear spinner
        setIsGoogleLoading(false);
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Google sign in failed");
      setIsGoogleLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const normalizedEmail = email.trim().toLowerCase();
    const emailError = validateEmail(normalizedEmail);
    const passwordError = validatePassword(password);

    if (emailError) { setError(emailError); return; }
    if (passwordError) { setError(passwordError); return; }

    setIsLoading(true);

    try {
      if (isSignUp) {
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
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (signInError) throw signInError;

        if (data.user) {
          toast.success("🎉 Welcome back!");
          await handlePostAuth();
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
    if (error.includes("Invalid login credentials")) return "❌ Invalid email or password. Please try again.";
    if (error.includes("Email not confirmed")) return "⚠️ Please verify your email address before logging in.";
    if (error.includes("User already registered")) return "⚠️ This email is already registered. Please login instead.";
    if (error.includes("Password should be at least 6 characters")) return "❌ Password must be at least 6 characters long.";
    return error;
  };

  const anyLoading = isLoading || isGoogleLoading;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Button
          variant="ghost"
          onClick={() => navigate("/goal-selection")}
          className="mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="glass-card p-8 rounded-2xl">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="flex justify-center mb-8"
          >
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-10 h-10 text-primary" />
            </div>
          </motion.div>

          <h1 className="text-3xl font-bold text-center text-foreground mb-2">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h1>
          <p className="text-muted-foreground text-center mb-8">
            {isSignUp ? "Start your exam preparation journey" : "Sign in to continue your journey"}
          </p>

          <form onSubmit={handleAuth} className="space-y-5">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={anyLoading}
                className="pl-12 h-14 bg-muted/50 border-border/50 focus:border-primary text-foreground"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={anyLoading}
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

            {!isSignUp && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={anyLoading}
                  className="text-sm text-primary hover:underline disabled:opacity-50"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm"
              >
                {error}
              </motion.div>
            )}

            <Button
              type="submit"
              disabled={anyLoading}
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

          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-border/60" />
            <span className="text-xs text-muted-foreground">OR</span>
            <div className="flex-1 h-px bg-border/60" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={anyLoading}
            className="w-full h-14 rounded-xl bg-white hover:bg-gray-100 text-gray-800 font-semibold flex items-center justify-center gap-3 transition-all disabled:opacity-60 shadow-sm border border-gray-200"
          >
            {isGoogleLoading ? (
              <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5 17.7 35.5 12.5 30.3 12.5 24S17.7 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.3 29 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5c10.7 0 19.4-7.7 19.4-19.5 0-1.2-.1-2.4-.3-3.5z"/>
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.8 29 5 24 5 16.3 5 9.7 9.3 6.3 14.7z"/>
                  <path fill="#4CAF50" d="M24 43c5 0 9.6-1.9 13-5l-6-5c-2 1.5-4.4 2.4-7 2.4-5.2 0-9.6-3.4-11.2-8l-6.5 5C9.5 38.7 16.1 43 24 43z"/>
                  <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6 5c-.4.4 6.7-4.9 6.7-14.5 0-1.2-.1-2.4-.4-3.5z"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>

          <div className="mt-6 text-center">
            <span className="text-muted-foreground">
              {isSignUp ? "Already have an account? " : "Don't have an account? "}
            </span>
            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
              disabled={anyLoading}
              className="text-primary font-semibold hover:underline disabled:opacity-50"
            >
              {isSignUp ? "Login" : "Sign Up"}
            </button>
          </div>

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
