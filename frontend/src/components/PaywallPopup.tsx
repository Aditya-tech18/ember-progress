import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { X, Zap, TrendingUp, Target, Brain, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaywallPopupProps {
  open: boolean;
  onClose: () => void;
  variant: "planner" | "post" | "weekly-test" | "friendly-battle";
}

const VARIANTS = {
  planner: {
    emoji: "📈",
    title: "Your Habit = Your Rank",
    description: "Top JEE rankers track 7+ habits daily. Students who plan consistently score 40+ marks more.",
    cta: "Subscribe Now — at just ₹29/month",
    perks: [
      { icon: "📊", text: "Smart Habit Tracker used by AIR Top 100 aspirants" },
      { icon: "🎯", text: "Daily target system that boosts accuracy by 35%" },
      { icon: "🔥", text: "Streak-based discipline engine for consistent revision" },
    ],
  },
  post: {
    emoji: "✍️",
    title: "Your Journey Inspires Thousands",
    description: "Aspirants who document their prep outperform those who don't by 2x. Share. Grow. Crack JEE.",
    cta: "Subscribe Now — at just ₹29/month",
    perks: [
      { icon: "🌟", text: "Your story could be the motivation someone needs today" },
      { icon: "📣", text: "Build your identity as a serious JEE/NEET aspirant" },
      { icon: "🤝", text: "Connect with 10,000+ students on the same grind" },
    ],
  },
  "weekly-test": {
    emoji: "🏆",
    title: "Weekly Tests = AIR Boost",
    description: "Students who take weekly mocks improve their percentile by 15+ points on average. Don't miss the edge.",
    cta: "Subscribe Now — at just ₹29/month",
    perks: [
      { icon: "⚡", text: "Simulated NTA CBT environment — zero surprises on D-day" },
      { icon: "📉", text: "Identify weak chapters before they cost you marks" },
      { icon: "🎖️", text: "Compete on live leaderboard against serious aspirants" },
    ],
  },
  "friendly-battle": {
    emoji: "⚔️",
    title: "Competition Sharpens You",
    description: "Head-to-head battles train you to perform under pressure — exactly what JEE demands on the actual day.",
    cta: "Subscribe Now — at just ₹29/month",
    perks: [
      { icon: "🥊", text: "Real-time subject battles that boost problem-solving speed" },
      { icon: "📊", text: "Team leaderboards reveal exactly where you stand" },
      { icon: "🧠", text: "Competitive stress → exam hall readiness" },
    ],
  },
};

export const PaywallPopup = ({ open, onClose, variant }: PaywallPopupProps) => {
  const navigate = useNavigate();
  const config = VARIANTS[variant];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 40 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[340px] rounded-3xl overflow-hidden shadow-2xl"
            style={{
              background: "linear-gradient(145deg, #0e0e0e 0%, #1a0808 50%, #0e0e0e 100%)",
              border: "1px solid rgba(229,9,20,0.35)",
              boxShadow: "0 0 60px rgba(229,9,20,0.15)",
            }}
          >
            {/* Glow bar */}
            <div className="h-1 w-full bg-gradient-to-r from-[#E50914] via-orange-400 to-[#E50914]" />

            {/* Animated background particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-4 right-8 w-24 h-24 bg-[#E50914]/5 rounded-full blur-2xl" />
              <div className="absolute bottom-8 left-4 w-20 h-20 bg-orange-500/5 rounded-full blur-2xl" />
            </div>

            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors z-10"
            >
              <X className="w-4 h-4 text-white" />
            </button>

            <div className="p-5 pt-4 relative">
              {/* Emoji + badge */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#E50914] to-orange-500 flex items-center justify-center shadow-lg shadow-[#E50914]/30 shrink-0">
                  <span className="text-2xl">{config.emoji}</span>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-[#E50914] uppercase tracking-widest mb-0.5">Premium Feature</div>
                  <h2 className="text-base font-black text-white leading-tight">{config.title}</h2>
                </div>
              </div>

              <p className="text-xs text-gray-400 mb-4 leading-relaxed">{config.description}</p>

              {/* Perks */}
              <div className="space-y-2.5 mb-5">
                {config.perks.map((perk, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.08 }}
                    className="flex items-start gap-2.5 bg-white/4 rounded-xl px-3 py-2.5 border border-white/5"
                  >
                    <span className="text-base shrink-0 mt-0.5">{perk.icon}</span>
                    <span className="text-xs text-gray-300 leading-snug">{perk.text}</span>
                  </motion.div>
                ))}
              </div>

              {/* Price highlight */}
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="text-gray-500 text-xs line-through">₹299/month</span>
                <span className="bg-[#E50914]/20 text-[#E50914] text-xs font-black px-2 py-0.5 rounded-full border border-[#E50914]/30">
                  90% OFF
                </span>
                <span className="text-white font-black text-sm">₹29/month</span>
              </div>

              {/* CTA */}
              <Button
                onClick={() => { onClose(); navigate("/subscription"); }}
                className="w-full h-11 text-sm font-black rounded-xl bg-gradient-to-r from-[#E50914] to-orange-500 hover:from-[#c4000f] hover:to-orange-600 text-white shadow-lg shadow-[#E50914]/30 border-0"
              >
                <Zap className="w-4 h-4 mr-2" />
                {config.cta}
              </Button>

              <p className="text-[10px] text-gray-600 text-center mt-2.5">
                Cancel anytime · Instant activation · Trusted by 10,000+ aspirants
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PaywallPopup;
