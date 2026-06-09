import { useMemo } from "react";
import { motion } from "framer-motion";
import { DailyAggregate } from "@/hooks/usePlanner";

interface GrowthHeatmapProps {
  dailyAggregates: DailyAggregate[];
}

export const GrowthHeatmap = ({ dailyAggregates }: GrowthHeatmapProps) => {
  const heatmapData = useMemo(() => {
    const today = new Date();
    const data: { date: string; score: number; tasks: number; focus: number }[] = [];

    // Generate last 12 weeks (84 days)
    for (let i = 83; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const aggregate = dailyAggregates.find((a) => a.date === dateStr);

      data.push({
        date: dateStr,
        score: aggregate?.completion_score || 0,
        tasks: aggregate?.tasks_completed || 0,
        focus: aggregate?.focus_minutes || 0,
      });
    }

    return data;
  }, [dailyAggregates]);

  const getColor = (score: number) => {
    if (score === 0) return "bg-muted/30";
    if (score < 25) return "bg-primary/20";
    if (score < 50) return "bg-primary/40";
    if (score < 75) return "bg-primary/60";
    if (score < 100) return "bg-primary/80";
    return "bg-primary";
  };

  const weeks = useMemo(() => {
    const result: typeof heatmapData[] = [];
    for (let i = 0; i < heatmapData.length; i += 7) {
      result.push(heatmapData.slice(i, i + 7));
    }
    return result;
  }, [heatmapData]);

  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Goal Completion Heatmap</h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-muted/30" />
            <div className="w-3 h-3 rounded-sm bg-primary/20" />
            <div className="w-3 h-3 rounded-sm bg-primary/40" />
            <div className="w-3 h-3 rounded-sm bg-primary/60" />
            <div className="w-3 h-3 rounded-sm bg-primary" />
          </div>
          <span>More</span>
        </div>
      </div>

      <div className="flex gap-1">
        {/* Day Labels */}
        <div className="flex flex-col gap-1 pr-2">
          {dayLabels.map((day, i) => (
            <div key={i} className="h-4 w-4 flex items-center justify-center text-[10px] text-muted-foreground">
              {i % 2 === 0 ? day : ""}
            </div>
          ))}
        </div>

        {/* Heatmap Grid */}
        <div className="flex gap-1 overflow-x-auto pb-2">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day, dayIndex) => (
                <motion.div
                  key={day.date}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: (weekIndex * 7 + dayIndex) * 0.005 }}
                  className={`w-4 h-4 rounded-sm ${getColor(day.score)} cursor-pointer transition-all hover:ring-2 hover:ring-primary/50`}
                  title={`${day.date}\nCompletion: ${Math.round(day.score)}%\nTasks: ${day.tasks}\nFocus: ${day.focus} min`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">
            {dailyAggregates.filter((a) => a.completion_score >= 100).length}
          </p>
          <p className="text-xs text-muted-foreground">Perfect Days</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">
            {dailyAggregates.reduce((acc, a) => acc + a.tasks_completed, 0)}
          </p>
          <p className="text-xs text-muted-foreground">Tasks Done</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">
            {Math.round(dailyAggregates.reduce((acc, a) => acc + a.focus_minutes, 0) / 60)}h
          </p>
          <p className="text-xs text-muted-foreground">Focus Time</p>
        </div>
      </div>
    </div>
  );
};
