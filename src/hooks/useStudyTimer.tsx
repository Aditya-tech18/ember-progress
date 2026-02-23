import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StudySession {
  id: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number;
  date: string;
  status: string;
}

interface DailyStat {
  id: string;
  date: string;
  total_minutes: number;
  goal_minutes: number;
  completion_pct: number;
  streak_count: number;
}

export const useStudyTimer = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [todayStats, setTodayStats] = useState<DailyStat | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<DailyStat[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<DailyStat[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [streakCount, setStreakCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pausedDurationRef = useRef(0);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUser();
  }, []);

  const fetchStats = useCallback(async () => {
    if (!userId) return;

    // Fetch today's stats
    const { data: todayData } = await supabase
      .from("study_stats_daily")
      .select("*")
      .eq("user_id", userId)
      .eq("date", today)
      .maybeSingle();
    
    if (todayData) setTodayStats(todayData as DailyStat);

    // Fetch last 30 days stats
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: monthData } = await supabase
      .from("study_stats_daily")
      .select("*")
      .eq("user_id", userId)
      .gte("date", thirtyDaysAgo.toISOString().split("T")[0])
      .order("date", { ascending: true });
    
    if (monthData) {
      setMonthlyStats(monthData as DailyStat[]);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const weekData = (monthData as DailyStat[]).filter(
        d => d.date >= sevenDaysAgo.toISOString().split("T")[0]
      );
      setWeeklyStats(weekData);
    }

    // Fetch today's sessions
    const { data: sessionData } = await supabase
      .from("study_sessions")
      .select("*")
      .eq("user_id", userId)
      .eq("date", today)
      .order("created_at", { ascending: false });
    
    if (sessionData) setSessions(sessionData as StudySession[]);

    // Check for running session
    const { data: runningSession } = await supabase
      .from("study_sessions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "running")
      .maybeSingle();
    
    if (runningSession) {
      setCurrentSessionId(runningSession.id);
      setIsRunning(true);
      const startTime = new Date(runningSession.start_time).getTime();
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setTimerSeconds(elapsed);
    }

    // Calculate streak
    calculateStreak(monthData as DailyStat[] || []);
  }, [userId, today]);

  const calculateStreak = (stats: DailyStat[]) => {
    let streak = 0;
    const sortedStats = [...stats].sort((a, b) => b.date.localeCompare(a.date));
    
    for (let i = 0; i < sortedStats.length; i++) {
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      const expected = expectedDate.toISOString().split("T")[0];
      
      if (sortedStats[i]?.date === expected && sortedStats[i]?.total_minutes > 0) {
        streak++;
      } else {
        break;
      }
    }
    setStreakCount(streak);
  };

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Timer interval
  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, isPaused]);

  const startTimer = async () => {
    if (!userId) {
      toast.error("Please login first");
      return;
    }

    const { data, error } = await supabase
      .from("study_sessions")
      .insert({
        user_id: userId,
        start_time: new Date().toISOString(),
        date: today,
        status: "running",
        duration_minutes: 0,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to start session");
      return;
    }

    setCurrentSessionId(data.id);
    setTimerSeconds(0);
    pausedDurationRef.current = 0;
    setIsRunning(true);
    setIsPaused(false);
    toast.success("⏱️ Study session started!");
  };

  const pauseTimer = async () => {
    setIsPaused(true);
    pausedDurationRef.current = timerSeconds;
    
    if (currentSessionId) {
      await supabase
        .from("study_sessions")
        .update({ status: "paused" })
        .eq("id", currentSessionId);
    }
    toast("⏸️ Session paused");
  };

  const resumeTimer = async () => {
    setIsPaused(false);
    
    if (currentSessionId) {
      await supabase
        .from("study_sessions")
        .update({ status: "running" })
        .eq("id", currentSessionId);
    }
    toast.success("▶️ Session resumed!");
  };

  const stopTimer = async () => {
    if (!currentSessionId || !userId) return;

    const durationMinutes = Math.floor(timerSeconds / 60);
    
    // Update session
    await supabase
      .from("study_sessions")
      .update({
        end_time: new Date().toISOString(),
        duration_minutes: durationMinutes,
        status: "completed",
      })
      .eq("id", currentSessionId);

    // Upsert daily stats
    const currentTotal = (todayStats?.total_minutes || 0) + durationMinutes;
    const goalMins = todayStats?.goal_minutes || 360;
    const completionPct = Math.min(Math.round((currentTotal / goalMins) * 100), 100);

    const { error } = await supabase
      .from("study_stats_daily")
      .upsert(
        {
          user_id: userId,
          date: today,
          total_minutes: currentTotal,
          goal_minutes: goalMins,
          completion_pct: completionPct,
          streak_count: streakCount + (currentTotal > 0 ? 1 : 0),
        },
        { onConflict: "user_id,date" }
      );

    if (error) {
      console.error("Error updating stats:", error);
    }

    setIsRunning(false);
    setIsPaused(false);
    setTimerSeconds(0);
    setCurrentSessionId(null);
    pausedDurationRef.current = 0;

    // Milestone notifications
    if (durationMinutes >= 60) {
      toast.success("🎯 Amazing! You studied for over an hour!");
    } else if (durationMinutes >= 30) {
      toast.success("💪 Great session! 30+ minutes of focused study!");
    } else {
      toast.success("✅ Session saved!");
    }

    if (currentTotal >= 300) {
      toast("🔥 You studied 5+ hours today! Keep it up!", { duration: 5000 });
    }

    fetchStats();
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, "0");
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  const formatMinutes = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  };

  return {
    timerSeconds,
    isRunning,
    isPaused,
    todayStats,
    weeklyStats,
    monthlyStats,
    sessions,
    streakCount,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    formatTime,
    formatMinutes,
    fetchStats,
  };
};
