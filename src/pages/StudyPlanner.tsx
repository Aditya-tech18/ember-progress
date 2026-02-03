import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { usePlanner } from "@/hooks/usePlanner";
import { DailyFocus } from "@/components/planner/DailyFocus";
import { GrowthHeatmap } from "@/components/planner/GrowthHeatmap";
import { ConsistencyGraph } from "@/components/planner/ConsistencyGraph";
import { SyllabusProgress } from "@/components/planner/SyllabusProgress";
import { PomodoroTimer } from "@/components/planner/PomodoroTimer";
import { GoalSetup } from "@/components/planner/GoalSetup";
import { JeeCountdown } from "@/components/JeeCountdown";
import { Target, Calendar, TrendingUp, BookOpen, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const StudyPlanner = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
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
  } = usePlanner();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
      } else {
        setIsAuthenticated(true);
      }
    };
    checkAuth();
  }, [navigate]);

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
      <JeeCountdown />
      <Navbar />

      <main className="pt-20 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold">Success Engine</h1>
            </div>
            <p className="text-muted-foreground">
              Your personalized JEE preparation dashboard
            </p>
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
              {/* Goal Banner */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-6"
              >
                <GoalSetup userGoal={userGoal} onSaveGoal={saveUserGoal} />
              </motion.div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { label: "Days Left", value: daysUntilJEE, icon: Calendar, color: "text-primary" },
                  { label: "Tasks Today", value: tasks.filter((t) => t.due_date === new Date().toISOString().split("T")[0]).length, icon: BookOpen, color: "text-blue-400" },
                  { label: "Streak", value: `${dailyAggregates.filter((a) => a.completion_score >= 50).length}d`, icon: TrendingUp, color: "text-green-400" },
                  { label: "Focus Pts", value: dailyAggregates.reduce((acc, a) => acc + Math.floor(a.focus_minutes / 5), 0), icon: Target, color: "text-purple-400" },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    className="bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-border"
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
              <Tabs defaultValue="daily" className="space-y-6">
                <TabsList className="bg-card/50 border border-border">
                  <TabsTrigger value="daily">Daily Focus</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger value="syllabus">Syllabus</TabsTrigger>
                  <TabsTrigger value="focus">Focus Mode</TabsTrigger>
                </TabsList>

                {/* Daily Focus Tab */}
                <TabsContent value="daily" className="space-y-6">
                  <div className="grid lg:grid-cols-2 gap-6">
                    <DailyFocus
                      tasks={tasks}
                      onAddTask={addTask}
                      onCompleteTask={completeTask}
                      onDeleteTask={deleteTask}
                    />
                    <div className="space-y-6">
                      <GrowthHeatmap dailyAggregates={dailyAggregates} />
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
