import { useState } from "react";
import { motion } from "framer-motion";
import { Target, Calendar, Trophy, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { UserGoal } from "@/hooks/usePlanner";

interface GoalSetupProps {
  userGoal: UserGoal | null;
  onSaveGoal: (goal: Omit<UserGoal, "id" | "user_id">) => void;
}

export const GoalSetup = ({ userGoal, onSaveGoal }: GoalSetupProps) => {
  const [session, setSession] = useState(userGoal?.target_session || "Session 1");
  const [percentile, setPercentile] = useState(userGoal?.target_percentile || 95);
  const [showSetup, setShowSetup] = useState(!userGoal);

  const handleSave = () => {
    onSaveGoal({
      target_exam: "JEE Mains 2026",
      target_session: session,
      target_percentile: percentile,
      exam_date: session === "Session 1" ? "2026-04-02" : "2026-04-10",
    });
    setShowSetup(false);
  };

  if (!showSetup && userGoal) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent rounded-2xl p-6 border border-primary/30"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/20 rounded-xl">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Your Target</h3>
              <p className="text-sm text-muted-foreground">
                JEE Mains 2026 • {userGoal.target_session} • {userGoal.target_percentile} Percentile
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowSetup(true)}>
            Edit
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card/50 backdrop-blur-sm rounded-2xl p-8 border border-primary/30"
    >
      <div className="text-center mb-8">
        <div className="inline-flex p-4 bg-primary/20 rounded-full mb-4">
          <Trophy className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Set Your North Star</h2>
        <p className="text-muted-foreground">Define your JEE target to get a personalized plan</p>
      </div>

      <div className="space-y-6 max-w-md mx-auto">
        {/* Session Selection */}
        <div>
          <label className="text-sm font-medium mb-2 block">Target Session</label>
          <Select value={session} onValueChange={setSession}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Session 1">Session 1 (April 2, 2026)</SelectItem>
              <SelectItem value="Session 2">Session 2 (April 10, 2026)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Percentile Target */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Target Percentile</label>
            <span className="text-2xl font-bold text-primary">{percentile}</span>
          </div>
          <Slider
            value={[percentile]}
            onValueChange={([v]) => setPercentile(v)}
            min={50}
            max={100}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>50</span>
            <span>75</span>
            <span>90</span>
            <span>99</span>
            <span>100</span>
          </div>
        </div>

        {/* Percentile Meaning */}
        <div className="p-4 bg-muted/30 rounded-lg">
          <p className="text-sm">
            {percentile >= 99 ? (
              <span>🎯 Top 1% - IIT/NIT Tier 1 (10,000+ Rank)</span>
            ) : percentile >= 95 ? (
              <span>🎯 Top 5% - NIT/IIIT (50,000+ Rank)</span>
            ) : percentile >= 90 ? (
              <span>🎯 Top 10% - Good Government Colleges</span>
            ) : (
              <span>🎯 Keep pushing for higher targets!</span>
            )}
          </p>
        </div>

        <Button onClick={handleSave} className="w-full" size="lg">
          Set My Target
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  );
};
