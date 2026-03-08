import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { KeyRound, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function OtpVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const { email, password, flow } = location.state || {};
  
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!email || !flow) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Session expired. Please try again.</p>
          <Button onClick={() => navigate("/auth")}>Go to Login</Button>
        </div>
      </div>
    );
  }

  const verifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke("verify_otp", {
        body: { email, otp, purpose: flow },
      });

      if (invokeError) throw invokeError;

      if (!data?.valid) {
        setError(data?.reason || "Invalid or expired OTP");
        setIsVerifying(false);
        return;
      }

      // OTP verified successfully
      if (flow === "forgot") {
        navigate("/password-reset", { state: { email } });
      } else if (flow === "signup") {
        await completeSignup();
      }
    } catch (e: any) {
      console.error("OTP verification error:", e);
      setError(e.message || "OTP verification failed");
      setIsVerifying(false);
    }
  };

  const completeSignup = async () => {
    try {
      if (!password || password.length < 6) {
        setError("Password must be at least 6 characters");
        setIsVerifying(false);
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        toast.success("✅ Account created successfully!");
        navigate("/");
      }
    } catch (e: any) {
      console.error("Signup error:", e);
      setError(e.message || "Signup failed");
      setIsVerifying(false);
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
              <KeyRound className="w-10 h-10 text-primary" />
            </div>
          </motion.div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-center text-foreground mb-2">
            OTP Verification
          </h1>
          <p className="text-muted-foreground text-center mb-8">
            Enter the OTP sent to
            <br />
            <span className="text-foreground font-medium">{email}</span>
          </p>

          {/* OTP Input */}
          <div className="space-y-5">
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              disabled={isVerifying}
              className="h-16 text-center text-2xl tracking-[0.5em] bg-muted/50 border-border/50 focus:border-primary text-foreground font-mono"
            />

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

            {/* Verify Button */}
            <Button
              onClick={verifyOtp}
              disabled={isVerifying || otp.length !== 6}
              className="w-full h-14 bg-gradient-to-r from-primary to-orange text-primary-foreground font-semibold text-lg rounded-xl"
            >
              {isVerifying ? (
                <div className="w-6 h-6 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                "Verify OTP"
              )}
            </Button>
          </div>

          {/* Timer/Resend hint */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            OTP is valid for 5 minutes
          </p>
        </div>
      </motion.div>
    </div>
  );
}
