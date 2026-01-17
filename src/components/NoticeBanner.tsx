import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { X, Trophy, Calendar, Clock, ChevronRight } from "lucide-react";
import { format, differenceInSeconds, isBefore, isAfter } from "date-fns";

interface Contest {
  contest_id: string;
  title: string;
  start_time: string;
  end_time: string;
}

export const NoticeBanner = () => {
  const navigate = useNavigate();
  const [contest, setContest] = useState<Contest | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [countdown, setCountdown] = useState("");
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    fetchContest();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [contest]);

  const fetchContest = async () => {
    const now = new Date().toISOString();
    const { data } = await supabase
      .from("contests")
      .select("*")
      .gte("end_time", now)
      .order("start_time", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (data) {
      setContest(data);
    }
  };

  const updateCountdown = () => {
    if (!contest) return;

    const now = new Date();
    const start = new Date(contest.start_time);
    const end = new Date(contest.end_time);

    if (isBefore(now, start)) {
      setIsLive(false);
      const secsLeft = differenceInSeconds(start, now);
      const days = Math.floor(secsLeft / 86400);
      const hrs = Math.floor((secsLeft % 86400) / 3600);
      const mins = Math.floor((secsLeft % 3600) / 60);
      const secs = secsLeft % 60;

      if (days > 0) {
        setCountdown(`${days}d ${hrs}h ${mins}m`);
      } else {
        setCountdown(`${hrs}h ${mins}m ${secs}s`);
      }
    } else if (isAfter(now, start) && isBefore(now, end)) {
      setIsLive(true);
      const secsLeft = differenceInSeconds(end, now);
      const hrs = Math.floor(secsLeft / 3600);
      const mins = Math.floor((secsLeft % 3600) / 60);
      setCountdown(`${hrs}h ${mins}m left`);
    } else {
      setCountdown("");
    }
  };

  if (dismissed || !contest) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className={`relative overflow-hidden ${
          isLive 
            ? "bg-gradient-to-r from-green-600 via-emerald-500 to-green-600" 
            : "bg-gradient-to-r from-orange-600 via-red-500 to-orange-600"
        }`}
      >
        {/* Animated background */}
        <div className="absolute inset-0 opacity-20">
          <motion.div
            animate={{
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "linear",
            }}
            className="w-full h-full"
            style={{
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="container mx-auto px-4 py-3 relative">
          <div 
            className="flex items-center justify-center gap-4 cursor-pointer"
            onClick={() => navigate("/weekly-contest")}
          >
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-300" />
              <span className="font-bold text-white">
                {isLive ? "🔴 LIVE NOW" : "📢 NOTICE"}
              </span>
            </div>
            
            <span className="text-white/90 text-sm md:text-base">
              {contest.title} scheduled for{" "}
              <span className="font-bold">
                {format(new Date(contest.start_time), "EEEE, MMMM d 'at' h:mm a")}
              </span>
            </span>

            {countdown && (
              <span className={`font-mono font-bold px-3 py-1 rounded-full ${
                isLive ? "bg-white/20 text-white" : "bg-yellow-400 text-black"
              }`}>
                {isLive ? countdown : `Starts in ${countdown}`}
              </span>
            )}

            <ChevronRight className="w-5 h-5 text-white/70" />
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setDismissed(true);
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};