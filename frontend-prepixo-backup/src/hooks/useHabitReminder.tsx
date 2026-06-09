import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const IST_OFFSET = 5.5 * 60 * 60 * 1000;
const TWO_HOURS = 2 * 60 * 60 * 1000;

const getISTDate = () => {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + IST_OFFSET);
};

export const useHabitReminder = () => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkAndNotify = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const todayIST = getISTDate().toISOString().split("T")[0];

        const { data: tasks } = await supabase
          .from("planner_tasks")
          .select("id, task_name, status")
          .eq("user_id", user.id)
          .eq("due_date", todayIST)
          .eq("status", "pending");

        if (tasks && tasks.length > 0) {
          // Request browser notification permission
          if ("Notification" in window && Notification.permission === "default") {
            await Notification.requestPermission();
          }

          // Send browser notification
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("📋 Habits Pending!", {
              body: `You have ${tasks.length} habit(s) pending for today. Complete them now!`,
              icon: "/images/prepixo-splash.jpg",
              tag: "habit-reminder",
            });
          }

          // Also show in-app toast
          toast.warning(`📋 ${tasks.length} habit(s) pending for today!`, {
            description: "Open your planner and complete them now.",
            duration: 8000,
            action: {
              label: "Open Planner",
              onClick: () => window.location.href = "/planner",
            },
          });
        }
      } catch (error) {
        console.error("Habit reminder error:", error);
      }
    };

    // Check immediately on mount
    const timeout = setTimeout(checkAndNotify, 5000);

    // Check every 2 hours
    intervalRef.current = setInterval(checkAndNotify, TWO_HOURS);

    return () => {
      clearTimeout(timeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);
};
