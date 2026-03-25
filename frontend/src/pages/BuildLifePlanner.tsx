import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { HabitMatrix } from "@/components/planner/HabitMatrix";
import { ConsistencyHeatmap } from "@/components/ConsistencyHeatmap";
import { usePlanner } from "@/hooks/usePlanner";
import { Target, Zap, Plus, Crown } from "lucide-react";
import { toast } from "sonner";

export const BuildLifePlanner = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkingSubscription, setCheckingSubscription] = useState(false);

  const {
    tasks = [],
    dailyAggregates = [],
    selectedMonth,
    habits = [],
    handleMonthChange,
    handleToggleTask,
    handleAddHabit,
    handleDeleteHabit,
    handleRenameHabit,
  } = usePlanner();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        // Not logged in - just show planner in view mode
        setUser(null);
        setLoading(false);
        return;
      }

      setUser(currentUser);

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

  const handleAddHabitClick = () => {
    // Check if user is logged in
    if (!user) {
      toast.info("Please login to add habits");
      navigate("/auth", { state: { returnTo: "/buildlife" } });
      return;
    }

    // Check if user has subscription
    if (!hasSubscription) {
      toast.info("Subscription required to add habits");
      navigate("/buildlife-subscription", { state: { returnTo: "/buildlife" } });
      return;
    }

    // User has access, proceed to add habit
    // This will trigger the add habit modal in HabitMatrix
  };

  const currentHabitCount = habits.length;
  const maxHabits = 10;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000000] pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#000000]/95 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-2">
                <Target className="w-6 h-6 md:w-8 md:h-8 text-[#E50914]" />
                BuildLife Planner
              </h1>
              <p className="text-xs md:text-sm text-gray-400 mt-1">Build habits that transform your future</p>
            </div>
            <Button
              onClick={() => navigate("/goal-selection")}
              variant="outline"
              size="sm"
              className="border-white/20 text-white hover:bg-white/10 text-xs md:text-sm"
            >
              Change Goal
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#111111] rounded-xl md:rounded-2xl p-4 md:p-6 border border-white/10"
          >
            <div className="text-xs md:text-sm text-gray-400 mb-2">Active Habits</div>
            <div className="text-3xl md:text-4xl font-black text-[#E50914]">{currentHabitCount}/{maxHabits}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#111111] rounded-xl md:rounded-2xl p-4 md:p-6 border border-white/10"
          >
            <div className="text-xs md:text-sm text-gray-400 mb-2">Today's Progress</div>
            <div className="text-3xl md:text-4xl font-black text-white">
              {dailyAggregates?.find(d => d.date === new Date().toISOString().split('T')[0])?.completed || 0}/
              {dailyAggregates?.find(d => d.date === new Date().toISOString().split('T')[0])?.total || 0}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#111111] rounded-xl md:rounded-2xl p-4 md:p-6 border border-white/10 col-span-2"
          >
            <div className="text-xs md:text-sm text-gray-400 mb-2">Monthly Goal</div>
            <div className="text-3xl md:text-4xl font-black text-white">
              {dailyAggregates && dailyAggregates.length > 0
                ? Math.round((dailyAggregates.reduce((acc, d) => acc + (d.completed || 0), 0) / 
                   Math.max(dailyAggregates.reduce((acc, d) => acc + (d.total || 0), 0), 1)) * 100) 
                : 0}%
            </div>
          </motion.div>
        </div>

        {/* Consistency Heatmap */}
        <ConsistencyHeatmap tasks={tasks} />

        {/* Habit Matrix */}
        <div className="bg-[#111111] rounded-xl md:rounded-2xl p-4 md:p-6 border border-white/10">
          <HabitMatrix
            tasks={tasks}
            dailyAggregates={dailyAggregates}
            selectedMonth={selectedMonth}
            onToggleTask={handleToggleTask}
            onAddHabit={handleAddHabit}
            onDeleteHabit={handleDeleteHabit}
            onRenameHabit={handleRenameHabit}
            maxHabits={maxHabits}
            currentHabitCount={currentHabitCount}
            onAddHabitClick={handleAddHabitClick}
            hasSubscription={hasSubscription}
          />
        </div>
      </div>
    </div>
  );
};

export default BuildLifePlanner;