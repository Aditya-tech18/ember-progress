import { useState } from "react";
import { motion } from "framer-motion";
import { Flame, MessageCircle, Share2, MoreHorizontal, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { CommentSection } from "./CommentSection";

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

interface PostCardProps {
  post: Post;
  onRefresh: () => void;
  onProfileClick: (userId: string) => void;
  currentUserId?: string;
  currentUserEmail?: string;
}

export const PostCard = ({ post, onRefresh, onProfileClick, currentUserId, currentUserEmail }: PostCardProps) => {
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [localLiked, setLocalLiked] = useState(post.is_liked);
  const [localLikesCount, setLocalLikesCount] = useState(post.likes_count);
  const { toast } = useToast();

  const ADMIN_EMAILS = ['tomacwin9961@gmail.com', 'prepixo.official@gmail.com'];
  const isAdmin = currentUserEmail && ADMIN_EMAILS.includes(currentUserEmail);
  const isOwner = currentUserId === post.user.id;
  const canDelete = isOwner || isAdmin;
  const handleLike = async () => {
    if (!currentUserId) {
      toast({
        title: "Not logged in",
        description: "Please log in to like posts",
        variant: "destructive",
      });
      return;
    }

    setIsLiking(true);

    try {
      if (localLiked) {
        // Unlike
        await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", currentUserId);
        
        setLocalLiked(false);
        setLocalLikesCount((prev) => prev - 1);
      } else {
        // Like
        await supabase.from("post_likes").insert({
          post_id: post.id,
          user_id: currentUserId,
        });

        setLocalLiked(true);
        setLocalLikesCount((prev) => prev + 1);

        // Send notification to post owner
        if (post.user.id !== currentUserId) {
          const { data: currentUserData } = await supabase
            .from("users")
            .select("combat_name")
            .eq("id", currentUserId)
            .single();

          await supabase.from("social_notifications").insert({
            user_id: post.user.id,
            from_user_id: currentUserId,
            post_id: post.id,
            type: "like",
            message: `${currentUserData?.combat_name || "Someone"} 🔥 liked your post`,
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    if (!canDelete) return;
    
    setIsDeleting(true);
    try {
      // Delete the post (RLS policy handles admin check)
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", post.id);

      if (error) throw error;

      toast({
        title: "Post deleted",
        description: "The post has been removed",
      });
      onRefresh();
    } catch (error: any) {
      toast({
        title: "Error deleting post",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: "Check out this JEE achievement!",
        text: post.content || post.caption || "JEE preparation post",
        url: window.location.href,
      });
    } catch {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Post link copied to clipboard",
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card/50 backdrop-blur-sm border border-border/30 rounded-2xl overflow-hidden hover:border-primary/30 transition-colors"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <button
          onClick={() => onProfileClick(post.user.id)}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <Avatar className="w-10 h-10 border-2 border-primary/30">
            <AvatarImage src={post.user.avatar_url || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-crimson text-primary-foreground font-bold">
              {post.user.combat_name?.[0]?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="text-left">
            <p className="font-semibold text-foreground">{post.user.combat_name || "Anonymous"}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </p>
          </div>
        </button>
        {canDelete ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border/50">
              <DropdownMenuItem 
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive focus:text-destructive cursor-pointer"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isAdmin && !isOwner ? "Delete (Admin)" : "Delete Post"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="ghost" size="icon" className="rounded-full">
            <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
          </Button>
        )}
      </div>

      {/* Content */}
      {post.content && (
        <div className="px-4 pb-3">
          <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
        </div>
      )}

      {/* Mentions */}
      {post.mentions.length > 0 && (
        <div className="px-4 pb-3 flex flex-wrap gap-1">
          {post.mentions.map((mention, index) => (
            <span key={index} className="text-primary text-sm font-medium">
              @{mention.combat_name}
            </span>
          ))}
        </div>
      )}

      {/* Image */}
      {post.image_url && (
        <div className="relative">
          <img
            src={post.image_url}
            alt="Post"
            className="w-full max-h-96 object-cover"
            loading="lazy"
          />
          {post.caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <p className="text-white text-sm">{post.caption}</p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between p-4 border-t border-border/20">
        <div className="flex items-center gap-4">
          <motion.button
            onClick={handleLike}
            disabled={isLiking}
            whileTap={{ scale: 0.9 }}
            className={`flex items-center gap-2 transition-colors ${
              localLiked ? "text-orange-500" : "text-muted-foreground hover:text-orange-500"
            }`}
          >
            {isLiking ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Flame className={`w-5 h-5 ${localLiked ? "fill-current" : ""}`} />
            )}
            <span className="font-medium">{localLikesCount}</span>
          </motion.button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="font-medium">{post.comments_count}</span>
          </button>
        </div>

        <button
          onClick={handleShare}
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <CommentSection
          postId={post.id}
          postOwnerId={post.user.id}
          currentUserId={currentUserId}
          onRefresh={onRefresh}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-card border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border/50">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};
