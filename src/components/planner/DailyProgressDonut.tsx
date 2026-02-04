import { useMemo } from "react";
import { motion } from "framer-motion";

interface DailyProgressDonutProps {
  completed: number;
  total: number;
}

export const DailyProgressDonut = ({ completed, total }: DailyProgressDonutProps) => {
  const percentage = useMemo(() => {
    return total > 0 ? (completed / total) * 100 : 0;
  }, [completed, total]);

  const left = total - completed;
  const leftPercentage = 100 - percentage;

  // SVG circle properties
  const size = 160;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const completedOffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border">
      <h3 className="text-lg font-semibold mb-4 text-center">OVERVIEW DAILY PROGRESS</h3>
      
      <div className="flex flex-col items-center">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth={strokeWidth}
              opacity={0.3}
            />
            
            {/* Progress circle */}
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: completedOffset }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </svg>
          
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[10px] text-muted-foreground uppercase">COMPLETED</span>
            <span className="text-2xl font-bold text-primary">{percentage.toFixed(1)}%</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-8 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-sm text-muted-foreground">
              Completed ({percentage.toFixed(1)}%)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-muted" />
            <span className="text-sm text-muted-foreground">
              Left ({leftPercentage.toFixed(1)}%)
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mt-4 w-full">
          <div className="text-center p-3 bg-primary/10 rounded-lg">
            <p className="text-2xl font-bold text-primary">{completed}</p>
            <p className="text-xs text-muted-foreground">Tasks Done</p>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <p className="text-2xl font-bold text-muted-foreground">{left}</p>
            <p className="text-xs text-muted-foreground">Tasks Left</p>
          </div>
        </div>
      </div>
    </div>
  );
};
