import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { usePlanner } from "@/hooks/usePlanner";
import { HabitMatrix } from "@/components/planner/HabitMatrix";
import { MonthlyAreaChart } from "@/components/planner/MonthlyAreaChart";
import { DailyProgressDonut } from "@/components/planner/DailyProgressDonut";
import { TopHabitsRanking } from "@/components/planner/TopHabitsRanking";
import { MonthSelector } from "@/components/planner/MonthSelector";
import { GrowthHeatmap } from "@/components/planner/GrowthHeatmap";
import { ConsistencyGraph } from "@/components/planner/ConsistencyGraph";
import { SyllabusProgress } from "@/components/planner/SyllabusProgress";
import { PomodoroTimer } from "@/components/planner/PomodoroTimer";
import { GoalSetup } from "@/components/planner/GoalSetup";
import { Target, Calendar, TrendingUp, BookOpen, Loader2, Flame, Clock, CheckCircle2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// IST timezone offset
const IST_OFFSET = 5.5 * 60 * 60 * 1000;

const getISTDate = () => {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + IST_OFFSET);
};

const StudyPlanner = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(getISTDate());
  const [userId, setUserId] = useState<string | null>(null);

  const {
    tasks,
    syllabusMastery,
    dailyAggregates,
    userGoal,
    loading,
    addTask,
    completeTask,
    deleteTask,
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
  const handleToggleTask = useCallback(async (taskId: string, date: string, completed: boolean) => {
    if (taskId === "new") {
      // This is a new task entry - should be handled by the habit matrix
      return;
    }
    
    if (completed) {
      await completeTask(taskId);
    } else {
      // Mark as pending again
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
  }, [completeTask, refetch]);

  // Handle add habit
  const handleAddHabit = useCallback(async (habitName: string, subject: string, goalCount: number) => {
    if (!userId) return;
    
    // Create tasks for the entire month
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
      toast.error("Failed to add habit");
    } else {
      toast.success(`Added "${habitName}" to your habits!`);
      refetch();
    }
  }, [userId, selectedMonth, refetch]);

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

  if (isAuthenticated === null || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate days until JEE
  const jeeDate = new Date("2026-04-02");
  const today = new Date();
  const daysUntilJEE = Math.ceil((jeeDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20 pb-12 px-4">
        <div className="max-w-[1600px] mx-auto">
          {/* Header with JEE Countdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-primary/30 to-crimson/20 rounded-xl">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold gradient-text">Success Engine</h1>
                  <p className="text-muted-foreground">Your personalized JEE habit & goal tracker</p>
                </div>
              </div>

              {/* JEE Countdown Badge */}
              <motion.div
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-primary/20 to-crimson/20 border border-primary/30"
              >
                <Flame className="h-6 w-6 text-primary" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{daysUntilJEE}</p>
                  <p className="text-xs text-muted-foreground">Days to JEE 2026</p>
                </div>
                <Calendar className="h-6 w-6 text-primary" />
              </motion.div>
            </div>
          </motion.div>

          {/* Goal Setup (if no goal set) */}
          {!userGoal && (
            <div className="mb-8">
              <GoalSetup userGoal={userGoal} onSaveGoal={saveUserGoal} />
            </div>
          )}

          {/* Main Dashboard */}
          {userGoal && (
            <>
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Days Left", value: daysUntilJEE, icon: Calendar, color: "text-primary" },
                  { label: "Today's Tasks", value: `${todaysCompleted}/${todaysTasks.length}`, icon: CheckCircle2, color: "text-green-400" },
                  { label: "Streak", value: `${dailyAggregates.filter((a) => a.completion_score >= 50).length}d`, icon: TrendingUp, color: "text-orange-400" },
                  { label: "Focus Hours", value: `${Math.round(dailyAggregates.reduce((acc, a) => acc + a.focus_minutes, 0) / 60)}h`, icon: Clock, color: "text-purple-400" },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    className="bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <stat.icon className={`h-4 w-4 ${stat.color}`} />
                      <span className="text-xs text-muted-foreground">{stat.label}</span>
                    </div>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  </motion.div>
                ))}
              </div>

              {/* Tabs for different views */}
              <Tabs defaultValue="matrix" className="space-y-6">
                <TabsList className="bg-card/50 border border-border">
                  <TabsTrigger value="matrix" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Habit Matrix
                  </TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger value="syllabus">Syllabus</TabsTrigger>
                  <TabsTrigger value="focus">Focus Mode</TabsTrigger>
                </TabsList>

                {/* Habit Matrix Tab */}
                <TabsContent value="matrix" className="space-y-6">
                  {/* Month Selector */}
                  <MonthSelector
                    selectedMonth={selectedMonth}
                    onMonthChange={setSelectedMonth}
                  />

                  {/* Z-Pattern Layout */}
                  <div className="grid lg:grid-cols-4 gap-6">
                    {/* Left: Area Chart (spans 3 cols) */}
                    <div className="lg:col-span-3">
                      <MonthlyAreaChart
                        dailyStats={dailyStats}
                        selectedMonth={selectedMonth}
                      />
                    </div>

                    {/* Right: Daily Progress Donut */}
                    <div className="lg:col-span-1">
                      <DailyProgressDonut
                        completed={todaysCompleted}
                        total={todaysTasks.length || 1}
                      />
                    </div>
                  </div>

                  {/* Habit Matrix Grid */}
                  <div className="grid lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-3">
                      <HabitMatrix
                        tasks={tasks}
                        dailyAggregates={dailyAggregates}
                        selectedMonth={selectedMonth}
                        onToggleTask={handleToggleTask}
                        onAddHabit={handleAddHabit}
                        onDeleteHabit={handleDeleteHabit}
                      />
                    </div>

                    {/* Right Sidebar: Top Habits */}
                    <div className="lg:col-span-1">
                      <TopHabitsRanking habits={topHabits} />
                    </div>
                  </div>
                </TabsContent>

                {/* Analytics Tab */}
                <TabsContent value="analytics" className="space-y-6">
                  <div className="grid lg:grid-cols-2 gap-6">
                    <ConsistencyGraph dailyAggregates={dailyAggregates} />
                    <GrowthHeatmap dailyAggregates={dailyAggregates} />
                  </div>
                </TabsContent>

                {/* Syllabus Tab */}
                <TabsContent value="syllabus">
                  <SyllabusProgress syllabusMastery={syllabusMastery} />
                </TabsContent>

                {/* Focus Mode Tab */}
                <TabsContent value="focus">
                  <div className="max-w-md mx-auto">
                    <PomodoroTimer onSessionComplete={addFocusSession} />
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default StudyPlanner;
