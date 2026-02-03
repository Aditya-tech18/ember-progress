import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PlannerTask {
  id: string;
  user_id: string;
  subject: string;
  task_name: string;
  task_type: string;
  due_date: string;
  status: string;
  is_backlog: boolean;
  original_date: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface SyllabusMastery {
  id: string;
  user_id: string;
  chapter_id: string | null;
  chapter_name: string;
  subject: string;
  mastery_status: string;
  completed_at: string | null;
  next_revision_date: string | null;
}

export interface DailyAggregate {
  id: string;
  user_id: string;
  date: string;
  tasks_total: number;
  tasks_completed: number;
  completion_score: number;
  focus_minutes: number;
  pyqs_solved: number;
}

export interface UserGoal {
  id: string;
  user_id: string;
  target_exam: string;
  target_session: string;
  target_percentile: number;
  exam_date: string;
}

export const usePlanner = () => {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [syllabusMastery, setSyllabusMastery] = useState<SyllabusMastery[]>([]);
  const [dailyAggregates, setDailyAggregates] = useState<DailyAggregate[]>([]);
  const [userGoal, setUserGoal] = useState<UserGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        await Promise.all([
          fetchTasks(user.id),
          fetchSyllabusMastery(user.id),
          fetchDailyAggregates(user.id),
          fetchUserGoal(user.id),
        ]);
      }
      setLoading(false);
    };
    init();
  }, []);

  const fetchTasks = async (uid: string) => {
    const { data, error } = await supabase
      .from("planner_tasks")
      .select("*")
      .eq("user_id", uid)
      .order("due_date", { ascending: true });

    if (!error && data) {
      setTasks(data as PlannerTask[]);
    }
  };

  const fetchSyllabusMastery = async (uid: string) => {
    const { data, error } = await supabase
      .from("syllabus_mastery")
      .select("*")
      .eq("user_id", uid);

    if (!error && data) {
      setSyllabusMastery(data as SyllabusMastery[]);
    }
  };

  const fetchDailyAggregates = async (uid: string) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from("daily_aggregates")
      .select("*")
      .eq("user_id", uid)
      .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
      .order("date", { ascending: true });

    if (!error && data) {
      setDailyAggregates(data as DailyAggregate[]);
    }
  };

  const fetchUserGoal = async (uid: string) => {
    const { data, error } = await supabase
      .from("user_goals")
      .select("*")
      .eq("user_id", uid)
      .single();

    if (!error && data) {
      setUserGoal(data as UserGoal);
    }
  };

  const addTask = async (task: Omit<PlannerTask, "id" | "user_id" | "created_at" | "completed_at" | "is_backlog" | "original_date">) => {
    if (!userId) return;

    const { data, error } = await supabase
      .from("planner_tasks")
      .insert({
        user_id: userId,
        ...task,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error adding task", description: error.message, variant: "destructive" });
      return;
    }

    if (data) {
      setTasks((prev) => [...prev, data as PlannerTask]);
      await updateDailyAggregate();
      toast({ title: "Task added!", description: "Your task has been scheduled." });
    }
  };

  const completeTask = async (taskId: string) => {
    const { error } = await supabase
      .from("planner_tasks")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", taskId);

    if (error) {
      toast({ title: "Error completing task", variant: "destructive" });
      return;
    }

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: "completed", completed_at: new Date().toISOString() } : t))
    );
    await updateDailyAggregate();
    toast({ title: "🎉 Task completed!", description: "+1 to your daily score!" });
  };

  const deleteTask = async (taskId: string) => {
    const { error } = await supabase.from("planner_tasks").delete().eq("id", taskId);

    if (!error) {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      await updateDailyAggregate();
    }
  };

  const updateDailyAggregate = async () => {
    if (!userId) return;

    const today = new Date().toISOString().split("T")[0];
    const todayTasks = tasks.filter((t) => t.due_date === today);
    const completedTasks = todayTasks.filter((t) => t.status === "completed");

    const score = todayTasks.length > 0 ? (completedTasks.length / todayTasks.length) * 100 : 0;

    await supabase.from("daily_aggregates").upsert({
      user_id: userId,
      date: today,
      tasks_total: todayTasks.length,
      tasks_completed: completedTasks.length,
      completion_score: score,
    }, { onConflict: "user_id,date" });

    await fetchDailyAggregates(userId);
  };

  const updateSyllabusMastery = async (chapterName: string, subject: string, status: string) => {
    if (!userId) return;

    const { data, error } = await supabase
      .from("syllabus_mastery")
      .upsert({
        user_id: userId,
        chapter_name: chapterName,
        subject,
        mastery_status: status,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,chapter_name" })
      .select()
      .single();

    if (!error && data) {
      setSyllabusMastery((prev) => {
        const existing = prev.find((s) => s.chapter_name === chapterName);
        if (existing) {
          return prev.map((s) => (s.chapter_name === chapterName ? (data as SyllabusMastery) : s));
        }
        return [...prev, data as SyllabusMastery];
      });
    }
  };

  const saveUserGoal = async (goal: Omit<UserGoal, "id" | "user_id">) => {
    if (!userId) return;

    const { data, error } = await supabase
      .from("user_goals")
      .upsert({
        user_id: userId,
        ...goal,
      }, { onConflict: "user_id" })
      .select()
      .single();

    if (!error && data) {
      setUserGoal(data as UserGoal);
      toast({ title: "Goal saved!", description: "Your target has been set." });
    }
  };

  const addFocusSession = async (subject: string, durationMinutes: number) => {
    if (!userId) return;

    await supabase.from("focus_sessions").insert({
      user_id: userId,
      subject,
      duration_minutes: durationMinutes,
      completed_at: new Date().toISOString(),
      focus_points: Math.floor(durationMinutes / 5),
    });

    // Update daily aggregate with focus minutes
    const today = new Date().toISOString().split("T")[0];
    const existingAggregate = dailyAggregates.find((a) => a.date === today);

    await supabase.from("daily_aggregates").upsert({
      user_id: userId,
      date: today,
      focus_minutes: (existingAggregate?.focus_minutes || 0) + durationMinutes,
    }, { onConflict: "user_id,date" });

    await fetchDailyAggregates(userId);
  };

  return {
    tasks,
    syllabusMastery,
    dailyAggregates,
    userGoal,
    loading,
    userId,
    addTask,
    completeTask,
    deleteTask,
    updateSyllabusMastery,
    saveUserGoal,
    addFocusSession,
    refetchTasks: () => userId && fetchTasks(userId),
  };
};
