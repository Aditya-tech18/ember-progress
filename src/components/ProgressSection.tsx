import { motion } from "framer-motion";
import { Trophy, TrendingUp, Target, Loader2 } from "lucide-react";
import { useUserProgress } from "@/hooks/useUserProgress";

interface ProgressRingProps {
  progress: number;
  color: string;
  label: string;
  solved: number;
  total: number;
}

const ProgressRing = ({ progress, color, label, solved, total }: ProgressRingProps) => {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center"
    >
      <div className="relative w-28 h-28 sm:w-32 sm:h-32">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background Circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="8"
          />
          {/* Progress Circle */}
          <motion.circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            whileInView={{ strokeDashoffset }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{
              strokeDasharray: circumference,
              filter: `drop-shadow(0 0 8px ${color})`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground">{progress}%</span>
        </div>
      </div>
      <span className="mt-3 font-semibold text-foreground">{label}</span>
      <span className="text-sm text-muted-foreground">{solved}/{total} solved</span>
    </motion.div>
  );
};

export const ProgressSection = () => {
  const { 
    progress,
    loading,
    currentRank,
    nextRank,
    questionsToNextRank,
  } = useUserProgress();

  const subjects = [
    { 
      label: "Physics", 
      progress: progress.physics.total > 0 ? Math.round((progress.physics.solved / progress.physics.total) * 100) : 0,
      solved: progress.physics.solved, 
      total: progress.physics.total, 
      color: "hsl(187, 85%, 53%)" 
    },
    { 
      label: "Chemistry", 
      progress: progress.chemistry.total > 0 ? Math.round((progress.chemistry.solved / progress.chemistry.total) * 100) : 0,
      solved: progress.chemistry.solved, 
      total: progress.chemistry.total, 
      color: "hsl(27, 80%, 52%)" 
    },
    { 
      label: "Mathematics", 
      progress: progress.mathematics.total > 0 ? Math.round((progress.mathematics.solved / progress.mathematics.total) * 100) : 0,
      solved: progress.mathematics.solved, 
      total: progress.mathematics.total, 
      color: "hsl(90, 73%, 55%)" 
    },
  ];

  if (loading) {
    return (
      <section className="py-20 relative">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="glass-card p-6 sm:p-10 rounded-2xl flex items-center justify-center min-h-[300px]">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-muted-foreground">Loading your progress...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 relative">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Your Progress Overview
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Track your journey across all subjects and climb the ranks
          </p>
        </motion.div>

        <div className="glass-card p-6 sm:p-10 rounded-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Progress Rings */}
            <div className="flex justify-center gap-6 sm:gap-10 flex-wrap">
              {subjects.map((subject, index) => (
                <ProgressRing key={index} {...subject} />
              ))}
            </div>

            {/* Stats & Rank */}
            <div className="space-y-6">
              {/* Total Questions */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex items-center gap-4 p-4 rounded-xl bg-muted/30"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-crimson flex items-center justify-center">
                  <Target className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{progress.totalSolved}</div>
                  <div className="text-sm text-muted-foreground">Total Questions Solved</div>
                </div>
              </motion.div>

              {/* Current Rank */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-4 p-4 rounded-xl bg-muted/30"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-purple-600 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-secondary-foreground" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {currentRank.icon} {currentRank.name}
                  </div>
                  <div className="text-sm text-muted-foreground">Current Rank</div>
                </div>
              </motion.div>

              {/* Next Milestone */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-4 p-4 rounded-xl bg-muted/30"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-amber-400 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-accent-foreground" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {questionsToNextRank > 0 ? `${questionsToNextRank} more` : "Max Rank!"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {nextRank ? `Questions to become ${nextRank.name}!` : "You've reached the top!"}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
