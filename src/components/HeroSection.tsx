import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Target, BarChart3, Sparkles, BookOpen, Atom, Calculator, Play, Zap, X, PenSquare, Flame, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActivityHeatmap } from "./ActivityHeatmap";
import { CreatePostModal } from "./social/CreatePostModal";

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
  const [showCreatePost, setShowCreatePost] = useState(false);
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

  const handleStartPracticing = () => {
    navigate("/chapters/Physics");
  };

  const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <motion.div
        key={value}
        initial={{ scale: 1.05, opacity: 0.8 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gradient-to-br from-primary/20 to-crimson/10 backdrop-blur-sm border border-primary/30 rounded-xl px-4 py-2 min-w-[60px] sm:min-w-[70px]"
      >
        <span className="text-2xl sm:text-3xl font-bold text-primary font-mono">
          {value.toString().padStart(2, "0")}
        </span>
      </motion.div>
      <span className="text-[10px] sm:text-xs text-muted-foreground mt-1 uppercase tracking-wider">{label}</span>
    </div>
  );

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-crimson/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-gold/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        
        {/* Netflix-style gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
      </div>

      {/* Floating Icons */}
      <motion.div
        animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-32 left-[15%] hidden lg:block"
      >
        <div className="w-16 h-16 glass-card flex items-center justify-center rounded-2xl glow-primary">
          <BookOpen className="w-8 h-8 text-primary" />
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, 15, 0], rotate: [0, -5, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-48 right-[10%] hidden lg:block"
      >
        <div className="w-20 h-20 glass-card flex items-center justify-center rounded-2xl">
          <Atom className="w-10 h-10 text-electric-blue" />
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, -10, 0], rotate: [0, 3, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-32 left-[10%] hidden lg:block"
      >
        <div className="w-14 h-14 glass-card flex items-center justify-center rounded-2xl glow-gold">
          <Calculator className="w-7 h-7 text-gold" />
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* JEE Countdown Timer */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <div className="inline-flex flex-col items-center gap-3 px-6 py-4 rounded-2xl glass-card border border-primary/20">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <span className="text-sm font-semibold text-foreground">JEE Mains 2026 Session 2 Countdown</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <TimeBlock value={timeLeft.days} label="Days" />
                <span className="text-primary text-2xl font-bold mt-[-20px]">:</span>
                <TimeBlock value={timeLeft.hours} label="Hours" />
                <span className="text-primary text-2xl font-bold mt-[-20px]">:</span>
                <TimeBlock value={timeLeft.minutes} label="Mins" />
                <span className="text-primary text-2xl font-bold mt-[-20px] hidden sm:block">:</span>
                <div className="hidden sm:block">
                  <TimeBlock value={timeLeft.seconds} label="Secs" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Open Planner Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/planner")}
              className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white px-8 py-4 rounded-full font-bold text-lg shadow-2xl shadow-emerald-500/40 hover:shadow-emerald-500/60 transition-all animate-glow-pulse"
            >
              <Flame className="h-6 w-6" />
              <span>Open Success Planner</span>
              <Calendar className="h-6 w-6" />
            </motion.button>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl sm:text-5xl lg:text-7xl font-bold text-foreground mb-6 leading-tight"
          >
            Discipline Today,
            <br />
            <span className="gradient-text">Rank Tomorrow</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
          >
            Track your progress, test your skills, and rise through ranks.
            Master Physics, Chemistry, and Mathematics with our gamified learning platform.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              size="lg"
              onClick={handleStartPracticing}
              className="w-full sm:w-auto bg-gradient-to-r from-primary to-crimson hover:opacity-90 text-primary-foreground font-semibold px-8 py-6 text-lg rounded-xl animate-glow-pulse group"
            >
              <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
              Start Practicing
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setShowHeatmap(true)}
              className="w-full sm:w-auto border-border/50 hover:bg-muted/50 text-foreground font-semibold px-8 py-6 text-lg rounded-xl hover:border-primary/50 transition-colors"
            >
              <BarChart3 className="w-5 h-5 mr-2" />
              View Progress
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setShowCreatePost(true)}
              className="w-full sm:w-auto border-primary/50 bg-primary/10 hover:bg-primary/20 text-foreground font-semibold px-8 py-6 text-lg rounded-xl hover:border-primary transition-colors"
            >
              <PenSquare className="w-5 h-5 mr-2" />
              Share Achievement
            </Button>
          </motion.div>

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

          {/* Create Post Modal */}
          <CreatePostModal
            isOpen={showCreatePost}
            onClose={() => setShowCreatePost(false)}
            onPostCreated={() => {}}
          />

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="grid grid-cols-3 gap-4 sm:gap-8 mt-16 max-w-2xl mx-auto"
          >
            {[
              { value: "50K+", label: "Questions", icon: Zap },
              { value: "12", label: "Ranks", icon: Target },
              { value: "10K+", label: "Students", icon: Sparkles },
            ].map((stat, index) => (
              <motion.div 
                key={index} 
                className="text-center glass-card p-4 rounded-xl"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="text-2xl sm:text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};