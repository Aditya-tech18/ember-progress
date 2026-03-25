import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Rocket, Heart, Shield, GraduationCap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const goals = [
  { id: "JEE", label: "JEE", icon: Rocket, color: "from-[#E50914] to-red-600", description: "Joint Entrance Examination" },
  { id: "NEET", label: "NEET", icon: Heart, color: "from-[#E50914] to-pink-600", description: "Medical Entrance" },
  { id: "NDA", label: "NDA", icon: Shield, color: "from-[#E50914] to-orange-600", description: "National Defence Academy" },
  { id: "COLLEGE", label: "COLLEGE", icon: GraduationCap, color: "from-[#E50914] to-purple-600", description: "College Studies" },
  { id: "LIFE", label: "LIFE", icon: Sparkles, color: "from-[#E50914] to-yellow-600", description: "Personal Growth" },
];

export const GoalSelection = () => {
  const navigate = useNavigate();
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoalSelect = async () => {
    if (!selectedGoal) {
      toast.error("Please select a goal");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Not logged in - store goal and go to auth
        localStorage.setItem("pendingGoal", selectedGoal);
        toast.info("Please login to continue");
        
        // After auth, should come back and complete goal selection
        navigate("/auth", { state: { fromGoalSelection: true, selectedGoal } });
        return;
      }

      // User is logged in - save goal to database
      const { error } = await supabase
        .from("users")
        .update({ 
          goal: selectedGoal,
          goal_selected_at: new Date().toISOString()
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success(`Goal set to ${selectedGoal}!`);
      
      // Navigate based on goal
      if (selectedGoal === "JEE") {
        // JEE users go to home
        navigate("/");
      } else {
        // Non-JEE users go to BuildLife (will trigger subscription check there)
        navigate("/buildlife");
      }
    } catch (error: any) {
      console.error("Error setting goal:", error);
      toast.error("Failed to set goal. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-4xl"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="text-5xl md:text-6xl font-black text-white mb-4"
          >
            Select Your Goal
          </motion.h1>
          <motion.p
            initial={{ y: -10 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-400"
          >
            Choose what you're preparing for
          </motion.p>
        </div>

        {/* Goal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {goals.map((goal, index) => {
            const Icon = goal.icon;
            const isSelected = selectedGoal === goal.id;
            
            return (
              <motion.button
                key={goal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedGoal(goal.id)}
                className={`relative p-8 rounded-2xl border-2 transition-all ${
                  isSelected
                    ? "border-[#E50914] bg-[#E50914]/10 scale-105"
                    : "border-white/20 bg-[#111111] hover:border-white/40 hover:scale-102"
                }`}
              >
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${goal.color} flex items-center justify-center mb-4 mx-auto`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{goal.label}</h3>
                <p className="text-sm text-gray-400">{goal.description}</p>
                
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-4 right-4 w-6 h-6 bg-[#E50914] rounded-full flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Continue Button */}
        <div className="text-center">
          <Button
            onClick={handleGoalSelect}
            disabled={!selectedGoal || loading}
            className="bg-[#E50914] hover:bg-[#E50914]/90 text-white font-bold text-lg px-12 py-6 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Setting up..." : "Continue"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default GoalSelection;