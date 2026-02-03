import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Plus, Trash2, BookOpen, FileQuestion, Video, ClipboardList, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlannerTask } from "@/hooks/usePlanner";
import confetti from "canvas-confetti";

interface DailyFocusProps {
  tasks: PlannerTask[];
  onAddTask: (task: { subject: string; task_name: string; task_type: string; due_date: string; status: string }) => void;
  onCompleteTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

const taskTypeIcons: Record<string, React.ReactNode> = {
  custom: <ClipboardList className="h-4 w-4" />,
  pyq: <FileQuestion className="h-4 w-4" />,
  revision: <RotateCcw className="h-4 w-4" />,
  video: <Video className="h-4 w-4" />,
  test: <BookOpen className="h-4 w-4" />,
};

const subjectColors: Record<string, string> = {
  Physics: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Chemistry: "bg-green-500/20 text-green-400 border-green-500/30",
  Mathematics: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

export const DailyFocus = ({ tasks, onAddTask, onCompleteTask, onDeleteTask }: DailyFocusProps) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTask, setNewTask] = useState({ subject: "Physics", task_name: "", task_type: "custom" });

  const today = new Date().toISOString().split("T")[0];
  const todayTasks = tasks.filter((t) => t.due_date === today);
  const backlogTasks = tasks.filter((t) => t.is_backlog && t.status !== "completed");
  const completedCount = todayTasks.filter((t) => t.status === "completed").length;
  const completionPercent = todayTasks.length > 0 ? (completedCount / todayTasks.length) * 100 : 0;

  const handleAddTask = () => {
    if (!newTask.task_name.trim()) return;
    onAddTask({
      ...newTask,
      due_date: today,
      status: "pending",
    });
    setNewTask({ subject: "Physics", task_name: "", task_type: "custom" });
    setShowAddForm(false);
  };

  const handleComplete = (taskId: string) => {
    // Trigger confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#ff6b35", "#f7931e", "#ffcc00"],
    });
    onCompleteTask(taskId);
  };

  const TaskCard = ({ task, isBacklog = false }: { task: PlannerTask; isBacklog?: boolean }) => (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`group relative p-4 rounded-xl border backdrop-blur-sm transition-all ${
        task.status === "completed"
          ? "bg-primary/10 border-primary/30"
          : isBacklog
          ? "bg-red-500/10 border-red-500/30"
          : "bg-card/50 border-border hover:border-primary/50"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={() => task.status !== "completed" && handleComplete(task.id)}
          className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
            task.status === "completed"
              ? "bg-primary border-primary"
              : "border-muted-foreground/50 hover:border-primary"
          }`}
        >
          <AnimatePresence>
            {task.status === "completed" && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Check className="h-4 w-4 text-primary-foreground" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 text-xs rounded-full border ${subjectColors[task.subject]}`}>
              {task.subject.charAt(0)}
            </span>
            <span className="text-muted-foreground">{taskTypeIcons[task.task_type]}</span>
            {isBacklog && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                Backlog
              </span>
            )}
          </div>
          <p className={`font-medium ${task.status === "completed" ? "line-through text-muted-foreground" : "text-foreground"}`}>
            {task.task_name}
          </p>
        </div>

        {/* Delete Button */}
        <button
          onClick={() => onDeleteTask(task.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/20 rounded"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Daily Readiness Meter */}
      <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Daily Readiness</h3>
          <span className="text-2xl font-bold text-primary">{Math.round(completionPercent)}%</span>
        </div>
        
        {/* Radial Progress */}
        <div className="relative w-32 h-32 mx-auto mb-4">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-muted/30"
            />
            <motion.circle
              cx="64"
              cy="64"
              r="56"
              stroke="url(#progressGradient)"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              initial={{ strokeDasharray: "0 352" }}
              animate={{ strokeDasharray: `${(completionPercent / 100) * 352} 352` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold">{completedCount}</span>
            <span className="text-xs text-muted-foreground">of {todayTasks.length}</span>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          {completionPercent === 100
            ? "🎉 All tasks completed!"
            : completionPercent >= 50
            ? "Keep going! You're doing great!"
            : "Let's get started on your goals!"}
        </p>
      </div>

      {/* Backlog Section */}
      {backlogTasks.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-red-400 flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Catch-up Tasks ({backlogTasks.length})
          </h3>
          <AnimatePresence>
            {backlogTasks.map((task) => (
              <TaskCard key={task.id} task={task} isBacklog />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Today's Tasks */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Today's Focus</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAddForm(!showAddForm)}
            className="border-primary/50 hover:bg-primary/20"
          >
            <Plus className="h-4 w-4 mr-1" />
            Quick Add
          </Button>
        </div>

        {/* Add Task Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-primary/30 space-y-3"
            >
              <Input
                placeholder="What do you need to do?"
                value={newTask.task_name}
                onChange={(e) => setNewTask({ ...newTask, task_name: e.target.value })}
                className="bg-background/50"
                onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
              />
              <div className="flex gap-2">
                <Select value={newTask.subject} onValueChange={(v) => setNewTask({ ...newTask, subject: v })}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Physics">Physics</SelectItem>
                    <SelectItem value="Chemistry">Chemistry</SelectItem>
                    <SelectItem value="Mathematics">Mathematics</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={newTask.task_type} onValueChange={(v) => setNewTask({ ...newTask, task_type: v })}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Custom</SelectItem>
                    <SelectItem value="pyq">Solve PYQs</SelectItem>
                    <SelectItem value="revision">Revision</SelectItem>
                    <SelectItem value="video">Watch Video</SelectItem>
                    <SelectItem value="test">Practice Test</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleAddTask} className="flex-1">
                  Add Task
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Task List */}
        <AnimatePresence>
          {todayTasks.length > 0 ? (
            todayTasks.map((task) => <TaskCard key={task.id} task={task} />)
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 text-muted-foreground"
            >
              <ClipboardList className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No tasks for today. Add some to get started!</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
