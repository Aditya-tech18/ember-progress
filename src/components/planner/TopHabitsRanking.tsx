import { motion } from "framer-motion";

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
  Gym: "💪",
  Reading: "📖",
  Other: "✨",
};

const RANK_COLORS = [
  "text-yellow-400",
  "text-gray-300",
  "text-orange-400",
  "text-primary",
  "text-primary",
  "text-primary",
  "text-primary",
  "text-primary",
  "text-primary",
  "text-primary",
];

export const TopHabitsRanking = ({ habits }: TopHabitsRankingProps) => {
  return (
    <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border">
      <h3 className="text-lg font-semibold mb-4 text-center">TOP 10 DAILY HABIT</h3>
      
      <div className="space-y-2">
        {habits.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-4">
            No habits tracked yet
          </p>
        ) : (
          habits.map((habit, index) => (
            <motion.div
              key={habit.name}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors"
            >
              <span className={`text-lg font-bold w-6 ${RANK_COLORS[index] || "text-muted-foreground"}`}>
                {index + 1}
              </span>
              
              <span className="text-lg">{SUBJECT_EMOJIS[habit.subject] || "✨"}</span>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{habit.name}</p>
              </div>
              
              <span className={`text-sm font-bold ${
                habit.progress >= 70 ? "text-green-400" :
                habit.progress >= 40 ? "text-yellow-400" :
                "text-destructive"
              }`}>
                {habit.progress.toFixed(0)}%
              </span>
            </motion.div>
          ))
        )}
      </div>

      {/* Progress bar for each habit (compact view) */}
      {habits.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase">Progress Breakdown</h4>
          <div className="space-y-2">
            {habits.slice(0, 5).map((habit, index) => (
              <div key={habit.name} className="flex items-center gap-2">
                <span className="text-xs w-4 text-muted-foreground">{index + 1}</span>
                <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${habit.progress}%` }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className="h-full bg-gradient-to-r from-primary to-orange-500"
                  />
                </div>
                <span className="text-xs text-muted-foreground w-10 text-right">
                  {habit.progress.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
