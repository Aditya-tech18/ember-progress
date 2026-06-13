import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { X, Zap, Crown, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SubscribePopupProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  emoji?: string;
}

export const SubscribePopup = ({
  open,
  onClose,
  title,
  description,
  emoji = "🚀",
}: SubscribePopupProps) => {
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 30 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
            style={{ background: "linear-gradient(135deg, #0d0d0d 0%, #1a0a0a 100%)", border: "1px solid rgba(229,9,20,0.3)" }}
          >
            {/* Top glow bar */}
            <div className="h-1 w-full bg-gradient-to-r from-[#E50914] via-orange-400 to-[#E50914]" />

            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>

            <div className="p-6 pt-5">
              {/* Emoji badge */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#E50914] to-orange-500 flex items-center justify-center mb-4 shadow-lg shadow-[#E50914]/30">
                <span className="text-3xl">{emoji}</span>
              </div>

              <h2 className="text-xl font-black text-white mb-2 leading-tight">{title}</h2>
              <p className="text-sm text-gray-400 mb-5 leading-relaxed">{description}</p>

              {/* Perks */}
              <div className="space-y-2 mb-5">
                {[
                  { icon: "✅", text: "Unlimited Mock Tests & PYQ Practice" },
                  { icon: "🧠", text: "AI Doubt Solver — get instant answers" },
                  { icon: "📊", text: "Smart Planner to crack JEE/NEET" },
                ].map((perk, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                    <span>{perk.icon}</span>
                    <span>{perk.text}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <Button
                onClick={() => { onClose(); navigate("/subscription"); }}
                className="w-full h-12 text-base font-black rounded-xl bg-gradient-to-r from-[#E50914] to-orange-500 hover:from-[#c4000f] hover:to-orange-600 text-white shadow-lg shadow-[#E50914]/30 border-0"
              >
                <Zap className="w-5 h-5 mr-2" />
                Subscribe Now — at just ₹29/month
              </Button>

              <p className="text-xs text-gray-500 text-center mt-3">
                Cancel anytime • Instant activation
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SubscribePopup;
