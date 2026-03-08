import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Target, Flame, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

const JEE_DATE = new Date("2026-04-02T09:00:00+05:30");

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const JeeCountdown = () => {
  const navigate = useNavigate();
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
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gradient-to-br from-primary/30 to-primary/10 backdrop-blur-sm border border-primary/30 rounded-lg px-3 py-2 min-w-[50px] sm:min-w-[60px]"
      >
        <span className="text-xl sm:text-2xl font-bold text-primary font-mono">
          {value.toString().padStart(2, "0")}
        </span>
      </motion.div>
      <span className="text-[10px] sm:text-xs text-muted-foreground mt-1 uppercase tracking-wider">{label}</span>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-background via-primary/5 to-background border-b border-primary/20 py-3 px-4"
    >
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left: Countdown Label */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Target className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute inset-0 bg-primary/30 rounded-full blur-md -z-10"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xs sm:text-sm font-semibold text-foreground">JEE Mains 2026</span>
            <span className="text-[10px] text-muted-foreground">Session 1 • April 2, 2026</span>
          </div>
        </div>

        {/* Center: Countdown Timer */}
        <div className="flex items-center gap-2">
          <TimeBlock value={timeLeft.days} label="Days" />
          <span className="text-primary text-xl font-bold">:</span>
          <TimeBlock value={timeLeft.hours} label="Hours" />
          <span className="text-primary text-xl font-bold">:</span>
          <TimeBlock value={timeLeft.minutes} label="Mins" />
          <span className="text-primary text-xl font-bold hidden sm:block">:</span>
          <div className="hidden sm:block">
            <TimeBlock value={timeLeft.seconds} label="Secs" />
          </div>
        </div>

        {/* Right: Planner CTA */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/planner")}
          className="flex items-center gap-2 bg-gradient-to-r from-primary to-orange-500 text-primary-foreground px-4 py-2 rounded-full font-semibold text-sm shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all"
        >
          <Flame className="h-4 w-4" />
          <span>Open Planner</span>
          <Calendar className="h-4 w-4" />
        </motion.button>
      </div>
    </motion.div>
  );
};
