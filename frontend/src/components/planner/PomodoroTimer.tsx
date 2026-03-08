import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Coffee, Brain, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PomodoroTimerProps {
  onSessionComplete: (subject: string, minutes: number) => void;
}

export const PomodoroTimer = ({ onSessionComplete }: PomodoroTimerProps) => {
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [subject, setSubject] = useState("Physics");
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const FOCUS_TIME = 25 * 60;
  const BREAK_TIME = 5 * 60;

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Timer completed
      if (mode === "focus") {
        onSessionComplete(subject, 25);
        setSessionsCompleted((prev) => prev + 1);
        // Play notification sound
        try {
          audioRef.current = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleB0RI3aZ1Ot+Qws8gbbf1H4vKlWO0eWISTxMsOXWdD9vr93Rb0NZWK/f0nJEbXay4MxpSmN7vuLGZFJne8PgwmJabYLI38FgXHOIzNu+Y19/jc3YvGZhgJDN1bppaIWUzc+1bW2JnM3GsXJyjaLNv61+fo6mzbapgYWYq8ymi4ydrMiiio+gscidjJilssWWjJqptsSPlJuouMGLlZ6rt76Gl5+tub2DmaKvurg/naSxt7k7oKW0t7Y5o6e2trI5paizua8xqKu3uqYxq667uKAwra+9tp4vsrXAtZQutrjDsI0uvL7EqoUuw8PIoHwtz8jMlXMu2dLRin8t4NvWf4kt6OLcfZcs7+njaJ0q9O7qa5wp+fLwbJkp/vX0bZco/vf2bpMo/vf3bY0p/fj1bIcp/Pf0bIMo+/bybXwo+vXxbXYn+PPvcXEn9+/ub24n9evra28n8ufpa24l7eLsaW4l6N7sZnIl5NnqZHQl4NXnY3Ym3NDkYngm1szjYHol0MfhXn0lzMHeXYElx7zbXYMlwbXbW4YluK/ZV4glsKrXU4okq6XVTowkpaDUSpAlnp3SRZMll5nRQJglkZXQO5wljpPQNaAlipDPMLQliI/QLMIlhI7QKNIkhIzRI+Ujg4zRH/MjgozSG/8jf4vSFv8jfIrTEv8iewvTDf8keArTCf8kd4rTBv8ld4nUBP8nd4jVA/8pd4jWAv8reIfXAf8teIbYAP8weITaAP4yeYLbAP06fYDeAP5GhXzhAP9XjoXlAP9mkI3oAP9wk5TsAP95lprxAP+BmqP0AP+JnKz3AP+Qnrb7AP+WoL7+AP+ZocH/AP+cocP/AP+co8X/AP+bpcX/AP+Yp8b/AP+UqMf/AP+Pqcf/AP+KqMf/AP+Fp8j/AP+ApsX/AP9+pMH/AP9/ob7/AP+Bnrj/AP+Im7P/AP+Sl6z/AP+flKf/AP+ukZ7/AP+8j5b/AP/IjI3/AP/Uiob/AP/fhn7/AP/ngXj/AP/vcXD/AP/yY2n/AP/wWGP/");
          audioRef.current.play();
        } catch (e) {
          console.log("Audio not supported");
        }
        setMode("break");
        setTimeLeft(BREAK_TIME);
      } else {
        setMode("focus");
        setTimeLeft(FOCUS_TIME);
      }
      setIsRunning(false);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode, subject, onSessionComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = mode === "focus" ? ((FOCUS_TIME - timeLeft) / FOCUS_TIME) * 100 : ((BREAK_TIME - timeLeft) / BREAK_TIME) * 100;

  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(mode === "focus" ? FOCUS_TIME : BREAK_TIME);
  };

  return (
    <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          {mode === "focus" ? <Brain className="h-5 w-5 text-primary" /> : <Coffee className="h-5 w-5 text-green-400" />}
          {mode === "focus" ? "Focus Mode" : "Break Time"}
        </h3>
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-yellow-400" />
          <span className="text-sm font-semibold">{sessionsCompleted * 5} pts</span>
        </div>
      </div>

      {/* Timer Circle */}
      <div className="flex flex-col items-center">
        <div className="relative w-48 h-48 mb-4">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="96" cy="96" r="90" stroke="currentColor" strokeWidth="8" fill="none" className="text-muted/30" />
            <motion.circle
              cx="96"
              cy="96"
              r="90"
              stroke={mode === "focus" ? "hsl(var(--primary))" : "#22c55e"}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.5 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold font-mono">{formatTime(timeLeft)}</span>
            <span className="text-sm text-muted-foreground">{mode === "focus" ? "Stay focused!" : "Take a break"}</span>
          </div>
        </div>

        {/* Subject Selector */}
        {mode === "focus" && !isRunning && (
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger className="w-[180px] mb-4">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Physics">Physics</SelectItem>
              <SelectItem value="Chemistry">Chemistry</SelectItem>
              <SelectItem value="Mathematics">Mathematics</SelectItem>
            </SelectContent>
          </Select>
        )}

        {/* Controls */}
        <div className="flex gap-3">
          <Button
            size="lg"
            onClick={() => setIsRunning(!isRunning)}
            className={`w-14 h-14 rounded-full ${mode === "focus" ? "bg-primary hover:bg-primary/90" : "bg-green-500 hover:bg-green-600"}`}
          >
            <AnimatePresence mode="wait">
              {isRunning ? (
                <motion.div key="pause" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <Pause className="h-6 w-6" />
                </motion.div>
              ) : (
                <motion.div key="play" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <Play className="h-6 w-6 ml-1" />
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
          <Button size="lg" variant="outline" onClick={handleReset} className="w-14 h-14 rounded-full">
            <RotateCcw className="h-5 w-5" />
          </Button>
        </div>

        {/* Sessions Counter */}
        <div className="mt-4 flex items-center gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <motion.div
              key={i}
              className={`w-3 h-3 rounded-full ${i < sessionsCompleted % 4 ? "bg-primary" : "bg-muted/50"}`}
              animate={i < sessionsCompleted % 4 ? { scale: [1, 1.2, 1] } : {}}
            />
          ))}
          <span className="text-xs text-muted-foreground ml-2">{sessionsCompleted} sessions today</span>
        </div>
      </div>
    </div>
  );
};
