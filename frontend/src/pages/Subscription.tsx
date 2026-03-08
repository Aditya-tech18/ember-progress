import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Rocket,
  Zap,
  Target,
  Handshake,
  Crown,
  Check,
  Loader2,
  ArrowLeft,
  Shield,
  Gift,
  Share2,
  Copy,
} from "lucide-react";
import { Input } from "@/components/ui/input";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID;

const plans = [
  {
    name: "Trial Plan",
    description: "Try Prepixo for a day! 🎯",
    duration: "1 day",
    months: 0,
    days: 1,
    amount: 100, // paise (₹1)
    price: "₹1",
    oldPrice: "₹9",
    icon: Zap,
    popular: false,
    isTrial: true,
  },
  {
    name: "Start Your Big Journey",
    description: "Begin small, dream big! 🚀",
    duration: "1 month",
    months: 1,
    amount: 900, // paise (₹9)
    price: "₹9",
    oldPrice: "₹19",
    icon: Rocket,
    popular: false,
  },
  {
    name: "Booster Plan",
    description: "Boost your prep, real results! ⚡",
    duration: "3 months",
    months: 3,
    amount: 2700, // paise (₹27)
    price: "₹27",
    oldPrice: "₹49",
    icon: Zap,
    popular: false,
  },
  {
    name: "Perfect Exam Season",
    description: "Game-changer for exam season 🎯",
    duration: "6 months",
    months: 6,
    amount: 5400, // paise (₹54)
    price: "₹54",
    oldPrice: "₹99",
    icon: Target,
    popular: true,
  },
  {
    name: "Saathi Plan — Yearlong Prep",
    description: "A trusted companion for a year 🤝",
    duration: "12 months",
    months: 12,
    amount: 10800, // paise (₹108)
    price: "₹108",
    oldPrice: "₹199",
    icon: Handshake,
    popular: false,
  },
];

const features = [
  "Unlimited PYQ Practice",
  "All Mock Tests Access",
  "AI Doubt Solver",
  "Detailed Solutions",
  "Performance Analytics",
  "Chapter-wise Practice",
];

const Subscription = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [applyingReferral, setApplyingReferral] = useState(false);
  const [referralApplied, setReferralApplied] = useState<string | null>(null);
  const [userReferralCode, setUserReferralCode] = useState<string | null>(null);
  const [generatingCode, setGeneratingCode] = useState(false);

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);

    // Fetch user's referral code if they have one
    fetchUserReferralCode();

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const fetchUserReferralCode = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("referral_codes")
      .select("code")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setUserReferralCode(data.code);
    }
  };

  const generateUserReferralCode = async () => {
    setGeneratingCode(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please login first");
        return;
      }

      // Check if user has an active subscription
      const { data: subData } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .gte("valid_until", new Date().toISOString())
        .maybeSingle();

      if (!subData) {
        toast.error("You need an active subscription to generate a referral code");
        return;
      }

      // Check if user has combat name
      const { data: userData } = await supabase
        .from("users")
        .select("combat_name")
        .eq("id", user.id)
        .single();

      if (!userData?.combat_name) {
        toast.error("Please set your combat name first");
        return;
      }

      // Generate code using the database function
      const { data: codeData, error } = await supabase.rpc("generate_referral_code", {
        p_user_id: user.id,
      });

      if (error) throw error;

      // Insert the code
      const { error: insertError } = await supabase
        .from("referral_codes")
        .insert({
          user_id: user.id,
          code: codeData,
          uses_remaining: 1,
        });

      if (insertError) throw insertError;

      setUserReferralCode(codeData);
      toast.success("Referral code generated! Share it with friends.");
    } catch (error: any) {
      console.error("Error generating code:", error);
      toast.error(error.message || "Failed to generate code");
    } finally {
      setGeneratingCode(false);
    }
  };

  const applyReferralCode = async () => {
    if (!referralCode.trim()) {
      toast.error("Please enter a referral code");
      return;
    }

    setApplyingReferral(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please login first");
        navigate("/auth");
        return;
      }

      // Check if user already used a referral code
      const { data: existingReward } = await supabase
        .from("referral_rewards")
        .select("id")
        .eq("referred_id", user.id)
        .maybeSingle();

      if (existingReward) {
        toast.error("You have already used a referral code");
        return;
      }

      // Find the referral code
      const { data: codeData, error: codeError } = await supabase
        .from("referral_codes")
        .select("*")
        .eq("code", referralCode.trim())
        .maybeSingle();

      if (codeError || !codeData) {
        toast.error("Invalid referral code");
        return;
      }

      if (codeData.uses_remaining <= 0) {
        toast.error("This referral code has already been used");
        return;
      }

      if (codeData.user_id === user.id) {
        toast.error("You cannot use your own referral code");
        return;
      }

      setReferralApplied(referralCode.trim());
      toast.success("Referral code applied! You'll get 1 month free access.");
    } catch (error: any) {
      toast.error(error.message || "Failed to apply code");
    } finally {
      setApplyingReferral(false);
    }
  };

  const processReferralReward = async (userId: string, referralCodeUsed: string) => {
    try {
      // Find the referral code
      const { data: codeData } = await supabase
        .from("referral_codes")
        .select("*")
        .eq("code", referralCodeUsed)
        .single();

      if (!codeData) return;

      // Create referral reward entry
      await supabase.from("referral_rewards").insert({
        referrer_id: codeData.user_id,
        referred_id: userId,
        referral_code: referralCodeUsed,
        referrer_months_awarded: 3,
        referred_months_awarded: 1,
      });

      // Update the code as used
      await supabase
        .from("referral_codes")
        .update({
          uses_remaining: 0,
          used_by: userId,
          used_at: new Date().toISOString(),
        })
        .eq("id", codeData.id);

      // Give referred user 1 month free (9rs plan)
      const now = new Date();
      const validUntil = new Date(now);
      validUntil.setMonth(validUntil.getMonth() + 1);

      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("subscriptions").upsert({
        user_id: userId,
        email: user?.email || "",
        plan_name: "Referral Bonus - 1 Month",
        paid_on: now.toISOString(),
        valid_until: validUntil.toISOString(),
        payment_id: `referral_${referralCodeUsed}`,
      }, { onConflict: "user_id" });

      // Give referrer 3 months free
      const { data: referrerSub } = await supabase
        .from("subscriptions")
        .select("valid_until")
        .eq("user_id", codeData.user_id)
        .maybeSingle();

      const referrerValidFrom = referrerSub?.valid_until
        ? new Date(referrerSub.valid_until)
        : new Date();
      
      const referrerValidUntil = new Date(referrerValidFrom);
      referrerValidUntil.setMonth(referrerValidUntil.getMonth() + 3);

      const { data: referrerUser } = await supabase
        .from("users")
        .select("email")
        .eq("id", codeData.user_id)
        .single();

      await supabase.from("subscriptions").upsert({
        user_id: codeData.user_id,
        email: referrerUser?.email || "",
        plan_name: "Referral Reward - 3 Months",
        paid_on: now.toISOString(),
        valid_until: referrerValidUntil.toISOString(),
        payment_id: `referral_reward_${Date.now()}`,
      }, { onConflict: "user_id" });

      toast.success("🎉 Referral applied! You got 1 month free.");
    } catch (error) {
      console.error("Error processing referral:", error);
    }
  };

  const handleSubscribe = async (plan: typeof plans[0]) => {
    // If referral code is applied and not yet processed, process it
    if (referralApplied) {
      setLoading(plan.name);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error("Please login first");
          navigate("/auth");
          return;
        }

        await processReferralReward(user.id, referralApplied);
        setReferralApplied(null);
        setReferralCode("");
        navigate("/");
      } catch (error: any) {
        toast.error(error.message || "Failed to apply referral");
      } finally {
        setLoading(null);
      }
      return;
    }

    setLoading(plan.name);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please login to subscribe");
        navigate("/auth");
        return;
      }

      if (!razorpayLoaded) {
        toast.error("Payment system loading. Please try again.");
        setLoading(null);
        return;
      }

      const options = {
        key: RAZORPAY_KEY,
        amount: plan.amount,
        currency: "INR",
        name: "Prepixo",
        description: `${plan.name} - ${plan.duration} Subscription`,
        image: "https://i.imgur.com/3g7nmJC.png",
        handler: async function (response: any) {
          try {
            // Payment successful - save subscription
            const now = new Date();
            const validUntil = new Date(now);
            
            // Handle trial plan (1 day) vs regular plans (months)
            if ((plan as any).isTrial) {
              validUntil.setDate(validUntil.getDate() + ((plan as any).days || 1));
            } else {
              validUntil.setMonth(validUntil.getMonth() + plan.months);
            }

            const { error } = await supabase
              .from("subscriptions")
              .upsert({
                user_id: user.id,
                email: user.email || "",
                plan_name: plan.name,
                paid_on: now.toISOString(),
                valid_until: validUntil.toISOString(),
                payment_id: response.razorpay_payment_id,
              }, { onConflict: "user_id" });

            if (error) throw error;

            toast.success("🎉 Subscription activated successfully!");
            navigate("/");
          } catch (error: any) {
            console.error("Error saving subscription:", error);
            toast.error("Payment successful but failed to activate. Contact support.");
          }
        },
        prefill: {
          email: user.email || "",
        },
        notes: {
          user_id: user.id,
          plan_name: plan.name,
          duration_months: plan.months.toString(),
        },
        theme: {
          color: "#F97316",
        },
        modal: {
          ondismiss: function() {
            setLoading(null);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", function (response: any) {
        console.error("Payment failed:", response.error);
        toast.error("Payment failed. Please try again.");
        setLoading(null);
      });
      razorpay.open();
    } catch (error: any) {
      console.error("Subscription error:", error);
      toast.error(error.message || "Failed to initiate payment");
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mb-4 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-4 border border-primary/20">
              <Crown className="w-4 h-4 text-gold" />
              <span className="text-sm font-medium text-muted-foreground">Premium Access</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Unlock Your Full Potential
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Get unlimited access to all PYQs, mock tests, and AI-powered doubt solving
            </p>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6 rounded-2xl mb-10 max-w-3xl mx-auto"
          >
            <h3 className="text-lg font-semibold text-foreground mb-4 text-center">What's Included</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-success" />
                  </div>
                  <span className="text-sm text-muted-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Referral Code Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card p-6 rounded-2xl mb-10 max-w-xl mx-auto"
          >
            <h3 className="text-lg font-semibold text-foreground mb-4 text-center flex items-center justify-center gap-2">
              <Gift className="w-5 h-5 text-primary" />
              Have a Referral Code?
            </h3>
            {referralApplied ? (
              <div className="text-center">
                <div className="bg-success/20 border border-success/30 rounded-lg p-4 mb-4">
                  <Check className="w-8 h-8 text-success mx-auto mb-2" />
                  <p className="text-success font-medium">Code Applied: {referralApplied}</p>
                  <p className="text-sm text-muted-foreground">You'll get 1 month free access!</p>
                </div>
                <Button
                  onClick={async () => {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user && referralApplied) {
                      await processReferralReward(user.id, referralApplied);
                      navigate("/");
                    }
                  }}
                  className="bg-gradient-to-r from-primary to-crimson"
                >
                  Claim Free Access
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Enter referral code"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={applyReferralCode}
                  disabled={applyingReferral || !referralCode.trim()}
                  variant="outline"
                >
                  {applyingReferral ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                </Button>
              </div>
            )}
          </motion.div>

          {/* Your Referral Code Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6 rounded-2xl mb-10 max-w-xl mx-auto"
          >
            <h3 className="text-lg font-semibold text-foreground mb-4 text-center flex items-center justify-center gap-2">
              <Share2 className="w-5 h-5 text-primary" />
              Share & Earn
            </h3>
            {userReferralCode ? (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Your Referral Code:</p>
                <div className="bg-primary/20 border border-primary/30 rounded-lg p-4 mb-4">
                  <p className="text-2xl font-bold text-primary">{userReferralCode}</p>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  Share this code with friends! When they use it, you get 3 months free and they get 1 month free.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(userReferralCode);
                    toast.success("Copied to clipboard!");
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Code
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Generate your referral code to earn 3 months free when friends subscribe!
                </p>
                <Button
                  onClick={generateUserReferralCode}
                  disabled={generatingCode}
                  className="bg-gradient-to-r from-primary to-crimson"
                >
                  {generatingCode ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Gift className="w-4 h-4 mr-2" />
                      Generate Referral Code
                    </>
                  )}
                </Button>
              </div>
            )}
          </motion.div>

          {/* Plans */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 max-w-7xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
                className={`glass-card rounded-2xl p-6 relative overflow-hidden ${
                  plan.popular ? "border-2 border-primary ring-2 ring-primary/20" : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                    Most Popular
                  </div>
                )}

                <div className="mb-4">
                  <div className={`w-12 h-12 rounded-xl ${plan.popular ? "bg-primary" : "bg-muted"} flex items-center justify-center mb-4`}>
                    <plan.icon className={`w-6 h-6 ${plan.popular ? "text-primary-foreground" : "text-primary"}`} />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-sm text-muted-foreground line-through">{plan.oldPrice}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{plan.duration}</span>
                </div>

                <Button
                  onClick={() => handleSubscribe(plan)}
                  disabled={loading !== null}
                  className={`w-full ${
                    plan.popular
                      ? "bg-gradient-to-r from-primary to-crimson text-primary-foreground"
                      : ""
                  }`}
                  variant={plan.popular ? "default" : "outline"}
                >
                  {loading === plan.name ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Subscribe Now"
                  )}
                </Button>
              </motion.div>
            ))}
          </div>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/30 text-muted-foreground text-sm">
              <Shield className="w-4 h-4 text-success" />
              <span>Secure payments powered by Razorpay</span>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              By subscribing, you agree to our{" "}
              <a href="/terms" className="text-primary hover:underline">Terms & Conditions</a>
              {" "}and{" "}
              <a href="/refund" className="text-primary hover:underline">Refund Policy</a>
            </p>
          </motion.div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Subscription;
