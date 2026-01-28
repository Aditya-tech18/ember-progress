import { useState } from "react";
import { motion } from "framer-motion";
import { Cloud, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreatePostModal } from "./CreatePostModal";
import { PostCloudModal } from "./PostCloudModal";

export const SocialFeedButton = () => {
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showPostCloud, setShowPostCloud] = useState(false);

  return (
    <>
      {/* Floating Post Cloud Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-20 left-1/2 -translate-x-1/2 z-40"
      >
        <Button
          onClick={() => setShowPostCloud(true)}
          className="bg-gradient-to-r from-primary/90 to-crimson/90 hover:from-primary hover:to-crimson text-primary-foreground font-semibold px-6 py-2 rounded-full shadow-lg shadow-primary/30 flex items-center gap-2"
        >
          <Cloud className="w-5 h-5" />
          View Post Cloud
        </Button>
      </motion.div>

      {/* Floating Create Post Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed bottom-24 right-6 z-40"
      >
        <Button
          onClick={() => setShowCreatePost(true)}
          size="icon"
          className="w-14 h-14 rounded-full bg-gradient-to-r from-primary to-crimson hover:opacity-90 shadow-lg shadow-primary/40"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </motion.div>

      {/* Modals */}
      <CreatePostModal
        isOpen={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        onPostCreated={() => {}}
      />

      <PostCloudModal
        isOpen={showPostCloud}
        onClose={() => setShowPostCloud(false)}
      />
    </>
  );
};
