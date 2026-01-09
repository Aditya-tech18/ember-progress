import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
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
} from "lucide-react";

const plans = [
  {
    name: "Start Your Big Journey",
    description: "Begin small, dream big! 🚀",
    duration: "1 month",
    months: 1,
    amount: 900, // paise
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
    amount: 2700,
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
    amount: 5400,
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
    amount: 10800,
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

  const handleSubscribe = async (plan: typeof plans[0]) => {
    setLoading(plan.name);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please login to subscribe");
        navigate("/auth");
        return;
      }

      // For demo - directly create subscription
      // In production, integrate with Razorpay
      const now = new Date();
      const validUntil = new Date(now);
      validUntil.setMonth(validUntil.getMonth() + plan.months);

      const { error } = await supabase
        .from("subscriptions")
        .upsert({
          user_id: user.id,
          email: user.email || "",
          plan_name: plan.name,
          paid_on: now.toISOString(),
          valid_until: validUntil.toISOString(),
          payment_id: `demo_${Date.now()}`,
        }, { onConflict: "user_id" });

      if (error) throw error;

      toast.success("🎉 Subscription activated successfully!");
      navigate("/");
    } catch (error: any) {
      console.error("Subscription error:", error);
      toast.error(error.message || "Failed to subscribe");
    } finally {
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

          {/* Plans */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
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
        </div>
      </div>
    </div>
  );
};

export default Subscription;
