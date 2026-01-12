import { useState } from "react";
import { X, Download, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const DownloadAppBanner = () => {
  const [isVisible, setIsVisible] = useState(true);

  const handleDownload = () => {
    // Replace with your actual APK download URL
    window.open("https://prepixo.com/download/prepixo-app.apk", "_blank");
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-orange-600 via-red-500 to-pink-600 shadow-lg"
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left section - Icon and text */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center justify-center w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold text-sm sm:text-base">
                  📱 Download the Prepixo App
                </span>
                <span className="text-white/80 text-xs sm:text-sm hidden sm:block">
                  Get the best JEE preparation experience on your phone
                </span>
              </div>
            </div>

            {/* Right section - Download button and close */}
            <div className="flex items-center gap-2 sm:gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDownload}
                className="flex items-center gap-2 bg-white text-orange-600 font-bold px-4 py-2 rounded-full text-sm shadow-lg hover:bg-orange-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download Now</span>
                <span className="sm:hidden">Get App</span>
              </motion.button>
              
              <button
                onClick={() => setIsVisible(false)}
                className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                aria-label="Close banner"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Animated gradient line at bottom */}
        <div className="h-0.5 bg-gradient-to-r from-yellow-400 via-orange-300 to-yellow-400 animate-pulse" />
      </motion.div>
    </AnimatePresence>
  );
};
