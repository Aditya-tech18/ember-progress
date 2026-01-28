import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Loader2, Bell, TrendingUp, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { PostCard } from "./PostCard";
import { UserProfileModal } from "./UserProfileModal";
import { NotificationPanel } from "./NotificationPanel";

interface Post {
  id: string;
  content: string | null;
  image_url: string | null;
  caption: string | null;
  created_at: string;
  user: {
    id: string;
    combat_name: string | null;
    avatar_url: string | null;
  };
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  mentions: { combat_name: string }[];
}

interface PostCloudModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FeedFilter = "latest" | "trending" | "following";

export const PostCloudModal = ({ isOpen, onClose }: PostCloudModalProps) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FeedFilter>("latest");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      checkAuth();
      fetchPosts();
    }
  }, [isOpen, activeFilter, searchQuery]);

  useEffect(() => {
    if (currentUserId) {
      fetchUnreadCount();
      // Subscribe to new notifications
      const channel = supabase
        .channel("social-notifications")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "social_notifications",
            filter: `user_id=eq.${currentUserId}`,
          },
          () => {
            fetchUnreadCount();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentUserId]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const fetchUnreadCount = async () => {
    if (!currentUserId) return;
    
    const { count } = await supabase
      .from("social_notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", currentUserId)
      .eq("is_read", false);

    setUnreadCount(count || 0);
  };

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      let query = supabase
        .from("posts")
        .select(`
          id,
          content,
          image_url,
          caption,
          created_at,
          user_id
        `);

      // Apply search filter
      if (searchQuery) {
        query = query.or(`content.ilike.%${searchQuery}%,caption.ilike.%${searchQuery}%`);
      }

      // Apply sorting
      if (activeFilter === "latest") {
        query = query.order("created_at", { ascending: false });
      }

      const { data: postsData, error } = await query.limit(50);

      if (error) throw error;

      // Fetch additional data for each post
      const enrichedPosts = await Promise.all(
        (postsData || []).map(async (post) => {
          // Get user data
          const { data: userData } = await supabase
            .from("users")
            .select("id, combat_name, avatar_url")
            .eq("id", post.user_id)
            .single();

          // Get likes count
          const { count: likesCount } = await supabase
            .from("post_likes")
            .select("*", { count: "exact", head: true })
            .eq("post_id", post.id);

          // Get comments count
          const { count: commentsCount } = await supabase
            .from("post_comments")
            .select("*", { count: "exact", head: true })
            .eq("post_id", post.id);

          // Check if current user liked
          let isLiked = false;
          if (user) {
            const { data: likeData } = await supabase
              .from("post_likes")
              .select("id")
              .eq("post_id", post.id)
              .eq("user_id", user.id)
              .maybeSingle();
            isLiked = !!likeData;
          }

          // Get mentions
          const { data: mentionsData } = await supabase
            .from("post_mentions")
            .select("mentioned_user_id")
            .eq("post_id", post.id);

          const mentions = await Promise.all(
            (mentionsData || []).map(async (m) => {
              const { data: mentionedUser } = await supabase
                .from("users")
                .select("combat_name")
                .eq("id", m.mentioned_user_id)
                .single();
              return { combat_name: mentionedUser?.combat_name || "Unknown" };
            })
          );

          return {
            id: post.id,
            content: post.content,
            image_url: post.image_url,
            caption: post.caption,
            created_at: post.created_at,
            user: userData || { id: post.user_id, combat_name: null, avatar_url: null },
            likes_count: likesCount || 0,
            comments_count: commentsCount || 0,
            is_liked: isLiked,
            mentions,
          };
        })
      );

      // Sort by likes for trending
      if (activeFilter === "trending") {
        enrichedPosts.sort((a, b) => b.likes_count - a.likes_count);
      }

      setPosts(enrichedPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background z-50 overflow-hidden"
      >
        {/* Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-md border-b border-border/30 z-10">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-crimson bg-clip-text text-transparent">
                Post Cloud ☁️
              </h1>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowNotifications(true)}
                  className="relative rounded-full"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-crimson text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="rounded-full"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search posts or combat names..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-muted/30 border-border/30"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {[
                { id: "latest" as FeedFilter, icon: Clock, label: "Latest" },
                { id: "trending" as FeedFilter, icon: TrendingUp, label: "Trending" },
              ].map((filter) => (
                <Button
                  key={filter.id}
                  variant={activeFilter === filter.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveFilter(filter.id)}
                  className={`flex items-center gap-2 ${
                    activeFilter === filter.id
                      ? "bg-gradient-to-r from-primary to-crimson border-0"
                      : "border-border/50"
                  }`}
                >
                  <filter.icon className="w-4 h-4" />
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Posts Feed */}
        <div className="max-w-2xl mx-auto px-4 py-6 h-[calc(100vh-200px)] overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Users className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No posts yet</h3>
              <p className="text-muted-foreground">
                Be the first to share your JEE journey!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onRefresh={fetchPosts}
                  onProfileClick={setSelectedProfileId}
                  currentUserId={currentUserId || undefined}
                />
              ))}
            </div>
          )}
        </div>

        {/* User Profile Modal */}
        {selectedProfileId && (
          <UserProfileModal
            userId={selectedProfileId}
            isOpen={!!selectedProfileId}
            onClose={() => setSelectedProfileId(null)}
          />
        )}

        {/* Notifications Panel */}
        {showNotifications && (
          <NotificationPanel
            isOpen={showNotifications}
            onClose={() => {
              setShowNotifications(false);
              fetchUnreadCount();
            }}
            currentUserId={currentUserId}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};
