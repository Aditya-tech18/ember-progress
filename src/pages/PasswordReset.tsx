import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function PasswordReset() {
  const navigate = useNavigate();
  const location = useLocation();
  const { email } = location.state || {};
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!email) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Session expired. Please try again.</p>
          <Button onClick={() => navigate("/auth")}>Go to Login</Button>
        </div>
      </div>
    );
  }

  const resetPassword = async () => {
    setError(null);

    if (!newPassword || newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsResetting(true);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke("bright-action", {
        body: { email: email.toLowerCase().trim(), new_password: newPassword },
      });

      if (invokeError) throw invokeError;

      if (!data?.success) {
        setError(data?.error || "Failed to update password");
        setIsResetting(false);
        return;
      }

      toast.success("✅ Password reset successfully!");

      // Auto-login with new password
      try {
        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.toLowerCase().trim(),
          password: newPassword,
        });

        if (signInError) throw signInError;

        if (authData.user) {
          navigate("/");
        }
      } catch (loginError: any) {
        console.error("Auto-login failed:", loginError);
        toast.warning("Please login with your new password");
        navigate("/auth");
      }
    } catch (e: any) {
      console.error("Password reset error:", e);
      setError(e.message || "Error resetting password");
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Button
          variant="ghost"
          onClick={() => navigate("/auth")}
          className="mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="glass-card p-8 rounded-2xl">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="flex justify-center mb-8"
          >
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="w-10 h-10 text-primary" />
            </div>
          </motion.div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-center text-foreground mb-2">
            Create New Password
          </h1>
          <p className="text-muted-foreground text-center mb-8">
            Set a strong password to secure your account
          </p>

          {/* Form */}
          <div className="space-y-5">
            {/* New Password */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type={showNewPassword ? "text" : "password"}
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isResetting}
                className="pl-12 pr-12 h-14 bg-muted/50 border-border/50 focus:border-primary text-foreground"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isResetting}
                className="pl-12 pr-12 h-14 bg-muted/50 border-border/50 focus:border-primary text-foreground"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm text-center"
              >
                {error}
              </motion.div>
            )}

            {/* Reset Button */}
            <Button
              onClick={resetPassword}
              disabled={isResetting}
              className="w-full h-14 bg-gradient-to-r from-primary to-orange text-primary-foreground font-semibold text-lg rounded-xl"
            >
              {isResetting ? (
                <div className="w-6 h-6 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Reset Password
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
