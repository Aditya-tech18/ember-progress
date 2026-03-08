import { useState, useEffect } from "react";
import { X, Download, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const DownloadAppBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Show banner after a short delay
  useEffect(() => {
    // Check if user already dismissed it this session
    const dismissed = sessionStorage.getItem("downloadBannerDismissed");
    if (dismissed) {
      setIsDismissed(true);
      return;
    }
    
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  const handleDownload = () => {
    // Create a hidden anchor to trigger download
    const link = document.createElement('a');
    link.href = "https://prepixo.com/download/prepixo-app.apk";
    link.download = "prepixo-app.apk";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    sessionStorage.setItem("downloadBannerDismissed", "true");
  };

  if (isDismissed) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative z-40 bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-600 shadow-lg"
        >
          {/* Animated sparkle background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "linear",
              }}
              className="w-full h-full opacity-20"
              style={{
                backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.5'%3E%3Ccircle cx='20' cy='20' r='2'/%3E%3C/g%3E%3C/svg%3E\")",
                backgroundSize: "40px 40px",
              }}
            />
          </div>

          <div className="container mx-auto px-4 py-3 relative">
            <div className="flex items-center justify-between gap-4">
              {/* Left section - Icon and text */}
              <div className="flex items-center gap-3 flex-1">
                <motion.div 
                  className="hidden sm:flex items-center justify-center w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl"
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Smartphone className="w-5 h-5 text-white" />
                </motion.div>
                <div className="flex flex-col">
                  <span className="text-white font-bold text-sm sm:text-base flex items-center gap-2">
                    📱 Download the Prepixo App
                    <motion.span
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="hidden sm:inline text-xs bg-yellow-400 text-black px-2 py-0.5 rounded-full font-bold"
                    >
                      NEW
                    </motion.span>
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
                  className="flex items-center gap-2 bg-white text-purple-600 font-bold px-4 py-2 rounded-full text-sm shadow-lg hover:bg-purple-50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Download APK</span>
                  <span className="sm:hidden">Download</span>
                </motion.button>
                
                <button
                  onClick={handleDismiss}
                  className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                  aria-label="Close banner"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* Animated gradient line at bottom */}
          <motion.div 
            animate={{ 
              background: [
                "linear-gradient(90deg, #fbbf24, #f472b6, #fbbf24)",
                "linear-gradient(90deg, #f472b6, #fbbf24, #f472b6)",
                "linear-gradient(90deg, #fbbf24, #f472b6, #fbbf24)"
              ]
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="h-0.5" 
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
