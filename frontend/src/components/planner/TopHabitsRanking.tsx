import { motion } from "framer-motion";
import { Trophy, Medal, Award, Star, TrendingUp } from "lucide-react";

interface HabitRank {
  name: string;
  subject: string;
  progress: number;
}

interface TopHabitsRankingProps {
  habits: HabitRank[];
}

const SUBJECT_EMOJIS: Record<string, string> = {
  Physics: "⚛️",
  Chemistry: "🧪",
  Mathematics: "📐",
  Study: "📚",
  Coding: "💻",
  Language: "🗣️",
  Gym: "💪",
  Meditation: "🧘",
  Sleep: "😴",
  Diet: "🥗",
  Reading: "📖",
  Writing: "✍️",
  Music: "🎵",
  Art: "🎨",
  Work: "💼",
  Finance: "💰",
  Hobby: "🎯",
  Other: "✨",
};

const getRankIcon = (index: number) => {
  if (index === 0) return { icon: Trophy, color: "text-yellow-400", bg: "bg-yellow-500/20" };
  if (index === 1) return { icon: Medal, color: "text-gray-300", bg: "bg-gray-500/20" };
  if (index === 2) return { icon: Award, color: "text-amber-600", bg: "bg-amber-600/20" };
  return { icon: Star, color: "text-primary/60", bg: "bg-primary/10" };
};

const getProgressColor = (progress: number) => {
  if (progress >= 80) return "from-emerald-500 to-green-400";
  if (progress >= 60) return "from-blue-500 to-cyan-400";
  if (progress >= 40) return "from-yellow-500 to-amber-400";
  return "from-red-500 to-orange-400";
};

export const TopHabitsRanking = ({ habits }: TopHabitsRankingProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm rounded-2xl p-6 border border-border shadow-lg h-full"
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold text-foreground">Habit Ranking</h3>
        <TrendingUp className="h-5 w-5 text-primary" />
      </div>
      
      <div className="space-y-3">
        {habits.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/30 flex items-center justify-center">
              <Trophy className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground text-sm">No habits tracked yet</p>
            <p className="text-muted-foreground/60 text-xs mt-1">Add your first habit to start!</p>
          </motion.div>
        ) : (
          habits.map((habit, index) => {
            const rankStyle = getRankIcon(index);
            const RankIcon = rankStyle.icon;
            const progressGradient = getProgressColor(habit.progress);
            
            return (
              <motion.div
                key={habit.name}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02, x: 4 }}
                className="group flex items-center gap-3 p-3 rounded-xl bg-muted/20 hover:bg-muted/40 transition-all border border-transparent hover:border-primary/20"
              >
                {/* Rank Badge */}
                <div className={`w-8 h-8 rounded-lg ${rankStyle.bg} flex items-center justify-center shrink-0`}>
                  {index < 3 ? (
                    <RankIcon className={`w-4 h-4 ${rankStyle.color}`} />
                  ) : (
                    <span className="text-sm font-bold text-muted-foreground">{index + 1}</span>
                  )}
                </div>
                
                {/* Emoji */}
                <span className="text-xl shrink-0">{SUBJECT_EMOJIS[habit.subject] || "✨"}</span>
                
                {/* Habit Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-foreground group-hover:text-primary transition-colors">
                    {habit.name}
                  </p>
                  {/* Progress Bar */}
                  <div className="mt-1.5 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${habit.progress}%` }}
                      transition={{ delay: index * 0.1, duration: 0.6 }}
                      className={`h-full bg-gradient-to-r ${progressGradient} rounded-full`}
                    />
                  </div>
                </div>
                
                {/* Progress Percentage */}
                <span className={`text-sm font-bold shrink-0 ${
                  habit.progress >= 70 ? "text-emerald-400" :
                  habit.progress >= 40 ? "text-yellow-400" :
                  "text-red-400"
                }`}>
                  {habit.progress.toFixed(0)}%
                </span>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Quick Stats */}
      {habits.length > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-5 pt-4 border-t border-border/50"
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Average Completion</span>
            <span className="font-bold text-primary">
              {(habits.reduce((acc, h) => acc + h.progress, 0) / habits.length).toFixed(0)}%
            </span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
