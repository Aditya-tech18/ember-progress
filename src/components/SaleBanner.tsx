import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const SaleBanner = () => {
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  if (dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="relative bg-gradient-to-r from-yellow-600 via-amber-500 to-yellow-600 text-black overflow-hidden"
      >
        <div className="absolute inset-0 opacity-20">
          <motion.div
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="w-1/3 h-full bg-gradient-to-r from-transparent via-white to-transparent"
          />
        </div>
        <div
          className="container mx-auto px-3 py-1.5 flex items-center justify-center gap-2 cursor-pointer relative"
          onClick={() => navigate("/subscription")}
        >
          <Sparkles className="w-3.5 h-3.5 text-black flex-shrink-0" />
          <span className="text-xs sm:text-sm font-bold text-center">
            🎉 All Features at Just ₹9! Grab the Offer Now →
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-black/10 rounded-full transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
