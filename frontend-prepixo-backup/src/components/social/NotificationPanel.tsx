import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Flame, MessageCircle, AtSign, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
  from_user: {
    id: string;
    combat_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string | null;
}

export const NotificationPanel = ({ isOpen, onClose, currentUserId }: NotificationPanelProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && currentUserId) {
      fetchNotifications();
      markAllAsRead();
    }
  }, [isOpen, currentUserId]);

  const fetchNotifications = async () => {
    if (!currentUserId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("social_notifications")
        .select(`
          id,
          type,
          message,
          is_read,
          created_at,
          from_user_id
        `)
        .eq("user_id", currentUserId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch from_user data
      const enrichedNotifications = await Promise.all(
        (data || []).map(async (notif) => {
          let fromUser = null;
          if (notif.from_user_id) {
            const { data: userData } = await supabase
              .from("users")
              .select("id, combat_name, avatar_url")
              .eq("id", notif.from_user_id)
              .single();
            fromUser = userData;
          }
          return {
            ...notif,
            from_user: fromUser,
          };
        })
      );

      setNotifications(enrichedNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAllAsRead = async () => {
    if (!currentUserId) return;

    await supabase
      .from("social_notifications")
      .update({ is_read: true })
      .eq("user_id", currentUserId)
      .eq("is_read", false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Flame className="w-5 h-5 text-orange-500" />;
      case "comment":
        return <MessageCircle className="w-5 h-5 text-blue-400" />;
      case "mention":
        return <AtSign className="w-5 h-5 text-red-400" />;
      default:
        return <Bell className="w-5 h-5 text-muted-foreground" />;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-0 h-full w-full max-w-md bg-card border-l border-border/50 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/30">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Notifications
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Notifications List */}
          <div className="h-[calc(100%-72px)] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <Bell className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No notifications yet
                </h3>
                <p className="text-muted-foreground text-sm">
                  When someone likes or comments on your posts, you'll see it here
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/20">
                {notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex items-start gap-3 p-4 hover:bg-muted/30 transition-colors ${
                      !notification.is_read ? "bg-primary/5" : ""
                    }`}
                  >
                    {/* User Avatar or Icon */}
                    {notification.from_user ? (
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={notification.from_user.avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-crimson text-primary-foreground">
                          {notification.from_user.combat_name?.[0]?.toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        {getNotificationIcon(notification.type)}
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <p className="text-foreground text-sm">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
