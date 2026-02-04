import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Check, AlertCircle, Flame, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface HabitMatrixProps {
  tasks: any[];
  dailyAggregates: any[];
  selectedMonth: Date;
  onToggleTask: (taskId: string, date: string, completed: boolean) => void;
  onAddHabit: (habitName: string, subject: string, goalCount: number) => void;
  onDeleteHabit: (habitName: string) => void;
  maxHabits?: number;
  currentHabitCount?: number;
}

// IST timezone offset
const IST_OFFSET = 5.5 * 60 * 60 * 1000;

const getISTDate = () => {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + IST_OFFSET);
};

const WEEK_COLORS = [
  "from-pink-500/20 to-pink-500/10",
  "from-blue-500/20 to-blue-500/10",
  "from-yellow-500/20 to-yellow-500/10",
  "from-purple-500/20 to-purple-500/10",
  "from-green-500/20 to-green-500/10",
];

const SUBJECT_EMOJIS: Record<string, string> = {
  // Study categories
  Physics: "⚛️",
  Chemistry: "🧪",
  Mathematics: "📐",
  Study: "📚",
  Coding: "💻",
  Language: "🗣️",
  // Health & Fitness
  Gym: "💪",
  Meditation: "🧘",
  Sleep: "😴",
  Diet: "🥗",
  // Personal Development
  Reading: "📖",
  Writing: "✍️",
  Music: "🎵",
  Art: "🎨",
  // Productivity
  Work: "💼",
  Finance: "💰",
  Hobby: "🎯",
  Other: "✨",
};

export const HabitMatrix = ({
  tasks,
  dailyAggregates,
  selectedMonth,
  onToggleTask,
  onAddHabit,
  onDeleteHabit,
  maxHabits = 10,
  currentHabitCount = 0,
}: HabitMatrixProps) => {
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitSubject, setNewHabitSubject] = useState("Study");
  const [newHabitGoal, setNewHabitGoal] = useState(30);
  const [showAddHabit, setShowAddHabit] = useState(false);

  const todayIST = getISTDate().toISOString().split("T")[0];

  // Generate days of the month
  const daysInMonth = useMemo(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const numDays = new Date(year, month + 1, 0).getDate();
    
    const days: { date: string; dayOfWeek: string; dayNum: number; weekIndex: number }[] = [];
    
    for (let i = 1; i <= numDays; i++) {
      const date = new Date(year, month, i);
      const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "short" }).substring(0, 3);
      const weekIndex = Math.floor((i - 1) / 7);
      days.push({
        date: date.toISOString().split("T")[0],
        dayOfWeek,
        dayNum: i,
        weekIndex,
      });
    }
    
    return days;
  }, [selectedMonth]);

  // Group days by week
  const weeks = useMemo(() => {
    const weekGroups: typeof daysInMonth[] = [];
    for (let i = 0; i < 5; i++) {
      weekGroups.push(daysInMonth.filter((d) => d.weekIndex === i));
    }
    return weekGroups.filter((w) => w.length > 0);
  }, [daysInMonth]);

  // Extract unique habits from tasks
  const habits = useMemo(() => {
    const habitMap = new Map<string, { name: string; subject: string; goal: number }>();
    
    tasks.forEach((task) => {
      if (!habitMap.has(task.task_name)) {
        habitMap.set(task.task_name, {
          name: task.task_name,
          subject: task.subject,
          goal: 30, // Default monthly goal
        });
      }
    });
    
    return Array.from(habitMap.values());
  }, [tasks]);

  // Create completion map
  const completionMap = useMemo(() => {
    const map = new Map<string, boolean>();
    
    tasks.forEach((task) => {
      const key = `${task.task_name}_${task.due_date}`;
      map.set(key, task.status === "completed");
    });
    
    return map;
  }, [tasks]);

  // Calculate stats for each habit
  const habitStats = useMemo(() => {
    const stats = new Map<string, { completed: number; left: number; progress: number }>();
    
    habits.forEach((habit) => {
      let completed = 0;
      daysInMonth.forEach((day) => {
        const key = `${habit.name}_${day.date}`;
        if (completionMap.get(key)) completed++;
      });
      
      const left = habit.goal - completed;
      const progress = (completed / habit.goal) * 100;
      
      stats.set(habit.name, { completed, left: Math.max(0, left), progress });
    });
    
    return stats;
  }, [habits, daysInMonth, completionMap]);

  // Calculate daily stats
  const dailyStats = useMemo(() => {
    const stats = daysInMonth.map((day) => {
      let completed = 0;
      let total = habits.length;
      
      habits.forEach((habit) => {
        const key = `${habit.name}_${day.date}`;
        if (completionMap.get(key)) completed++;
      });
      
      return {
        date: day.date,
        completed,
        total,
        goal: total,
        left: total - completed,
      };
    });
    
    return stats;
  }, [daysInMonth, habits, completionMap]);

  // Calculate weekly progress
  const weeklyProgress = useMemo(() => {
    return weeks.map((week, index) => {
      let completed = 0;
      let total = 0;
      
      week.forEach((day) => {
        const stat = dailyStats.find((s) => s.date === day.date);
        if (stat) {
          completed += stat.completed;
          total += stat.goal;
        }
      });
      
      return {
        weekNum: index + 1,
        completed,
        total,
        percentage: total > 0 ? (completed / total) * 100 : 0,
      };
    });
  }, [weeks, dailyStats]);

  // Global progress
  const globalProgress = useMemo(() => {
    const totalCompleted = dailyStats.reduce((acc, d) => acc + d.completed, 0);
    const totalGoal = habits.reduce((acc, h) => acc + h.goal, 0);
    return {
      completed: totalCompleted,
      total: totalGoal,
      percentage: totalGoal > 0 ? (totalCompleted / totalGoal) * 100 : 0,
    };
  }, [dailyStats, habits]);

  // Top habits by consistency
  const topHabits = useMemo(() => {
    return habits
      .map((habit) => ({
        ...habit,
        ...habitStats.get(habit.name),
      }))
      .sort((a, b) => (b.progress || 0) - (a.progress || 0))
      .slice(0, 10);
  }, [habits, habitStats]);

  const handleToggle = useCallback((habitName: string, date: string) => {
    const key = `${habitName}_${date}`;
    const isCompleted = completionMap.get(key) || false;
    
    // Find the task for this habit and date
    const task = tasks.find((t) => t.task_name === habitName && t.due_date === date);
    
    if (task) {
      onToggleTask(task.id, date, !isCompleted);
    } else {
      // Create new task entry
      onToggleTask("new", date, true);
    }
  }, [completionMap, tasks, onToggleTask]);

  const handleAddHabit = () => {
    if (!newHabitName.trim()) {
      toast.error("Please enter a habit name");
      return;
    }
    if (currentHabitCount >= maxHabits) {
      toast.error(`Maximum ${maxHabits} habits allowed. Delete some to add new ones.`);
      return;
    }
    onAddHabit(newHabitName.trim(), newHabitSubject, newHabitGoal);
    setNewHabitName("");
    setShowAddHabit(false);
  };

  return (
    <div className="space-y-6">
      {/* Overview Section */}
      <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border overflow-hidden">
        <h3 className="text-lg font-semibold mb-4">OVERVIEW</h3>
        
        {/* Week Headers */}
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Week labels row */}
            <div className="flex mb-2">
              <div className="w-32 shrink-0" />
              {weeks.map((week, i) => (
                <div
                  key={i}
                  className={`flex-1 text-center py-2 px-1 rounded-lg bg-gradient-to-r ${WEEK_COLORS[i]} mx-0.5`}
                >
                  <span className="text-xs font-semibold">WEEK {i + 1}</span>
                </div>
              ))}
            </div>

            {/* Day headers row */}
            <div className="flex mb-1">
              <div className="w-32 shrink-0" />
              {daysInMonth.map((day, i) => (
                <div
                  key={day.date}
                  className={`flex-1 text-center text-[10px] text-muted-foreground px-0.5 ${
                    day.date === todayIST ? "bg-primary/20 rounded-t" : ""
                  }`}
                >
                  <div className="font-medium">{day.dayOfWeek}</div>
                  <div className="font-bold text-foreground">{day.dayNum}</div>
                </div>
              ))}
            </div>

            {/* Stats rows */}
            <div className="space-y-1 text-xs">
              {/* Global Progress */}
              <div className="flex items-center py-2 bg-muted/30 rounded">
                <div className="w-32 shrink-0 px-3 font-semibold">GLOBAL PROGRESS</div>
                <div className="flex-1 text-center font-bold text-primary">
                  {globalProgress.completed}/{globalProgress.total} ({globalProgress.percentage.toFixed(1)}%)
                </div>
              </div>

              {/* Completed Row */}
              <div className="flex items-center">
                <div className="w-32 shrink-0 px-3 text-muted-foreground">COMPLETED</div>
                {dailyStats.map((stat) => (
                  <div
                    key={stat.date}
                    className={`flex-1 text-center ${stat.date === todayIST ? "bg-primary/10" : ""}`}
                  >
                    {stat.completed}
                  </div>
                ))}
              </div>

              {/* Goal Row */}
              <div className="flex items-center">
                <div className="w-32 shrink-0 px-3 text-muted-foreground">GOAL</div>
                {dailyStats.map((stat) => (
                  <div
                    key={stat.date}
                    className={`flex-1 text-center ${stat.date === todayIST ? "bg-primary/10" : ""}`}
                  >
                    {stat.goal}
                  </div>
                ))}
              </div>

              {/* Left Row */}
              <div className="flex items-center">
                <div className="w-32 shrink-0 px-3 text-muted-foreground">LEFT</div>
                {dailyStats.map((stat) => (
                  <div
                    key={stat.date}
                    className={`flex-1 text-center ${stat.date === todayIST ? "bg-primary/10" : ""} ${
                      stat.left > 0 ? "text-destructive" : "text-green-400"
                    }`}
                  >
                    {stat.left}
                  </div>
                ))}
              </div>

              {/* Weekly Progress Row */}
              <div className="flex items-center py-2 bg-muted/30 rounded mt-2">
                <div className="w-32 shrink-0 px-3 font-semibold">WEEKLY PROGRESS</div>
                {weeks.map((week, i) => (
                  <div
                    key={i}
                    className={`flex-1 text-center mx-0.5 py-1 rounded bg-gradient-to-r ${WEEK_COLORS[i]}`}
                  >
                    <div className="font-bold">{weeklyProgress[i]?.completed}/{weeklyProgress[i]?.total}</div>
                    <div className="text-[10px]">{weeklyProgress[i]?.percentage.toFixed(1)}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Habit Matrix Grid */}
      <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border overflow-hidden">
        <div className="flex items-center gap-4 mb-4">
          {/* Add Habit Button - Left side, glowing and prominent */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            animate={{
              boxShadow: currentHabitCount >= maxHabits 
                ? "none" 
                : [
                    "0 0 10px hsl(var(--primary) / 0.5)",
                    "0 0 25px hsl(var(--primary) / 0.8)",
                    "0 0 10px hsl(var(--primary) / 0.5)",
                  ],
            }}
            transition={{
              boxShadow: {
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              },
            }}
            onClick={() => setShowAddHabit(!showAddHabit)}
            disabled={currentHabitCount >= maxHabits}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
              currentHabitCount >= maxHabits
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-gradient-to-r from-primary via-crimson to-primary text-primary-foreground hover:from-primary/90 hover:via-crimson/90 hover:to-primary/90"
            }`}
          >
            <Plus className="h-5 w-5" />
            Add Habit
          </motion.button>

          <h3 className="text-lg font-semibold">DAILY HABITS</h3>
          
          <span className="text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border border-border">
            {currentHabitCount}/{maxHabits} habits
          </span>
        </div>

        {/* Add Habit Form */}
        {showAddHabit && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-4 bg-muted/30 rounded-lg flex gap-3 items-end flex-wrap"
          >
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs text-muted-foreground mb-1 block">Habit Name</label>
              <Input
                placeholder="e.g., Physics PYQs"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
              />
            </div>
            <div className="w-40">
              <label className="text-xs text-muted-foreground mb-1 block">Category</label>
              <Select value={newHabitSubject} onValueChange={setNewHabitSubject}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(SUBJECT_EMOJIS).map((subj) => (
                    <SelectItem key={subj} value={subj}>
                      {SUBJECT_EMOJIS[subj]} {subj}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-24">
              <label className="text-xs text-muted-foreground mb-1 block">Monthly Goal</label>
              <Input
                type="number"
                value={newHabitGoal}
                onChange={(e) => setNewHabitGoal(parseInt(e.target.value) || 30)}
              />
            </div>
            <Button onClick={handleAddHabit} className="bg-primary">
              Add
            </Button>
          </motion.div>
        )}

        {/* Matrix Grid */}
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Header with weeks and days */}
            <div className="flex mb-2">
              <div className="w-40 shrink-0 flex">
                <div className="w-32 text-xs font-semibold text-muted-foreground px-2">HABITS</div>
                <div className="w-16 text-xs font-semibold text-muted-foreground text-center">GOALS</div>
              </div>
              {weeks.map((week, i) => (
                <div
                  key={i}
                  className={`flex-1 text-center py-1 rounded-t-lg bg-gradient-to-r ${WEEK_COLORS[i]} text-xs font-semibold`}
                >
                  WEEK {i + 1}
                </div>
              ))}
              <div className="w-32 shrink-0" />
            </div>

            {/* Day numbers row */}
            <div className="flex mb-1">
              <div className="w-40 shrink-0" />
              {daysInMonth.map((day) => (
                <div
                  key={day.date}
                  className={`w-6 text-center text-[10px] font-bold ${
                    day.date === todayIST ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {day.dayNum}
                </div>
              ))}
              <div className="w-32 shrink-0 flex text-[10px] font-semibold text-muted-foreground">
                <div className="w-12 text-center">DONE</div>
                <div className="w-10 text-center">LEFT</div>
                <div className="w-16 text-center">%</div>
              </div>
            </div>

            {/* Habit Rows */}
            {habits.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No habits yet. Add your first habit to start tracking!
              </div>
            ) : (
              habits.map((habit, habitIndex) => {
                const stats = habitStats.get(habit.name);
                const isPastDue = (date: string) => date < todayIST && !completionMap.get(`${habit.name}_${date}`);
                
                return (
                  <motion.div
                    key={habit.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: habitIndex * 0.05 }}
                    className="flex items-center group hover:bg-muted/20 rounded transition-colors"
                  >
                    {/* Habit Name */}
                    <div className="w-40 shrink-0 flex items-center py-1">
                      <div className="w-32 flex items-center gap-2 px-2">
                        <span className="text-sm">{SUBJECT_EMOJIS[habit.subject] || "✨"}</span>
                        <span className="text-sm font-medium truncate">{habit.name}</span>
                      </div>
                      <div className="w-16 text-center text-sm text-muted-foreground">{habit.goal}</div>
                    </div>

                    {/* Day cells */}
                    {daysInMonth.map((day) => {
                      const key = `${habit.name}_${day.date}`;
                      const isCompleted = completionMap.get(key);
                      const isBacklog = isPastDue(day.date);
                      const isToday = day.date === todayIST;
                      
                      return (
                        <motion.button
                          key={day.date}
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleToggle(habit.name, day.date)}
                          className={`w-6 h-6 flex items-center justify-center rounded transition-all ${
                            isCompleted
                              ? "bg-primary text-primary-foreground"
                              : isBacklog
                              ? "bg-destructive/30 border border-destructive/50"
                              : isToday
                              ? "bg-primary/20 border-2 border-primary"
                              : "bg-muted/30 border border-border hover:border-primary/50"
                          }`}
                        >
                          {isCompleted && <Check className="h-3 w-3" />}
                          {isBacklog && !isCompleted && <AlertCircle className="h-3 w-3 text-destructive" />}
                        </motion.button>
                      );
                    })}

                    {/* Stats */}
                    <div className="w-32 shrink-0 flex items-center text-sm">
                      <div className="w-12 text-center font-bold text-green-400">{stats?.completed || 0}</div>
                      <div className="w-10 text-center text-destructive">{stats?.left || 0}</div>
                      <div className="w-16 text-center">
                        <div
                          className="h-2 rounded-full bg-muted overflow-hidden"
                          style={{ width: "100%" }}
                        >
                          <div
                            className="h-full bg-gradient-to-r from-primary to-orange-500 transition-all"
                            style={{ width: `${stats?.progress || 0}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {(stats?.progress || 0).toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Delete button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 h-6 w-6 ml-1"
                      onClick={() => onDeleteHabit(habit.name)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Top 10 Habits Sidebar would go here in full layout */}
    </div>
  );
};
