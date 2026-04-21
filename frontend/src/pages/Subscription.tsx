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

// Razorpay keys from environment
const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_live_SObcQvFXRo6HAa";
const RAZORPAY_KEY_SECRET = import.meta.env.VITE_RAZORPAY_KEY_SECRET || "cwYauUFEKheGa1Kt5HEpAFrA";

// Log key to confirm it's loaded (for debugging)
console.log('🔑 Razorpay Key ID:', RAZORPAY_KEY_ID?.substring(0, 10) + '...');

const plans = [
  {
    name: "Trial Plan",
    description: "Try PYQBook for a day! 🎯",
    duration: "1 day",
    months: 0,
    days: 1,
    amount: 100,
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
    amount: 2900,
    price: "₹29",
    oldPrice: "₹49",
    icon: Rocket,
    popular: false,
  },
  {
    name: "Booster Plan",
    description: "Boost your prep, real results! ⚡",
    duration: "3 months",
    months: 3,
    amount: 9900,
    price: "₹99",
    oldPrice: "₹149",
    icon: Zap,
    popular: false,
  },
  {
    name: "Perfect Exam Season",
    description: "Game-changer for exam season 🎯",
    duration: "6 months",
    months: 6,
    amount: 19900,
    price: "₹199",
    oldPrice: "₹299",
    icon: Target,
    popular: true,
  },
  {
    name: "Saathi Plan — Yearlong Prep",
    description: "A trusted companion for a year 🤝",
    duration: "12 months",
    months: 12,
    amount: 29900,
    price: "₹299",
    oldPrice: "₹499",
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
    script.onload = () => {
      setRazorpayLoaded(true);
      console.log('✅ Razorpay script loaded successfully');
    };
    script.onerror = () => {
      console.error('❌ Failed to load Razorpay script');
      toast.error('Failed to load payment system');
    };
    document.body.appendChild(script);

    fetchUserReferralCode();

    return () => {
      try {
        document.body.removeChild(script);
      } catch (e) {
        // Script already removed
      }
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

      const { data: userData } = await supabase
        .from("users")
        .select("combat_name")
        .eq("id", user.id)
        .single();

      if (!userData?.combat_name) {
        toast.error("Please set your combat name first");
        return;
      }

      const { data: codeData, error } = await supabase.rpc("generate_referral_code", {
        p_user_id: user.id,
      });

      if (error) throw error;

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

      const { data: existingReward } = await supabase
        .from("referral_rewards")
        .select("id")
        .eq("referred_id", user.id)
        .maybeSingle();

      if (existingReward) {
        toast.error("You have already used a referral code");
        return;
      }

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
      const { data: codeData } = await supabase
        .from("referral_codes")
        .select("*")
        .eq("code", referralCodeUsed)
        .single();

      if (!codeData) return;

      await supabase.from("referral_rewards").insert({
        referrer_id: codeData.user_id,
        referred_id: userId,
        referral_code: referralCodeUsed,
        referrer_months_awarded: 3,
        referred_months_awarded: 1,
      });

      await supabase
        .from("referral_codes")
        .update({
          uses_remaining: 0,
          used_by: userId,
          used_at: new Date().toISOString(),
        })
        .eq("id", codeData.id);

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
        toast.error("Payment system loading. Please wait...");
        setTimeout(() => setLoading(null), 2000);
        return;
      }

      if (!RAZORPAY_KEY_ID) {
        console.error('❌ Razorpay key not configured');
        toast.error("Payment configuration error. Please contact support.");
        setLoading(null);
        return;
      }

      console.log('💳 Initializing Razorpay with key:', RAZORPAY_KEY_ID.substring(0, 10) + '...');

      const options = {
        key: RAZORPAY_KEY_ID,
        amount: plan.amount,
        currency: "INR",
        name: "PYQBook",
        description: `${plan.name} - ${plan.duration} Subscription`,
        image: "https://i.imgur.com/3g7nmJC.png",
        handler: async function (response: any) {
          console.log('✅ Payment successful:', response.razorpay_payment_id);
          try {
            const now = new Date();
            const validUntil = new Date(now);
            
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
            
            // Redirect after short delay
            setTimeout(() => {
              navigate("/");
            }, 1500);
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
          color: "#E50914",
        },
        modal: {
          ondismiss: function() {
            console.log('Payment modal dismissed');
            setLoading(null);
          }
        }
      };

      console.log('🚀 Opening Razorpay modal...');
      const razorpay = new window.Razorpay(options);
      
      razorpay.on("payment.failed", function (response: any) {
        console.error("❌ Payment failed:", response.error);
        toast.error(`Payment failed: ${response.error.description || 'Unknown error'}`);
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
    <div className="min-h-screen bg-[#000000]">
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
              className="mb-4 text-gray-400 hover:text-white"
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#E50914]/10 border border-[#E50914]/30 mb-4">
              <Crown className="w-4 h-4 text-[#E50914]" />
              <span className="text-sm font-bold text-white">Premium Access</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">
              Unlock Your Full Potential
            </h1>
            <p className="text-gray-400 max-w-xl mx-auto text-lg">
              Get unlimited access to all PYQs, mock tests, and AI-powered doubt solving
            </p>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#111111] p-6 rounded-2xl mb-10 max-w-3xl mx-auto border border-white/10"
          >
            <h3 className="text-xl font-bold text-white mb-4 text-center">What's Included</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#E50914]/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-[#E50914]" />
                  </div>
                  <span className="text-sm text-gray-300">{feature}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Referral Code Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-[#111111] p-6 rounded-2xl mb-10 max-w-xl mx-auto border border-white/10"
          >
            <h3 className="text-lg font-bold text-white mb-4 text-center flex items-center justify-center gap-2">
              <Gift className="w-5 h-5 text-[#E50914]" />
              Have a Referral Code?
            </h3>
            {referralApplied ? (
              <div className="text-center">
                <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 mb-4">
                  <Check className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-green-400 font-bold">Code Applied: {referralApplied}</p>
                  <p className="text-sm text-gray-400">You'll get 1 month free access!</p>
                </div>
                <Button
                  onClick={async () => {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user && referralApplied) {
                      await processReferralReward(user.id, referralApplied);
                      navigate("/");
                    }
                  }}
                  className="bg-[#E50914] hover:bg-[#E50914]/90 text-white font-bold"
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
                  className="flex-1 bg-black border-white/20 text-white"
                />
                <Button
                  onClick={applyReferralCode}
                  disabled={applyingReferral || !referralCode.trim()}
                  className="bg-[#E50914] hover:bg-[#E50914]/90 text-white font-bold"
                >
                  {applyingReferral ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
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
                className={`bg-[#111111] rounded-2xl p-6 relative overflow-hidden border ${
                  plan.popular ? "border-[#E50914] ring-2 ring-[#E50914]/30" : "border-white/10"
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-[#E50914] text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                    Most Popular
                  </div>
                )}

                <div className="mb-4">
                  <div className={`w-12 h-12 rounded-xl ${
                    plan.popular ? "bg-[#E50914]" : "bg-white/10"
                  } flex items-center justify-center mb-4`}>
                    <plan.icon className={`w-6 h-6 ${plan.popular ? "text-white" : "text-[#E50914]"}`} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-sm text-gray-400">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white">{plan.price}</span>
                    <span className="text-sm text-gray-500 line-through">{plan.oldPrice}</span>
                  </div>
                  <span className="text-sm text-gray-400">{plan.duration}</span>
                </div>

                <Button
                  onClick={() => handleSubscribe(plan)}
                  disabled={loading !== null}
                  className={`w-full font-bold ${
                    plan.popular
                      ? "bg-[#E50914] hover:bg-[#E50914]/90 text-white"
                      : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                  }`}
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 text-gray-400 text-sm">
              <Shield className="w-4 h-4 text-green-500" />
              <span>Secure payments powered by Razorpay</span>
            </div>
          </motion.div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Subscription;