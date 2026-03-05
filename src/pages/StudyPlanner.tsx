import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { usePlanner } from "@/hooks/usePlanner";
import { HabitMatrix } from "@/components/planner/HabitMatrix";
import { MonthlyAreaChart } from "@/components/planner/MonthlyAreaChart";
import { DailyTodoList } from "@/components/planner/DailyTodoList";
import { TopHabitsRanking } from "@/components/planner/TopHabitsRanking";
import { MonthSelector } from "@/components/planner/MonthSelector";
import { GrowthHeatmap } from "@/components/planner/GrowthHeatmap";
import { ConsistencyGraph } from "@/components/planner/ConsistencyGraph";
import { SyllabusProgress } from "@/components/planner/SyllabusProgress";
import { PomodoroTimer } from "@/components/planner/PomodoroTimer";
import { GoalSetup } from "@/components/planner/GoalSetup";
import { 
  Target, Calendar, TrendingUp, Clock, CheckCircle2, Loader2, Flame, Settings, 
  LayoutGrid, BarChart3, BookOpen, Timer, ChevronRight, Sparkles, Zap, Trophy
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// IST timezone offset
const IST_OFFSET = 5.5 * 60 * 60 * 1000;

const getISTDate = () => {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + IST_OFFSET);
};

const MAX_HABITS = 10;

// Tab configuration with icons and descriptions
const TABS = [
  { id: "matrix", label: "Habit Matrix", icon: LayoutGrid, description: "Track daily habits" },
  { id: "analytics", label: "Analytics", icon: BarChart3, description: "View your progress" },
  { id: "syllabus", label: "Syllabus", icon: BookOpen, description: "Master your syllabus" },
  { id: "focus", label: "Focus Mode", icon: Timer, description: "Deep work sessions" },
];

const StudyPlanner = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(getISTDate());
  const [userId, setUserId] = useState<string | null>(null);
  const [showGoalSetup, setShowGoalSetup] = useState(false);
  const [activeTab, setActiveTab] = useState("matrix");

  const {
    tasks,
    syllabusMastery,
    dailyAggregates,
    userGoal,
    loading,
    completeTask,
    saveUserGoal,
    addFocusSession,
    refetch,
  } = usePlanner();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
      } else {
        setIsAuthenticated(true);
        setUserId(user.id);
      }
    };
    checkAuth();
  }, [navigate]);

  // Calculate today's stats in IST
  const todayIST = getISTDate().toISOString().split("T")[0];
  
  const todaysTasks = useMemo(() => {
    return tasks.filter((t) => t.due_date === todayIST);
  }, [tasks, todayIST]);

  const todaysCompleted = useMemo(() => {
    return todaysTasks.filter((t) => t.status === "completed").length;
  }, [todaysTasks]);

  // Get unique habits count
  const uniqueHabits = useMemo(() => {
    const habitNames = new Set(tasks.map(t => t.task_name));
    return habitNames.size;
  }, [tasks]);

  // Generate daily stats for the area chart
  const dailyStats = useMemo(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const numDays = new Date(year, month + 1, 0).getDate();
    
    const stats: { date: string; completed: number; total: number }[] = [];
    
    for (let i = 1; i <= numDays; i++) {
      const date = new Date(year, month, i).toISOString().split("T")[0];
      const dayTasks = tasks.filter((t) => t.due_date === date);
      const completed = dayTasks.filter((t) => t.status === "completed").length;
      
      stats.push({
        date,
        completed,
        total: dayTasks.length || 1,
      });
    }
    
    return stats;
  }, [tasks, selectedMonth]);

  // Top habits ranking
  const topHabits = useMemo(() => {
    const habitMap = new Map<string, { name: string; subject: string; completed: number; total: number }>();
    
    tasks.forEach((task) => {
      const existing = habitMap.get(task.task_name);
      if (existing) {
        existing.total += 1;
        if (task.status === "completed") existing.completed += 1;
      } else {
        habitMap.set(task.task_name, {
          name: task.task_name,
          subject: task.subject,
          completed: task.status === "completed" ? 1 : 0,
          total: 1,
        });
      }
    });
    
    return Array.from(habitMap.values())
      .map((h) => ({
        ...h,
        progress: h.total > 0 ? (h.completed / h.total) * 100 : 0,
      }))
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 10);
  }, [tasks]);

  // Handle habit toggle
  const handleToggleTask = useCallback(async (taskId: string, date: string, completed: boolean, habitName?: string, subject?: string) => {
    if (taskId === "create_new" && habitName && subject && userId) {
      // Create a new task for this habit on this date, then mark it completed
      const { data, error } = await supabase
        .from("planner_tasks")
        .insert({
          user_id: userId,
          task_name: habitName,
          subject: subject,
          due_date: date,
          status: "completed",
          task_type: "habit",
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) {
        toast.error("Failed to create task");
      } else {
        toast.success("Habit marked!");
        refetch();
      }
      return;
    }
    
    if (taskId === "new") return;
    
    if (completed) {
      await completeTask(taskId);
    } else {
      const { error } = await supabase
        .from("planner_tasks")
        .update({ status: "pending", completed_at: null })
        .eq("id", taskId);
      
      if (error) {
        toast.error("Failed to update task");
      } else {
        refetch();
      }
    }
  }, [completeTask, refetch, userId]);

  // Handle add habit
  const handleAddHabit = useCallback(async (habitName: string, subject: string, goalCount: number) => {
    if (!userId) {
      toast.error("Please login to add habits");
      return;
    }

    if (uniqueHabits >= MAX_HABITS) {
      toast.error(`Maximum ${MAX_HABITS} habits allowed. Delete some to add new ones.`);
      return;
    }
    
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const numDays = new Date(year, month + 1, 0).getDate();
    
    const tasksToInsert = [];
    for (let i = 1; i <= Math.min(numDays, goalCount); i++) {
      const date = new Date(year, month, i).toISOString().split("T")[0];
      tasksToInsert.push({
        user_id: userId,
        task_name: habitName,
        subject: subject,
        due_date: date,
        status: "pending",
        task_type: "habit",
      });
    }
    
    const { error } = await supabase
      .from("planner_tasks")
      .insert(tasksToInsert);
    
    if (error) {
      console.error("Error adding habit:", error);
      toast.error("Failed to add habit: " + error.message);
    } else {
      toast.success(`Added "${habitName}" to your habits!`);
      refetch();
    }
  }, [userId, selectedMonth, refetch, uniqueHabits]);

  // Handle delete habit
  const handleDeleteHabit = useCallback(async (habitName: string) => {
    if (!userId) return;
    
    const { error } = await supabase
      .from("planner_tasks")
      .delete()
      .eq("user_id", userId)
      .eq("task_name", habitName);
    
    if (error) {
      toast.error("Failed to delete habit");
    } else {
      toast.success(`Removed "${habitName}" from habits`);
      refetch();
    }
  }, [userId, refetch]);

  // Handle rename habit
  const handleRenameHabit = useCallback(async (oldName: string, newName: string) => {
    if (!userId) return;
    const { error } = await supabase
      .from("planner_tasks")
      .update({ task_name: newName })
      .eq("user_id", userId)
      .eq("task_name", oldName);
    if (error) {
      toast.error("Failed to rename habit");
    } else {
      toast.success(`Renamed to "${newName}"`);
      refetch();
    }
  }, [userId, refetch]);

  if (isAuthenticated === null || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="absolute inset-0 bg-primary/20 rounded-full blur-xl"
            />
          </div>
          <p className="text-muted-foreground">Loading your success engine...</p>
        </motion.div>
      </div>
    );
  }

  // Calculate days until target
  const targetDate = userGoal?.exam_date ? new Date(userGoal.exam_date) : new Date("2026-04-02");
  const today = new Date();
  const daysUntilTarget = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // Calculate completion rate
  const completionRate = todaysTasks.length > 0 
    ? Math.round((todaysCompleted / todaysTasks.length) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />

      <main className="pt-20 pb-12 px-4">
        <div className="max-w-[1600px] mx-auto">
          {/* Hero Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            {/* Main Title Bar */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-6">
              <div className="flex items-center gap-4">
                <motion.div 
                  whileHover={{ rotate: 15, scale: 1.1 }}
                  className="p-4 bg-gradient-to-br from-emerald-500/30 to-teal-500/20 rounded-2xl shadow-lg shadow-emerald-500/20"
                >
                  <Target className="h-10 w-10 text-emerald-400" />
                </motion.div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                    Success Engine
                  </h1>
                  <p className="text-muted-foreground mt-1">Build habits that transform your future</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Quick Actions */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowGoalSetup(!showGoalSetup)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-card/80 border border-border hover:border-primary/50 rounded-xl transition-all"
                >
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{userGoal ? "Edit Goal" : "Set Goal"}</span>
                </motion.button>

                {/* Track Study Hours Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/study-hours")}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white"
                  style={{ background: "linear-gradient(90deg, hsl(358 84% 50%), hsl(30 90% 50%))" }}
                  title="Track your study sessions and build consistency!"
                >
                  <Timer className="h-4 w-4" />
                  <span>Track Study Hours</span>
                </motion.button>

                {/* Countdown Badge */}
                <motion.div
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="flex items-center gap-4 px-5 py-3 rounded-2xl bg-gradient-to-r from-primary/20 via-crimson/10 to-orange-500/20 border border-primary/30 shadow-lg shadow-primary/10"
                >
                  <Flame className="h-6 w-6 text-primary animate-pulse" />
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary">{userGoal ? daysUntilTarget : "--"}</p>
                    <p className="text-xs text-muted-foreground">Days to Goal</p>
                  </div>
                  <Calendar className="h-6 w-6 text-primary/60" />
                </motion.div>
              </div>
            </div>

            {/* Goal Setup (collapsible) */}
            <AnimatePresence>
              {showGoalSetup && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="overflow-hidden"
                >
                  <GoalSetup userGoal={userGoal} onSaveGoal={saveUserGoal} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Quick Stats Cards - Enhanced */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            {[
              { 
                label: "Days Left", 
                value: userGoal ? daysUntilTarget : "--", 
                icon: Calendar, 
                gradient: "from-violet-500/20 to-purple-500/10",
                iconColor: "text-violet-400",
                valueColor: "text-violet-400"
              },
              { 
                label: "Today's Progress", 
                value: `${todaysCompleted}/${todaysTasks.length}`, 
                icon: CheckCircle2, 
                gradient: "from-emerald-500/20 to-green-500/10",
                iconColor: "text-emerald-400",
                valueColor: "text-emerald-400",
                badge: completionRate >= 80 ? "🔥" : completionRate >= 50 ? "💪" : null
              },
              { 
                label: "Active Habits", 
                value: `${uniqueHabits}/${MAX_HABITS}`, 
                icon: Target, 
                gradient: "from-blue-500/20 to-cyan-500/10",
                iconColor: "text-blue-400",
                valueColor: "text-blue-400"
              },
              { 
                label: "Current Streak", 
                value: `${dailyAggregates.filter((a) => a.completion_score >= 50).length}d`, 
                icon: TrendingUp, 
                gradient: "from-orange-500/20 to-amber-500/10",
                iconColor: "text-orange-400",
                valueColor: "text-orange-400",
                badge: dailyAggregates.filter((a) => a.completion_score >= 50).length >= 7 ? "🏆" : null
              },
              { 
                label: "Focus Hours", 
                value: `${Math.round(dailyAggregates.reduce((acc, a) => acc + a.focus_minutes, 0) / 60)}h`, 
                icon: Clock, 
                gradient: "from-pink-500/20 to-rose-500/10",
                iconColor: "text-pink-400",
                valueColor: "text-pink-400"
              },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                whileHover={{ scale: 1.02, y: -2 }}
                className={`relative bg-gradient-to-br ${stat.gradient} backdrop-blur-sm rounded-2xl p-5 border border-border/50 hover:border-primary/30 transition-all shadow-lg`}
              >
                {stat.badge && (
                  <span className="absolute -top-2 -right-2 text-xl">{stat.badge}</span>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                  <span className="text-xs text-muted-foreground font-medium">{stat.label}</span>
                </div>
                <p className={`text-3xl font-bold ${stat.valueColor}`}>{stat.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Enhanced Tab Navigation */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 p-1.5 bg-card/50 backdrop-blur-sm rounded-2xl border border-border">
              {TABS.map((tab) => (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === "matrix" && (
              <motion.div
                key="matrix"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* Month Selector */}
                <MonthSelector
                  selectedMonth={selectedMonth}
                  onMonthChange={setSelectedMonth}
                />

                {/* 1. Daily Task Completion Trend (Area Chart) */}
                <MonthlyAreaChart
                  dailyStats={dailyStats}
                  selectedMonth={selectedMonth}
                />

                {/* 2. Daily Habits Matrix */}
                <HabitMatrix
                  tasks={tasks}
                  dailyAggregates={dailyAggregates}
                  selectedMonth={selectedMonth}
                  onToggleTask={handleToggleTask}
                  onAddHabit={handleAddHabit}
                  onDeleteHabit={handleDeleteHabit}
                  onRenameHabit={handleRenameHabit}
                  maxHabits={MAX_HABITS}
                  currentHabitCount={uniqueHabits}
                />

                {/* 3. Habit Ranking + 4. Today's To-Do List side by side */}
                <div className="grid lg:grid-cols-2 gap-6">
                  <TopHabitsRanking habits={topHabits} />
                  <DailyTodoList
                    userId={userId}
                    todayIST={todayIST}
                    onRefetch={refetch}
                    tasks={tasks}
                  />
                </div>
              </motion.div>
            )}

            {activeTab === "analytics" && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="grid lg:grid-cols-2 gap-6">
                  <ConsistencyGraph dailyAggregates={dailyAggregates} />
                  <GrowthHeatmap dailyAggregates={dailyAggregates} />
                </div>
              </motion.div>
            )}

            {activeTab === "syllabus" && (
              <motion.div
                key="syllabus"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <SyllabusProgress syllabusMastery={syllabusMastery} />
              </motion.div>
            )}

            {activeTab === "focus" && (
              <motion.div
                key="focus"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="max-w-md mx-auto">
                  <PomodoroTimer onSessionComplete={addFocusSession} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default StudyPlanner;
