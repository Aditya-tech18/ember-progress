import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useStudyTimer } from "@/hooks/useStudyTimer";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Timer, Play, Pause, Square, Flame, Trophy, TrendingUp,
  Calendar, Clock, Target, Award, Zap, BarChart3, Loader2
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart
} from "recharts";
import confetti from "canvas-confetti";

const BADGES = [
  { id: "streak_3", label: "🔥 3-Day Streak", condition: (streak: number) => streak >= 3 },
  { id: "streak_7", label: "🎯 Consistent Learner", condition: (streak: number) => streak >= 7 },
  { id: "streak_14", label: "🏅 Discipline Master", condition: (streak: number) => streak >= 14 },
  { id: "hours_10", label: "⏱️ 10 Hour Club", condition: (_s: number, totalMins: number) => totalMins >= 600 },
  { id: "hours_50", label: "🔥 50 Hour Legend", condition: (_s: number, totalMins: number) => totalMins >= 3000 },
  { id: "hours_100", label: "🏆 100 Hour Champion", condition: (_s: number, totalMins: number) => totalMins >= 6000 },
];

const StudyHours = () => {
  const navigate = useNavigate();
  const [isAuth, setIsAuth] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<"daily" | "weekly" | "monthly">("daily");

  const {
    timerSeconds, isRunning, isPaused,
    todayStats, weeklyStats, monthlyStats, streakCount,
    startTimer, pauseTimer, resumeTimer, stopTimer,
    formatTime, formatMinutes,
  } = useStudyTimer();

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) navigate("/auth");
      else setIsAuth(true);
    };
    check();
  }, [navigate]);

  // Trigger confetti on new badge
  useEffect(() => {
    if (streakCount === 7 || streakCount === 14) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
  }, [streakCount]);

  const todayMinutes = todayStats?.total_minutes || 0;
  const goalMinutes = todayStats?.goal_minutes || 360;
  const completionPct = Math.min(Math.round((todayMinutes / goalMinutes) * 100), 100);

  const totalMonthlyMins = useMemo(() =>
    monthlyStats.reduce((acc, s) => acc + s.total_minutes, 0), [monthlyStats]);

  const weeklyAvg = useMemo(() => {
    if (weeklyStats.length === 0) return 0;
    return Math.round(weeklyStats.reduce((acc, s) => acc + s.total_minutes, 0) / weeklyStats.length);
  }, [weeklyStats]);

  const bestDay = useMemo(() => {
    if (monthlyStats.length === 0) return 0;
    return Math.max(...monthlyStats.map(s => s.total_minutes));
  }, [monthlyStats]);

  // Yesterday comparison
  const yesterday = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  }, []);
  const yesterdayMins = monthlyStats.find(s => s.date === yesterday)?.total_minutes || 0;
  const diffMins = todayMinutes - yesterdayMins;

  // Chart data
  const lineChartData = useMemo(() =>
    monthlyStats.map(s => ({
      date: new Date(s.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      hours: +(s.total_minutes / 60).toFixed(1),
    })), [monthlyStats]);

  const weeklyBarData = useMemo(() =>
    weeklyStats.map(s => ({
      day: new Date(s.date).toLocaleDateString("en-IN", { weekday: "short" }),
      hours: +(s.total_minutes / 60).toFixed(1),
    })), [weeklyStats]);

  // Heatmap data (last 30 days)
  const heatmapData = useMemo(() => {
    const data: { date: string; level: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const stat = monthlyStats.find(s => s.date === dateStr);
      const mins = stat?.total_minutes || 0;
      const level = mins === 0 ? 0 : mins < 60 ? 1 : mins < 180 ? 2 : mins < 300 ? 3 : 4;
      data.push({ date: dateStr, level });
    }
    return data;
  }, [monthlyStats]);

  const earnedBadges = useMemo(() =>
    BADGES.filter(b => b.condition(streakCount, totalMonthlyMins)),
    [streakCount, totalMonthlyMins]);

  if (isAuth === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const heatmapColors = ["hsl(0 0% 15%)", "hsl(358 60% 25%)", "hsl(358 70% 35%)", "hsl(358 80% 45%)", "hsl(358 84% 50%)"];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-12 px-4">
        <div className="max-w-5xl mx-auto space-y-8">

          {/* Hero */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-2">
              Track Your Study Time Like a Pro ⏱️
            </h1>
            <p className="text-muted-foreground text-lg">
              Stay consistent, measure your progress, and build unbeatable discipline.
            </p>
          </motion.div>

          {/* Timer Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative glass-card p-8 text-center overflow-hidden"
          >
            {/* Animated glow ring */}
            {isRunning && !isPaused && (
              <motion.div
                animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 rounded-xl border-2 border-primary/50"
                style={{ boxShadow: "0 0 40px hsl(358 84% 50% / 0.3)" }}
              />
            )}

            <div className="relative z-10">
              <motion.p
                className="text-7xl md:text-8xl font-mono font-bold text-foreground tracking-wider mb-6"
                key={formatTime(timerSeconds)}
              >
                {formatTime(timerSeconds)}
              </motion.p>

              <div className="flex justify-center gap-4 mb-6">
                {!isRunning ? (
                  <Button
                    onClick={startTimer}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 text-lg gap-2"
                    size="lg"
                  >
                    <Play className="h-5 w-5" /> Start
                  </Button>
                ) : (
                  <>
                    {isPaused ? (
                      <Button
                        onClick={resumeTimer}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 gap-2"
                        size="lg"
                      >
                        <Play className="h-5 w-5" /> Resume
                      </Button>
                    ) : (
                      <Button
                        onClick={pauseTimer}
                        className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 gap-2"
                        size="lg"
                      >
                        <Pause className="h-5 w-5" /> Pause
                      </Button>
                    )}
                    <Button
                      onClick={stopTimer}
                      variant="destructive"
                      className="px-6 py-3 gap-2"
                      size="lg"
                    >
                      <Square className="h-5 w-5" /> Stop
                    </Button>
                  </>
                )}
              </div>

              <p className="text-muted-foreground text-sm italic">
                "Every minute counts toward your rank!"
              </p>
            </div>
          </motion.div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "Today's Study",
                value: formatMinutes(todayMinutes),
                icon: Clock,
                extra: diffMins !== 0 ? `${diffMins > 0 ? "+" : ""}${formatMinutes(Math.abs(diffMins))} vs yesterday` : null,
                color: "text-emerald-400",
                gradient: "from-emerald-500/20 to-green-500/10",
              },
              {
                label: "Weekly Avg",
                value: formatMinutes(weeklyAvg) + "/day",
                icon: TrendingUp,
                color: "text-blue-400",
                gradient: "from-blue-500/20 to-cyan-500/10",
              },
              {
                label: "Best Day",
                value: formatMinutes(bestDay),
                icon: Trophy,
                color: "text-amber-400",
                gradient: "from-amber-500/20 to-yellow-500/10",
              },
              {
                label: "Current Streak",
                value: `${streakCount} days`,
                icon: Flame,
                color: "text-primary",
                gradient: "from-primary/20 to-rose-500/10",
              },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                className={`bg-gradient-to-br ${stat.gradient} glass-card p-5 rounded-2xl`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                {stat.extra && (
                  <p className={`text-xs mt-1 ${diffMins >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {stat.extra}
                  </p>
                )}
              </motion.div>
            ))}
          </div>

          {/* Goal Progress Bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card p-6 rounded-2xl"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <span className="font-semibold">Daily Goal</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {formatMinutes(todayMinutes)} / {formatMinutes(goalMinutes)} ({completionPct}%)
              </span>
            </div>
            <div className="w-full h-4 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionPct}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, hsl(358 84% 50%), hsl(30 90% 50%))" }}
              />
            </div>
          </motion.div>

          {/* Charts Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              Your Study Trends
            </h2>

            {/* Tabs */}
            <div className="flex gap-2">
              {(["daily", "weekly", "monthly"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    activeTab === tab
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Line Chart */}
            <div className="glass-card p-6 rounded-2xl">
              <h3 className="text-lg font-semibold mb-4">Hours per Day (Last 30 Days)</h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={lineChartData}>
                  <defs>
                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(358 84% 50%)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(358 84% 50%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 20%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(0 0% 65%)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(0 0% 65%)" }} />
                  <Tooltip
                    contentStyle={{ background: "hsl(0 0% 10%)", border: "1px solid hsl(0 0% 20%)", borderRadius: "8px" }}
                    labelStyle={{ color: "hsl(0 0% 98%)" }}
                  />
                  <Area type="monotone" dataKey="hours" stroke="hsl(358 84% 50%)" fill="url(#colorHours)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Chart */}
            <div className="glass-card p-6 rounded-2xl">
              <h3 className="text-lg font-semibold mb-4">This Week</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={weeklyBarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 20%)" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: "hsl(0 0% 65%)" }} />
                  <YAxis tick={{ fontSize: 12, fill: "hsl(0 0% 65%)" }} />
                  <Tooltip
                    contentStyle={{ background: "hsl(0 0% 10%)", border: "1px solid hsl(0 0% 20%)", borderRadius: "8px" }}
                  />
                  <Bar dataKey="hours" fill="hsl(358 84% 50%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Heatmap */}
            <div className="glass-card p-6 rounded-2xl">
              <h3 className="text-lg font-semibold mb-4">30-Day Consistency Heatmap</h3>
              <div className="flex flex-wrap gap-1.5">
                {heatmapData.map((d, i) => (
                  <motion.div
                    key={d.date}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.02 }}
                    title={`${new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}: Level ${d.level}`}
                    className="w-8 h-8 rounded-md cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                    style={{ backgroundColor: heatmapColors[d.level] }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                <span>Less</span>
                {heatmapColors.map((c, i) => (
                  <div key={i} className="w-4 h-4 rounded" style={{ backgroundColor: c }} />
                ))}
                <span>More</span>
              </div>
            </div>
          </div>

          {/* Badges Section */}
          <div className="glass-card p-6 rounded-2xl">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Award className="h-6 w-6 text-amber-400" />
              Your Achievements
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {BADGES.map(badge => {
                const earned = earnedBadges.some(b => b.id === badge.id);
                return (
                  <motion.div
                    key={badge.id}
                    whileHover={earned ? { scale: 1.05 } : {}}
                    className={`p-4 rounded-xl text-center transition-all ${
                      earned
                        ? "bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30"
                        : "bg-muted/30 border border-border/50 opacity-40"
                    }`}
                  >
                    <p className="text-2xl mb-1">{badge.label.split(" ")[0]}</p>
                    <p className={`text-sm font-medium ${earned ? "text-amber-400" : "text-muted-foreground"}`}>
                      {badge.label.split(" ").slice(1).join(" ")}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
};

export default StudyHours;
