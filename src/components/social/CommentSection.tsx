import { useState, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user: {
    id: string;
    combat_name: string | null;
    avatar_url: string | null;
  };
}

interface CommentSectionProps {
  postId: string;
  postOwnerId: string;
  currentUserId?: string;
  onRefresh: () => void;
}

export const CommentSection = ({
  postId,
  postOwnerId,
  currentUserId,
  onRefresh,
}: CommentSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("post_comments")
        .select(`
          id,
          content,
          created_at,
          user_id
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch user data for each comment
      const commentsWithUsers = await Promise.all(
        (data || []).map(async (comment) => {
          const { data: userData } = await supabase
            .from("users")
            .select("id, combat_name, avatar_url")
            .eq("id", comment.user_id)
            .single();

          return {
            ...comment,
            user: userData || { id: comment.user_id, combat_name: null, avatar_url: null },
          };
        })
      );

      setComments(commentsWithUsers);
    } catch (error: any) {
      console.error("Error fetching comments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!currentUserId) {
      toast({
        title: "Not logged in",
        description: "Please log in to comment",
        variant: "destructive",
      });
      return;
    }

    if (!newComment.trim()) return;

    setIsSubmitting(true);

    try {
      const { data: comment, error } = await supabase
        .from("post_comments")
        .insert({
          post_id: postId,
          user_id: currentUserId,
          content: newComment.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      // Send notification to post owner
      if (postOwnerId !== currentUserId) {
        const { data: currentUserData } = await supabase
          .from("users")
          .select("combat_name")
          .eq("id", currentUserId)
          .single();

        await supabase.from("social_notifications").insert({
          user_id: postOwnerId,
          from_user_id: currentUserId,
          post_id: postId,
          comment_id: comment.id,
          type: "comment",
          message: `${currentUserData?.combat_name || "Someone"} commented on your post`,
        });
      }

      setNewComment("");
      fetchComments();
      onRefresh();
    } catch (error: any) {
      toast({
        title: "Error posting comment",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border-t border-border/20 p-4 space-y-4">
      {/* Comment Input */}
      <div className="flex items-center gap-3">
        <Input
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmitComment()}
          className="bg-muted/30 border-border/30"
        />
        <Button
          size="icon"
          onClick={handleSubmitComment}
          disabled={isSubmitting || !newComment.trim()}
          className="bg-primary hover:bg-primary/90"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Comments List */}
      <div className="space-y-3 max-h-60 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-4">
            No comments yet. Be the first!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={comment.user.avatar_url || undefined} />
                <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                  {comment.user.combat_name?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 bg-muted/30 rounded-xl px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground text-sm">
                    {comment.user.combat_name || "Anonymous"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-foreground text-sm mt-0.5">{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
