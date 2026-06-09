import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Target, Check, Loader2, Shield, Zap, Flame, TrendingUp, Award } from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_live_SObcQvFXRo6HAa";

const features = [
  { icon: Target, text: "Unlimited Habit Tracking" },
  { icon: Flame, text: "Consistency Heatmap" },
  { icon: TrendingUp, text: "Progress Analytics" },
  { icon: Award, text: "Goal Management System" },
  { icon: Zap, text: "Daily Streak Tracking" },
  { icon: Shield, text: "Lifetime Access" },
];

export const BuildLifeSubscription = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  const returnTo = (location.state as any)?.returnTo || "/buildlife";

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () => toast.error('Failed to load payment system');
    document.body.appendChild(script);

    return () => {
      try { document.body.removeChild(script); } catch (e) {}
    };
  }, []);

  const handleSubscribe = async () => {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please login first");
        navigate("/auth", { state: { returnTo: "/buildlife-subscription" } });
        return;
      }

      if (!razorpayLoaded) {
        toast.error("Payment system loading. Please wait...");
        setTimeout(() => setLoading(false), 2000);
        return;
      }

      const options = {
        key: RAZORPAY_KEY_ID,
        amount: 9900, // ₹99 in paise
        currency: "INR",
        name: "BuildLife Planner",
        description: "Lifetime Access - Premium Habit Tracker",
        image: "https://i.imgur.com/3g7nmJC.png",
        handler: async function (response: any) {
          try {
            const { error } = await supabase
              .from("subscriptions")
              .upsert({
                user_id: user.id,
                email: user.email || "",
                plan_name: "BuildLife Lifetime",
                paid_on: new Date().toISOString(),
                valid_until: new Date("2099-12-31").toISOString(),
                payment_id: response.razorpay_payment_id,
              }, { onConflict: "user_id" });

            if (error) throw error;

            toast.success("🎉 BuildLife Planner activated!");
            setTimeout(() => navigate(returnTo), 1500);
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
          plan_name: "BuildLife Lifetime",
        },
        theme: {
          color: "#E50914",
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", function (response: any) {
        console.error("Payment failed:", response.error);
        toast.error(`Payment failed: ${response.error.description || 'Unknown error'}`);
        setLoading(false);
      });
      razorpay.open();
    } catch (error: any) {
      console.error("Subscription error:", error);
      toast.error(error.message || "Failed to initiate payment");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-24 h-24 bg-gradient-to-br from-[#E50914] to-red-600 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Target className="w-12 h-12 text-white" />
          </motion.div>
          <h1 className="text-5xl font-black text-white mb-4">
            BuildLife Planner
          </h1>
          <p className="text-gray-400 text-xl">
            Transform your life, one habit at a time
          </p>
        </div>

        {/* Price Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-[#111111] border-2 border-[#E50914] rounded-3xl p-8 mb-6"
        >
          <div className="text-center mb-8">
            <div className="inline-block bg-[#E50914]/10 border border-[#E50914]/30 rounded-full px-6 py-2 mb-4">
              <span className="text-[#E50914] font-bold">LIFETIME ACCESS</span>
            </div>
            <div className="flex items-baseline justify-center gap-3 mb-2">
              <span className="text-7xl font-black text-white">₹99</span>
              <span className="text-2xl text-gray-500 line-through">₹999</span>
            </div>
            <p className="text-sm text-[#E50914] font-semibold">One-time payment • Never pay again</p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  className="flex items-center gap-3 p-3 bg-[#1a1a1a] rounded-xl"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#E50914]/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-[#E50914]" />
                  </div>
                  <span className="text-gray-300 font-medium">{feature.text}</span>
                </motion.div>
              );
            })}
          </div>

          {/* Subscribe Button */}
          <Button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full bg-[#E50914] hover:bg-[#E50914]/90 text-white font-bold text-xl py-8 rounded-xl"
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                Processing Payment...
              </>
            ) : (
              <>
                <Zap className="w-6 h-6 mr-2" />
                Get Lifetime Access Now
              </>
            )}
          </Button>
        </motion.div>

        {/* Trust Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 text-gray-400 text-sm">
            <Shield className="w-4 h-4 text-green-500" />
            <span>Secure payments powered by Razorpay</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default BuildLifeSubscription;