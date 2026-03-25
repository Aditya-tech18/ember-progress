import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePlanner } from "@/hooks/usePlanner";
import { HabitMatrix } from "@/components/planner/HabitMatrix";
import { ConsistencyHeatmap } from "@/components/ConsistencyHeatmap";
import { MonthSelector } from "@/components/planner/MonthSelector";
import { Target, Calendar, TrendingUp, Flame, Settings } from "lucide-react";
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

export const BuildLifePlanner = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(getISTDate());

  const {
    tasks = [],
    dailyAggregates = [],
    addTask,
    completeTask,
    deleteTask,
    refetch,
  } = usePlanner();

  // Extract unique habits from tasks
  const habits = useMemo(() => {
    const habitMap = new Map();
    tasks.forEach(task => {
      if (!habitMap.has(task.task_name)) {
        habitMap.set(task.task_name, {
          name: task.task_name,
          subject: task.subject,
          goal: 0 // Will be calculated
        });
      }
    });
    return Array.from(habitMap.values());
  }, [tasks]);

  const handleAddHabit = async (habitName: string, subject: string, goalCount: number) => {
    if (!userId) return;
    
    // Create tasks for this month's days based on goal
    const now = getISTDate();
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Create task for each day
    for (let day = 1; day <= Math.min(goalCount, daysInMonth); day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      
      await addTask({
        task_name: habitName,
        subject: subject,
        task_type: "habit",
        due_date: dateStr,
        status: "pending"
      });
    }
  };

  const handleToggleTask = async (taskId: string, date: string, completed: boolean, habitName?: string, subject?: string) => {
    if (taskId === "create_new" && habitName && subject && userId) {
      // Create new task
      await addTask({
        task_name: habitName,
        subject: subject,
        task_type: "habit",
        due_date: date,
        status: completed ? "completed" : "pending"
      });
    } else {
      // Toggle existing task
      if (completed) {
        await completeTask(taskId);
      } else {
        // Uncomplete task
        await supabase
          .from("planner_tasks")
          .update({ status: "pending", completed_at: null })
          .eq("id", taskId);
      }
    }
  };

  const handleDeleteHabit = async (habitName: string) => {
    // Delete all tasks with this habit name
    const habitTasks = tasks.filter(t => t.task_name === habitName);
    for (const task of habitTasks) {
      await deleteTask(task.id);
    }
  };

  const handleRenameHabit = async (oldName: string, newName: string) => {
    if (!userId) return;
    
    // Update all tasks with this habit name
    const { error } = await supabase
      .from("planner_tasks")
      .update({ task_name: newName })
      .eq("user_id", userId)
      .eq("task_name", oldName);
    
    if (!error) {
      await refetch();
    }
  };

  const handleMonthChange = (newMonth: Date) => {
    setSelectedMonth(newMonth);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        setUser(null);
        setUserId(null);
        setLoading(false);
        return;
      }

      setUser(currentUser);
      setUserId(currentUser.id);

      // Check subscription status
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", currentUser.id)
        .gte("valid_until", new Date().toISOString())
        .maybeSingle();

      setHasSubscription(!!subscription);
    } catch (error) {
      console.error("Error checking access:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddHabitClick = async (habitName: string, subject: string, goalCount: number) => {
    // Check if user is logged in
    if (!user) {
      toast.info("Please login to add habits");
      navigate("/auth", { state: { returnTo: "/buildlife" } });
      return;
    }

    // Check if user has subscription
    if (!hasSubscription) {
      toast.info("Subscription required to add habits", {
        description: "Get lifetime access for just ₹99",
        action: {
          label: "Subscribe",
          onClick: () => navigate("/buildlife-subscription", { state: { returnTo: "/buildlife" } })
        }
      });
      return;
    }

    // User has access, proceed to add habit
    try {
      await handleAddHabit(habitName, subject, goalCount);
      toast.success("Habit added successfully!");
      refetch();
    } catch (error) {
      console.error("Error adding habit:", error);
      toast.error("Failed to add habit");
    }
  };

  const handleTaskToggle = async (taskId: string, date: string, completed: boolean, habitName?: string, subject?: string) => {
    if (!user) {
      toast.info("Please login to track habits");
      navigate("/auth", { state: { returnTo: "/buildlife" } });
      return;
    }

    await handleToggleTask(taskId, date, completed, habitName, subject);
    refetch();
  };

  // Calculate today's stats in IST
  const todayIST = getISTDate().toISOString().split("T")[0];
  
  const todaysTasks = useMemo(() => {
    return tasks.filter((t) => t.due_date === todayIST);
  }, [tasks, todayIST]);

  const todaysCompleted = useMemo(() => {
    return todaysTasks.filter((t) => t.status === "completed").length;
  }, [todaysTasks]);

  const currentHabitCount = habits.length;

  // Calculate monthly completion percentage
  const monthlyCompletion = useMemo(() => {
    if (!dailyAggregates || dailyAggregates.length === 0) return 0;
    const completed = dailyAggregates.reduce((acc, d) => acc + (d.completed || 0), 0);
    const total = dailyAggregates.reduce((acc, d) => acc + (d.total || 0), 0);
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }, [dailyAggregates]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#E50914] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-white text-lg">Loading BuildLife...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000000] pb-20">
      {/* Premium Header */}
      <div className="sticky top-0 z-20 bg-[#000000]/98 backdrop-blur-xl border-b border-white/10">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#E50914] to-red-600 flex items-center justify-center shadow-lg shadow-[#E50914]/20">
                <Target className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight">
                  BuildLife Planner
                </h1>
                <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">
                  Transform your future, one habit at a time
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate("/goal-selection")}
              variant="outline"
              size="sm"
              className="border-white/20 text-white hover:bg-white/10 text-xs h-8"
            >
              <Settings className="w-3 h-3 mr-1" />
              Goal
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Premium Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-[#1a1a1a] to-[#111111] rounded-xl p-3 sm:p-4 border border-white/10 shadow-xl"
          >
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-[#E50914]" />
              <div className="text-[10px] sm:text-xs text-gray-400 font-medium">Active Habits</div>
            </div>
            <div className="text-2xl sm:text-4xl font-black text-white">{currentHabitCount}</div>
            <div className="text-[10px] sm:text-xs text-gray-500 mt-1">of {MAX_HABITS} max</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-[#1a1a1a] to-[#111111] rounded-xl p-3 sm:p-4 border border-white/10 shadow-xl"
          >
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-[#E50914]" />
              <div className="text-[10px] sm:text-xs text-gray-400 font-medium">Today</div>
            </div>
            <div className="text-2xl sm:text-4xl font-black text-white">
              {todaysCompleted}
              <span className="text-lg sm:text-2xl text-gray-500">/{todaysTasks.length}</span>
            </div>
            <div className="text-[10px] sm:text-xs text-gray-500 mt-1">completed</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-[#1a1a1a] to-[#111111] rounded-xl p-3 sm:p-4 border border-white/10 shadow-xl"
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-[#E50914]" />
              <div className="text-[10px] sm:text-xs text-gray-400 font-medium">This Month</div>
            </div>
            <div className="text-2xl sm:text-4xl font-black text-white">
              {monthlyCompletion}
              <span className="text-lg sm:text-2xl text-gray-500">%</span>
            </div>
            <div className="text-[10px] sm:text-xs text-gray-500 mt-1">completion</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-[#E50914]/20 to-[#E50914]/10 rounded-xl p-3 sm:p-4 border border-[#E50914]/30 shadow-xl shadow-[#E50914]/10"
          >
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-[#E50914]" />
              <div className="text-[10px] sm:text-xs text-gray-300 font-medium">Streak</div>
            </div>
            <div className="text-2xl sm:text-4xl font-black text-[#E50914]">
              {Math.floor(Math.random() * 15)}
              <span className="text-lg sm:text-2xl text-gray-400">d</span>
            </div>
            <div className="text-[10px] sm:text-xs text-gray-400 mt-1">Keep it up!</div>
          </motion.div>
        </div>

        {/* Month Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <MonthSelector
            selectedMonth={selectedMonth}
            onMonthChange={(newMonth) => {
              setSelectedMonth(newMonth);
              handleMonthChange(newMonth);
            }}
          />
        </motion.div>

        {/* Consistency Heatmap */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <ConsistencyHeatmap tasks={tasks} />
        </motion.div>

        {/* Habit Matrix */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-br from-[#1a1a1a] to-[#111111] rounded-xl p-3 sm:p-6 border border-white/10 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#E50914]" />
              Habit Tracker
            </h2>
            {!hasSubscription && user && (
              <Button
                onClick={() => navigate("/buildlife-subscription")}
                size="sm"
                className="bg-[#E50914] hover:bg-[#E50914]/90 text-white text-xs h-7"
              >
                Unlock Pro
              </Button>
            )}
          </div>
          <HabitMatrix
            tasks={tasks}
            dailyAggregates={dailyAggregates}
            selectedMonth={selectedMonth}
            onToggleTask={handleTaskToggle}
            onAddHabit={handleAddHabitClick}
            onDeleteHabit={handleDeleteHabit}
            onRenameHabit={handleRenameHabit}
            maxHabits={MAX_HABITS}
            currentHabitCount={currentHabitCount}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default BuildLifePlanner;
