import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onComplete, 500);
    }, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[100] bg-[#0a0a0a] flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="flex flex-col items-center"
          >
            <img
              src="/images/prepixo-splash.jpg"
              alt="Prepixo"
              className="w-32 h-32 rounded-3xl shadow-2xl shadow-red-500/30"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
