import { useMemo } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, Trophy, Zap } from "lucide-react";

interface DailyProgressDonutProps {
  completed: number;
  total: number;
}

export const DailyProgressDonut = ({ completed, total }: DailyProgressDonutProps) => {
  const percentage = useMemo(() => {
    return total > 0 ? (completed / total) * 100 : 0;
  }, [completed, total]);

  const left = total - completed;

  // SVG circle properties
  const size = 180;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const completedOffset = circumference - (percentage / 100) * circumference;

  // Get motivational message based on progress
  const getMessage = () => {
    if (percentage === 100) return { text: "Perfect Day!", icon: Trophy, color: "text-yellow-400" };
    if (percentage >= 80) return { text: "Almost there!", icon: Zap, color: "text-emerald-400" };
    if (percentage >= 50) return { text: "Keep pushing!", icon: CheckCircle2, color: "text-blue-400" };
    return { text: "Let's go!", icon: Clock, color: "text-primary" };
  };

  const message = getMessage();
  const MessageIcon = message.icon;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm rounded-2xl p-6 border border-border shadow-lg h-full"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-foreground">Today's Progress</h3>
        <motion.div 
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}
        >
          <MessageIcon className={`h-5 w-5 ${message.color}`} />
        </motion.div>
      </div>
      
      <div className="flex flex-col items-center">
        {/* Donut Chart */}
        <div className="relative" style={{ width: size, height: size }}>
          {/* Glow Effect */}
          {percentage > 0 && (
            <motion.div
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute inset-0 rounded-full"
              style={{
                background: `radial-gradient(circle, hsl(var(--primary) / 0.3) 0%, transparent 70%)`,
              }}
            />
          )}
          
          <svg width={size} height={size} className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth={strokeWidth}
              opacity={0.2}
            />
            
            {/* Progress circle */}
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="url(#progressGradient)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: completedOffset }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
            
            {/* Gradient Definition */}
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="50%" stopColor="hsl(340, 82%, 52%)" />
                <stop offset="100%" stopColor="hsl(30, 90%, 55%)" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span 
              key={percentage}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-4xl font-bold text-foreground"
            >
              {Math.round(percentage)}%
            </motion.span>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">{message.text}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mt-6 w-full">
          <motion.div 
            whileHover={{ scale: 1.03 }}
            className="text-center p-4 bg-gradient-to-br from-emerald-500/20 to-green-500/10 rounded-xl border border-emerald-500/20"
          >
            <p className="text-3xl font-bold text-emerald-400">{completed}</p>
            <p className="text-xs text-muted-foreground mt-1">Completed</p>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.03 }}
            className="text-center p-4 bg-gradient-to-br from-orange-500/20 to-amber-500/10 rounded-xl border border-orange-500/20"
          >
            <p className="text-3xl font-bold text-orange-400">{left}</p>
            <p className="text-xs text-muted-foreground mt-1">Remaining</p>
          </motion.div>
        </div>

        {/* Progress Bar Alternative View */}
        <div className="w-full mt-4">
          <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className="h-full bg-gradient-to-r from-primary via-crimson to-orange-500"
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
