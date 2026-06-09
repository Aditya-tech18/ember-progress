import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Target, BarChart3, Sparkles, Play, Zap, X, Flame, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActivityHeatmap } from "./ActivityHeatmap";

// JEE Mains 2026 Session 2 - April 2, 2026 at 9:00 AM IST
const JEE_DATE = new Date("2026-04-02T09:00:00+05:30");

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const HeroSection = () => {
  const navigate = useNavigate();
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = JEE_DATE.getTime() - now.getTime();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, []);

  const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <motion.div
        key={value}
        initial={{ scale: 1.05, opacity: 0.8 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gradient-to-br from-primary/20 to-crimson/10 backdrop-blur-sm border border-primary/30 rounded-lg px-2 py-1 sm:px-3 sm:py-1.5 min-w-[40px] sm:min-w-[56px]"
      >
        <span className="text-lg sm:text-2xl font-bold text-primary font-mono">
          {value.toString().padStart(2, "0")}
        </span>
      </motion.div>
      <span className="text-[8px] sm:text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">{label}</span>
    </div>
  );

  return (
    <section className="relative flex items-center justify-center overflow-hidden pt-2 pb-4 sm:pb-6">
      {/* Minimal Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-crimson/8 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
      </div>

      <div className="container mx-auto px-3 sm:px-4 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto text-center w-full">
          {/* Compact Title */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-2xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-2 sm:mb-3 leading-tight"
          >
            Discipline Today, <span className="gradient-text">Rank Tomorrow</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-5 max-w-lg mx-auto"
          >
            Master JEE with gamified learning. Track, compete & rise.
          </motion.p>

          {/* Compact CTA Row */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-4"
          >
            <Button
              onClick={() => navigate("/planner")}
              className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold text-sm border border-blue-500/30"
              style={{ boxShadow: "0 0 20px rgba(59,130,246,0.25)" }}
            >
              <Flame className="h-4 w-4 mr-1.5" />
              Success Planner
            </Button>
            <Button
              onClick={() => navigate("/chapters/Physics")}
              className="bg-gradient-to-r from-primary to-crimson text-primary-foreground px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold text-sm"
            >
              <Play className="w-4 h-4 mr-1.5" />
              Practice PYQs
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowHeatmap(true)}
              className="border-border/50 px-4 py-2.5 sm:py-3 rounded-xl text-sm"
            >
              <BarChart3 className="w-4 h-4 mr-1.5" />
              Progress
            </Button>
          </motion.div>

          {/* Compact Stats Row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-6 sm:gap-10"
          >
            {[
              { value: "50K+", label: "Questions" },
              { value: "12", label: "Ranks" },
              { value: "10K+", label: "Students" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-lg sm:text-xl font-bold text-foreground">{stat.value}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Heatmap Modal */}
      <AnimatePresence>
        {showHeatmap && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowHeatmap(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-4xl w-full max-h-[80vh] overflow-auto"
            >
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowHeatmap(false)}
                  className="absolute top-2 right-2 z-10 rounded-full bg-background/80 hover:bg-background"
                >
                  <X className="w-5 h-5" />
                </Button>
                <ActivityHeatmap />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
