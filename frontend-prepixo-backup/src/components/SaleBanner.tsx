import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const SaleBanner = () => {
  const [dismissed, setDismissed] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const deadline = new Date("2026-03-15T23:59:59+05:30");
    const update = () => {
      const now = new Date();
      const diff = deadline.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft("Expired");
        return;
      }
      const days = Math.floor(diff / 86400000);
      const hrs = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(`${days}d ${hrs}h ${mins}m`);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  if (dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="relative overflow-hidden z-30 mt-14"
      >
        <div className="bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 py-2.5 px-4">
          <div className="absolute inset-0 opacity-20">
            <motion.div
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="w-1/3 h-full bg-gradient-to-r from-transparent via-white to-transparent"
            />
          </div>
          <div
            className="container mx-auto flex items-center justify-center gap-2 cursor-pointer relative"
            onClick={() => navigate("/subscription")}
          >
            <Zap className="w-4 h-4 text-white flex-shrink-0 animate-pulse" />
            <span className="text-xs sm:text-sm font-extrabold text-white text-center tracking-wide">
              🔥 EXAM SEASON SALE IS LIVE — All Features At Just ₹9/- • {timeLeft} left → GRAB NOW!
            </span>
            <Sparkles className="w-4 h-4 text-yellow-200 flex-shrink-0" />
            <button
              onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
              className="absolute right-0 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
