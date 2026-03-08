import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Award, Flame, BookOpen, Atom, Calculator, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

interface UserProfileModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface UserProfile {
  id: string;
  combat_name: string | null;
  avatar_url: string | null;
  created_at: string | null;
}

interface SubjectStats {
  physics: number;
  chemistry: number;
  mathematics: number;
  total: number;
}

interface HeatmapData {
  [date: string]: number;
}

export const UserProfileModal = ({ userId, isOpen, onClose }: UserProfileModalProps) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<SubjectStats | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [currentStreak, setCurrentStreak] = useState(0);

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserData();
    }
  }, [isOpen, userId]);

  const fetchUserData = async () => {
    setIsLoading(true);
    try {
      // Fetch user profile
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, combat_name, avatar_url, created_at")
        .eq("id", userId)
        .single();

      if (userError) throw userError;
      setProfile(userData);

      // Fetch submission stats
      const { data: submissions } = await supabase
        .from("submissions")
        .select("question_id, submitted_at")
        .eq("user_id", userId);

      if (submissions) {
        // Get question subjects
        const questionIds = submissions.map((s) => s.question_id).filter(Boolean);
        const { data: questions } = await supabase
          .from("questions")
          .select("id, subject")
          .in("id", questionIds);

        const subjectMap: { [key: number]: string } = {};
        questions?.forEach((q) => {
          subjectMap[q.id] = q.subject || "";
        });

        // Calculate stats
        const statsCalc: SubjectStats = {
          physics: 0,
          chemistry: 0,
          mathematics: 0,
          total: submissions.length,
        };

        submissions.forEach((s) => {
          const subject = subjectMap[s.question_id || 0]?.toLowerCase();
          if (subject === "physics") statsCalc.physics++;
          else if (subject === "chemistry") statsCalc.chemistry++;
          else if (subject === "mathematics" || subject === "maths") statsCalc.mathematics++;
        });

        setStats(statsCalc);

        // Build heatmap data
        const heatmap: HeatmapData = {};
        submissions.forEach((s) => {
          const date = new Date(s.submitted_at).toISOString().split("T")[0];
          heatmap[date] = (heatmap[date] || 0) + 1;
        });
        setHeatmapData(heatmap);

        // Calculate streak
        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < 365; i++) {
          const checkDate = new Date(today);
          checkDate.setDate(checkDate.getDate() - i);
          const dateStr = checkDate.toISOString().split("T")[0];
          
          if (heatmap[dateStr]) {
            streak++;
          } else if (i > 0) {
            break;
          }
        }
        setCurrentStreak(streak);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMonthlyHeatmapGrid = () => {
    const months = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Generate last 6 months
    for (let m = 5; m >= 0; m--) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - m, 1);
      const monthName = monthDate.toLocaleString('default', { month: 'short' });
      const year = monthDate.getFullYear();
      const daysInMonth = new Date(year, monthDate.getMonth() + 1, 0).getDate();
      
      const days = [];
      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, monthDate.getMonth(), d);
        if (date > today) continue; // Skip future dates
        
        const dateStr = date.toISOString().split("T")[0];
        const count = heatmapData[dateStr] || 0;
        
        let intensity = 0;
        if (count >= 10) intensity = 4;
        else if (count >= 6) intensity = 3;
        else if (count >= 3) intensity = 2;
        else if (count >= 1) intensity = 1;
        
        days.push({ date: dateStr, count, intensity, day: d });
      }
      
      months.push({ name: monthName, year, days });
    }
    
    return months;
  };

  const generateHeatmapGrid = () => {
    const weeks = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let week = 11; week >= 0; week--) {
      const days = [];
      for (let day = 6; day >= 0; day--) {
        const date = new Date(today);
        date.setDate(date.getDate() - (week * 7 + day));
        const dateStr = date.toISOString().split("T")[0];
        const count = heatmapData[dateStr] || 0;
        
        let intensity = 0;
        if (count >= 10) intensity = 4;
        else if (count >= 6) intensity = 3;
        else if (count >= 3) intensity = 2;
        else if (count >= 1) intensity = 1;

        days.push({ date: dateStr, count, intensity });
      }
      weeks.push(days);
    }
    return weeks;
  };

  const getIntensityColor = (intensity: number) => {
    switch (intensity) {
      case 0: return "bg-muted/30";
      case 1: return "bg-orange-900/50";
      case 2: return "bg-orange-700/60";
      case 3: return "bg-orange-500/70";
      case 4: return "bg-orange-400";
      default: return "bg-muted/30";
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-card border border-border/50 rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="relative bg-gradient-to-br from-primary/20 to-crimson/20 p-6">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="absolute top-3 right-3 rounded-full bg-background/50"
                >
                  <X className="w-5 h-5" />
                </Button>

                <div className="flex flex-col items-center">
                  <Avatar className="w-24 h-24 border-4 border-primary/30 mb-4">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-crimson text-primary-foreground text-3xl font-bold">
                      {profile?.combat_name?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-2xl font-bold text-foreground">
                    {profile?.combat_name || "Anonymous"}
                  </h2>
                  <div className="flex items-center gap-2 mt-2">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span className="text-sm text-muted-foreground">
                      {currentStreak} day streak
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="p-6 space-y-6">
                {/* Subject Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/30 rounded-xl p-4 text-center">
                    <Target className="w-6 h-6 mx-auto text-primary mb-2" />
                    <p className="text-2xl font-bold text-foreground">{stats?.total || 0}</p>
                    <p className="text-sm text-muted-foreground">Total Solved</p>
                  </div>
                  <div className="bg-muted/30 rounded-xl p-4 text-center">
                    <Award className="w-6 h-6 mx-auto text-gold mb-2" />
                    <p className="text-2xl font-bold text-foreground">{currentStreak}</p>
                    <p className="text-sm text-muted-foreground">Day Streak</p>
                  </div>
                </div>

                {/* Subject-wise breakdown */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Subject Breakdown
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-5 h-5 text-blue-400" />
                        <span className="font-medium">Physics</span>
                      </div>
                      <span className="font-bold text-primary">{stats?.physics || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Atom className="w-5 h-5 text-green-400" />
                        <span className="font-medium">Chemistry</span>
                      </div>
                      <span className="font-bold text-primary">{stats?.chemistry || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calculator className="w-5 h-5 text-red-400" />
                        <span className="font-medium">Mathematics</span>
                      </div>
                      <span className="font-bold text-primary">{stats?.mathematics || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Monthly Heatmap */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Consistency Tracker (Month-wise)
                  </h3>
                  <div className="bg-muted/20 rounded-xl p-4 space-y-4">
                    {generateMonthlyHeatmapGrid().map((month, monthIndex) => (
                      <div key={monthIndex} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">
                            {month.name} {month.year}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {month.days.reduce((sum, d) => sum + d.count, 0)} solved
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {month.days.map((day, dayIndex) => (
                            <div
                              key={dayIndex}
                              className={`w-3 h-3 rounded-sm ${getIntensityColor(day.intensity)}`}
                              title={`${day.date}: ${day.count} questions`}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center justify-end gap-2 mt-3 text-xs text-muted-foreground">
                      <span>Less</span>
                      <div className="flex gap-1">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <div key={i} className={`w-3 h-3 rounded-sm ${getIntensityColor(i)}`} />
                        ))}
                      </div>
                      <span>More</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
