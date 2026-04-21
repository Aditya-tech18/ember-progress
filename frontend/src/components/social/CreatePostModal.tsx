import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Image, Send, AtSign, Loader2, Lock, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
}

interface UserSuggestion {
  id: string;
  combat_name: string;
  avatar_url: string | null;
}

export const CreatePostModal = ({ isOpen, onClose, onPostCreated }: CreatePostModalProps) => {
  const navigate = useNavigate();
  const { hasAccess, loading: subLoading } = useSubscription();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [content, setContent] = useState("");
  const [caption, setCaption] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [tagSearch, setTagSearch] = useState("");
  const [taggedUsers, setTaggedUsers] = useState<UserSuggestion[]>([]);
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
    };
    if (isOpen) {
      checkAuth();
    }
  }, [isOpen]);

  useEffect(() => {
    if (tagSearch.length >= 2) {
      searchUsers(tagSearch);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [tagSearch]);

  const searchUsers = async (query: string) => {
    const { data, error } = await supabase
      .from("users")
      .select("id, combat_name, avatar_url")
      .ilike("combat_name", `%${query}%`)
      .limit(5);

    if (!error && data) {
      const filtered = data.filter(
        (u) => u.combat_name && !taggedUsers.find((t) => t.id === u.id)
      ) as UserSuggestion[];
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 5MB",
          variant: "destructive",
        });
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleTagUser = (user: UserSuggestion) => {
    if (!taggedUsers.find((t) => t.id === user.id)) {
      setTaggedUsers([...taggedUsers, user]);
    }
    setTagSearch("");
    setShowSuggestions(false);
  };

  const removeTaggedUser = (userId: string) => {
    setTaggedUsers(taggedUsers.filter((u) => u.id !== userId));
  };

  const handleSubmit = async () => {
    if (!content.trim() && !imageFile) {
      toast({
        title: "Empty post",
        description: "Please add some content or an image",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Not logged in",
          description: "Please log in to create a post",
          variant: "destructive",
        });
        return;
      }

      let imageUrl = null;

      // Upload image if exists
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("post_images")
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("post_images")
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      // Create post
      const { data: post, error: postError } = await supabase
        .from("posts")
        .insert({
          user_id: user.id,
          content: content.trim(),
          image_url: imageUrl,
          caption: caption.trim() || null,
        })
        .select()
        .single();

      if (postError) throw postError;

      // Create mentions and notifications
      for (const taggedUser of taggedUsers) {
        await supabase.from("post_mentions").insert({
          post_id: post.id,
          mentioned_user_id: taggedUser.id,
        });

        // Get current user's combat name for notification
        const { data: currentUserData } = await supabase
          .from("users")
          .select("combat_name")
          .eq("id", user.id)
          .single();

        await supabase.from("social_notifications").insert({
          user_id: taggedUser.id,
          from_user_id: user.id,
          post_id: post.id,
          type: "mention",
          message: `${currentUserData?.combat_name || "Someone"} mentioned you in a post`,
        });
      }

      toast({
        title: "Post created!",
        description: "Your achievement has been shared with the community",
      });

      // Reset form
      setContent("");
      setCaption("");
      setImageFile(null);
      setImagePreview(null);
      setTaggedUsers([]);
      onPostCreated();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error creating post",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Show login/subscribe prompt if user doesn't have access
  if (isLoggedIn === false || (!subLoading && !hasAccess)) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-card border border-border/50 rounded-2xl overflow-hidden p-8 text-center"
          >
            <Lock className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {isLoggedIn === false ? "Login Required" : "Premium Feature"}
            </h2>
            <p className="text-muted-foreground mb-6">
              {isLoggedIn === false
                ? "Please login or sign up to share your achievements with the community."
                : "Become a PYQBook member to share achievements and connect with fellow JEE aspirants!"}
            </p>
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => {
                  onClose();
                  navigate(isLoggedIn === false ? "/auth" : "/subscription");
                }}
                className="bg-gradient-to-r from-primary to-crimson text-white"
              >
                {isLoggedIn === false ? (
                  "Login / Sign Up"
                ) : (
                  <>
                    <Crown className="w-4 h-4 mr-2" />
                    Subscribe Now
                  </>
                )}
              </Button>
              <Button variant="ghost" onClick={onClose}>
                Maybe Later
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-card border border-border/50 rounded-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/30">
            <h2 className="text-xl font-bold text-foreground">Share Achievement</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full hover:bg-muted"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Text Content */}
            <Textarea
              placeholder="Share your JEE preparation journey, achievements, or tips..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px] bg-muted/30 border-border/30 resize-none focus:ring-primary"
            />

            {/* Caption */}
            <Input
              placeholder="Add a caption (optional)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="bg-muted/30 border-border/30"
            />

            {/* Image Preview */}
            {imagePreview && (
              <div className="relative rounded-xl overflow-hidden">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full max-h-64 object-cover"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 rounded-full"
                >
                  <X className="w-4 h-4 text-white" />
                </Button>
              </div>
            )}

            {/* Tag Users */}
            <div className="relative">
              <div className="flex items-center gap-2">
                <AtSign className="w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Tag combat names..."
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  className="bg-muted/30 border-border/30"
                />
              </div>

              {/* Suggestions Dropdown */}
              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border/50 rounded-lg shadow-xl z-10 max-h-40 overflow-y-auto">
                  {suggestions.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleTagUser(user)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-crimson flex items-center justify-center text-primary-foreground text-sm font-bold">
                        {user.combat_name?.[0]?.toUpperCase()}
                      </div>
                      <span className="font-medium text-foreground">{user.combat_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tagged Users */}
            {taggedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {taggedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-2 px-3 py-1.5 bg-primary/20 border border-primary/30 rounded-full"
                  >
                    <span className="text-sm text-primary font-medium">@{user.combat_name}</span>
                    <button
                      onClick={() => removeTaggedUser(user.id)}
                      className="text-primary hover:text-primary/70"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-border/30">
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                className="hidden"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-full hover:bg-muted hover:text-primary"
              >
                <Image className="w-5 h-5" />
              </Button>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || (!content.trim() && !imageFile)}
              className="bg-gradient-to-r from-primary to-crimson hover:opacity-90 font-semibold px-6"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Post
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
