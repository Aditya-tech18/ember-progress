import { useState } from "react";
import { motion } from "framer-motion";
import { Cloud } from "lucide-react";
import { PostCloudModal } from "./social/PostCloudModal";

export const CategoryPills = () => {
  const [showPostCloud, setShowPostCloud] = useState(false);

  return (
    <section className="py-6">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-center">
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowPostCloud(true)}
            className="flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-primary/90 to-crimson/90 hover:from-primary hover:to-crimson text-primary-foreground font-bold text-lg shadow-2xl shadow-primary/40 transition-all"
          >
            <Cloud className="w-6 h-6" />
            View Post Cloud
          </motion.button>
        </div>
      </div>

      <PostCloudModal
        isOpen={showPostCloud}
        onClose={() => setShowPostCloud(false)}
      />
    </section>
  );
};
