import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { format, startOfMonth, getDaysInMonth, subMonths } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Flame } from "lucide-react";

interface ActivityData {
  [date: string]: number;
}

export const ActivityHeatmap = () => {
  const [activityMap, setActivityMap] = useState<ActivityData>({});
  const [loading, setLoading] = useState(true);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  useEffect(() => {
    fetchActivityData();
  }, []);

  const fetchActivityData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: submissions, error } = await supabase
        .from("submissions")
        .select("submitted_at")
        .eq("user_id", user.id);

      if (error) throw error;

      const activityData: ActivityData = {};
      if (submissions) {
        submissions.forEach((sub) => {
          if (sub.submitted_at) {
            const date = new Date(sub.submitted_at).toISOString().split("T")[0];
            activityData[date] = (activityData[date] || 0) + 1;
          }
        });
      }

      setActivityMap(activityData);
    } catch (err) {
      console.error("Error fetching activity:", err);
    } finally {
      setLoading(false);
    }
  };

  // Netflix-inspired color scheme (deep reds to bright crimson)
  const getIntensityColor = (count: number): string => {
    if (count === 0) return "hsl(var(--muted))";
    if (count === 1) return "hsl(0, 60%, 25%)"; // Deep red
    if (count <= 3) return "hsl(0, 70%, 35%)"; // Dark crimson
    if (count <= 6) return "hsl(0, 80%, 45%)"; // Crimson
    if (count <= 10) return "hsl(10, 85%, 50%)"; // Bright red-orange
    return "hsl(20, 90%, 55%)"; // Fiery orange
  };

  const getGlowColor = (count: number): string => {
    if (count === 0) return "transparent";
    if (count <= 3) return "hsl(0, 70%, 35%, 0.5)";
    if (count <= 6) return "hsl(0, 80%, 45%, 0.6)";
    return "hsl(20, 90%, 55%, 0.7)";
  };

  // Generate last 12 months
  const months = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(now, 11 - i);
      return startOfMonth(date);
    });
  }, []);

  // Calculate total questions solved
  const totalSolved = useMemo(() => {
    return Object.values(activityMap).reduce((sum, count) => sum + count, 0);
  }, [activityMap]);

  // Calculate current streak
  const currentStreak = useMemo(() => {
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i <= 365; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      
      if (activityMap[dateStr] && activityMap[dateStr] > 0) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  }, [activityMap]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 rounded-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-crimson flex items-center justify-center">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Consistency Tracker</h3>
            <p className="text-sm text-muted-foreground">Your daily practice heatmap</p>
          </div>
        </div>
        <div className="flex gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{totalSolved}</div>
            <div className="text-xs text-muted-foreground">Total Solved</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gold">{currentStreak}</div>
            <div className="text-xs text-muted-foreground">Day Streak</div>
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-3 min-w-max">
          {months.map((monthStart) => {
            const daysInMonth = getDaysInMonth(monthStart);
            const days = Array.from({ length: daysInMonth }, (_, i) => {
              const date = new Date(monthStart);
              date.setDate(i + 1);
              return date;
            });

            return (
              <div key={monthStart.toISOString()} className="flex flex-col items-center">
                {/* Month Grid */}
                <div
                  className="grid gap-0.5"
                  style={{
                    gridTemplateColumns: "repeat(7, 1fr)",
                    gridTemplateRows: `repeat(${Math.ceil(daysInMonth / 7)}, 1fr)`,
                  }}
                >
                  {days.map((day) => {
                    const dateStr = day.toISOString().split("T")[0];
                    const count = activityMap[dateStr] || 0;
                    const isHovered = hoveredDate === dateStr;
                    const color = getIntensityColor(count);
                    const glow = getGlowColor(count);

                    return (
                      <motion.div
                        key={dateStr}
                        onMouseEnter={() => setHoveredDate(dateStr)}
                        onMouseLeave={() => setHoveredDate(null)}
                        className="relative"
                        animate={{
                          scale: isHovered ? 1.3 : 1,
                        }}
                        transition={{ duration: 0.15 }}
                      >
                        <div
                          className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm transition-all duration-200"
                          style={{
                            backgroundColor: color,
                            boxShadow: isHovered && count > 0 ? `0 0 12px ${glow}` : "none",
                            border: isHovered ? "1px solid hsl(var(--primary))" : "1px solid transparent",
                          }}
                        />

                        {/* Tooltip */}
                        {isHovered && (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none"
                          >
                            <div className="bg-card border border-border px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap text-xs">
                              <div className="font-semibold text-foreground">
                                {count > 0 ? `${count} question${count > 1 ? "s" : ""} solved` : "No activity"}
                              </div>
                              <div className="text-muted-foreground">
                                {format(day, "MMMM d, yyyy")}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                {/* Month Label */}
                <div className="mt-2 text-xs font-medium text-muted-foreground">
                  {format(monthStart, "MMM")}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="flex gap-1">
          {[0, 1, 3, 6, 10, 15].map((level) => (
            <div
              key={level}
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: getIntensityColor(level) }}
            />
          ))}
        </div>
        <span>More</span>
      </div>
    </motion.div>
  );
};
