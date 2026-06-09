import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Edit2, Check, X, ListTodo, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface TodoTask {
  id: string;
  task_name: string;
  status: string;
  due_date: string;
}

interface DailyTodoListProps {
  userId: string | null;
  todayIST: string;
  onRefetch: () => void;
  tasks: TodoTask[];
}

export const DailyTodoList = ({ userId, todayIST, onRefetch, tasks }: DailyTodoListProps) => {
  const [newTask, setNewTask] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const todoTasks = useMemo(() => {
    return tasks.filter(t => t.due_date === todayIST && t.task_name.startsWith("[TODO]"));
  }, [tasks, todayIST]);

  const completed = todoTasks.filter(t => t.status === "completed").length;
  const total = todoTasks.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  const addTask = async () => {
    if (!newTask.trim() || !userId) return;
    const { error } = await supabase.from("planner_tasks").insert({
      user_id: userId,
      task_name: `[TODO] ${newTask.trim()}`,
      subject: "Other",
      due_date: todayIST,
      status: "pending",
      task_type: "todo",
    });
    if (error) toast.error("Failed to add task");
    else { setNewTask(""); onRefetch(); }
  };

  const toggleTask = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    const { error } = await supabase.from("planner_tasks").update({
      status: newStatus,
      completed_at: newStatus === "completed" ? new Date().toISOString() : null,
    }).eq("id", id);
    if (error) toast.error("Failed");
    else onRefetch();
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from("planner_tasks").delete().eq("id", id);
    if (error) toast.error("Failed");
    else onRefetch();
  };

  const saveEdit = async (id: string) => {
    if (!editText.trim()) return;
    const { error } = await supabase.from("planner_tasks").update({
      task_name: `[TODO] ${editText.trim()}`,
    }).eq("id", id);
    if (error) toast.error("Failed");
    else { setEditingId(null); onRefetch(); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm rounded-2xl p-5 border border-border shadow-lg h-full"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <ListTodo className="h-5 w-5 text-primary" />
          Today's To-Do
        </h3>
        <span className="text-xs font-mono bg-primary/20 text-primary px-2 py-1 rounded-full">
          {completed}/{total}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-gradient-to-r from-primary via-emerald-500 to-teal-500"
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-muted-foreground">
          <span>{percentage}% done</span>
          <span>{total - completed} remaining</span>
        </div>
      </div>

      {/* Add task input */}
      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Add a task..."
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          className="bg-background/80 h-9 text-sm"
        />
        <Button size="sm" onClick={addTask} className="h-9 px-3 bg-primary">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Task list */}
      <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
        <AnimatePresence>
          {todoTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No tasks yet. Add your first task above!
            </p>
          ) : (
            todoTasks.map((task) => {
              const displayName = task.task_name.replace("[TODO] ", "");
              const isDone = task.status === "completed";

              return (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
                    isDone
                      ? "bg-emerald-500/10 border-emerald-500/20"
                      : "bg-muted/20 border-border/50 hover:border-primary/30"
                  }`}
                >
                  <button onClick={() => toggleTask(task.id, task.status)}>
                    <CheckCircle2 className={`h-5 w-5 transition-colors ${
                      isDone ? "text-emerald-400 fill-emerald-400/20" : "text-muted-foreground"
                    }`} />
                  </button>

                  {editingId === task.id ? (
                    <div className="flex-1 flex gap-1">
                      <Input
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && saveEdit(task.id)}
                        className="h-7 text-sm bg-background"
                        autoFocus
                      />
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => saveEdit(task.id)}>
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className={`flex-1 text-sm ${isDone ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {displayName}
                      </span>
                      <button
                        onClick={() => { setEditingId(task.id); setEditText(displayName); }}
                        className="opacity-0 group-hover:opacity-100 hover:opacity-100 p-1"
                      >
                        <Edit2 className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                      </button>
                      <button onClick={() => deleteTask(task.id)} className="p-1">
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                      </button>
                    </>
                  )}
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
