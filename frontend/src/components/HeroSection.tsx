import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Target, BarChart3, Sparkles, Play, Zap, X, Flame, Calendar, Trophy, Clock } from "lucide-react";
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

  // Hours studied today tracker — counts while app is visible, pauses when minimized
  const [studiedSeconds, setStudiedSeconds] = useState(0);
  const studyTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startStudyTimer = () => {
    if (studyTimerRef.current) return;
    studyTimerRef.current = setInterval(() => {
      setStudiedSeconds(prev => {
        const next = prev + 1;
        // Persist to sessionStorage so it survives page navigation within session
        sessionStorage.setItem("studiedSeconds", String(next));
        return next;
      });
    }, 1000);
  };

  const stopStudyTimer = () => {
    if (studyTimerRef.current) {
      clearInterval(studyTimerRef.current);
      studyTimerRef.current = null;
    }
  };

  useEffect(() => {
    // Restore today's studied time from sessionStorage
    const saved = parseInt(sessionStorage.getItem("studiedSeconds") || "0", 10);
    setStudiedSeconds(saved);

    // Start timer immediately if page is visible
    if (!document.hidden) startStudyTimer();

    const handleVisibility = () => {
      if (document.hidden) {
        stopStudyTimer();
      } else {
        startStudyTimer();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      stopStudyTimer();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const formatStudyTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

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
              onClick={() => navigate("/leaderboard")}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold px-4 py-2.5 sm:py-3 rounded-xl text-sm shadow-lg shadow-yellow-500/25 border-0"
            >
              <Trophy className="w-4 h-4 mr-1.5" />
              Leaderboard
            </Button>
          </motion.div>

          {/* Hours Studied Today */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center"
          >
            <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#E50914] to-orange-500 flex items-center justify-center shrink-0">
                <Clock className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider leading-none mb-0.5">
                  Today's Study Time
                </div>
                <div className="text-base font-black text-foreground font-mono leading-none">
                  {formatStudyTime(studiedSeconds)}
                </div>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse ml-1" />
            </div>
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
