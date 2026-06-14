import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Zap, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Trophy, Users, Clock, ChevronRight, 
  Flame, Star, Target 
} from "lucide-react";
import { differenceInSeconds, isBefore, isAfter } from "date-fns";

interface Contest {
  contest_id: string;
  title: string;
  start_time: string;
  end_time: string;
  result_time: string;
}

// Reusable subscribe popup inline
const PaywallPopup = ({ open, onClose, title, description, emoji = "🚀" }: {
  open: boolean; onClose: () => void; title: string; description: string; emoji?: string;
}) => {
  const navigate = useNavigate();
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.85, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.85, y: 30, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            onClick={e => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
            style={{ background: "linear-gradient(135deg, #0d0d0d 0%, #1a0a0a 100%)", border: "1px solid rgba(229,9,20,0.35)" }}
          >
            <div className="h-1 w-full bg-gradient-to-r from-[#E50914] via-orange-400 to-[#E50914]" />
            <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">
              <X className="w-4 h-4 text-white" />
            </button>
            <div className="p-6 pt-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#E50914] to-orange-500 flex items-center justify-center mb-4 shadow-lg shadow-[#E50914]/30">
                <span className="text-3xl">{emoji}</span>
              </div>
              <h2 className="text-xl font-black text-white mb-2 leading-tight">{title}</h2>
              <p className="text-sm text-gray-400 mb-5 leading-relaxed">{description}</p>
              <div className="space-y-2 mb-5">
                {[
                  { icon: "🏆", text: "Weekly Test Series — crack JEE with All India Rank" },
                  { icon: "⚔️", text: "Friendly Battles — beat your friends, beat the exam" },
                  { icon: "🧠", text: "AI Doubt Solver + Unlimited Mock Tests" },
                ].map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                    <span>{p.icon}</span><span>{p.text}</span>
                  </div>
                ))}
              </div>
              <Button
                onClick={() => { onClose(); navigate("/subscription"); }}
                className="w-full h-12 text-base font-black rounded-xl bg-gradient-to-r from-[#E50914] to-orange-500 hover:from-[#c4000f] hover:to-orange-600 text-white shadow-lg shadow-[#E50914]/30 border-0"
              >
                <Zap className="w-5 h-5 mr-2" />
                Subscribe Now — at just ₹29/month
              </Button>
              <p className="text-xs text-gray-500 text-center mt-3">Cancel anytime • Instant activation</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const GameCards = () => {
  const navigate = useNavigate();
  const [contest, setContest] = useState<Contest | null>(null);
  const [countdown, setCountdown] = useState("");
  const [contestStatus, setContestStatus] = useState<"upcoming" | "live" | "ended">("upcoming");
  const [teamMemberCount, setTeamMemberCount] = useState(0);
  const [teamName, setTeamName] = useState<string | null>(null);
  const [showContestPopup, setShowContestPopup] = useState(false);
  const [showTeamPopup, setShowTeamPopup] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    fetchContestData();
    fetchTeamData();
    checkAccess();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [contest]);

  const checkAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("valid_until")
      .eq("user_id", user.id)
      .maybeSingle();
    if (sub && new Date(sub.valid_until) > new Date()) setHasAccess(true);
  };

  const fetchContestData = async () => {
    const now = new Date().toISOString();
    const { data } = await supabase
      .from("contests")
      .select("*")
      .gte("result_time", now)
      .order("start_time", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (data) setContest(data);
  };

  const fetchTeamData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: membership } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (membership) {
      const { data: team } = await supabase.from("teams").select("team_name").eq("team_id", membership.team_id).single();
      const { data: members } = await supabase.from("team_members").select("id").eq("team_id", membership.team_id);
      if (team) setTeamName(team.team_name);
      if (members) setTeamMemberCount(members.length);
    }
  };

  const updateCountdown = () => {
    if (!contest) return;
    const now = new Date();
    const start = new Date(contest.start_time);
    const end = new Date(contest.end_time);
    if (isBefore(now, start)) {
      setContestStatus("upcoming");
      const secsLeft = differenceInSeconds(start, now);
      const days = Math.floor(secsLeft / 86400);
      const hrs = Math.floor((secsLeft % 86400) / 3600);
      const mins = Math.floor((secsLeft % 3600) / 60);
      if (days > 0) setCountdown(`${days}d ${hrs}h ${mins}m`);
      else if (hrs > 0) setCountdown(`${hrs}h ${mins}m`);
      else setCountdown(`${mins}m`);
    } else if (isAfter(now, start) && isBefore(now, end)) {
      setContestStatus("live");
      const secsLeft = differenceInSeconds(end, now);
      const hrs = Math.floor(secsLeft / 3600);
      const mins = Math.floor((secsLeft % 3600) / 60);
      setCountdown(`${hrs}h ${mins}m left`);
    } else {
      setContestStatus("ended");
      setCountdown("Ended");
    }
  };

  const handleContestClick = () => {
    if (hasAccess) navigate("/weekly-contest");
    else setShowContestPopup(true);
  };

  const handleTeamClick = () => {
    if (hasAccess) navigate("/team");
    else setShowTeamPopup(true);
  };

  return (
    <section className="px-3 sm:px-4 py-6 sm:py-8">
      <PaywallPopup
        open={showContestPopup}
        onClose={() => setShowContestPopup(false)}
        emoji="🏆"
        title="Weekly Test Series — Your Path to AIR 1"
        description="Top JEE/NEET rankers practice 4+ tests weekly. Join 50,000+ aspirants competing every Sunday. At just ₹29/month — less than a samosa a day."
      />
      <PaywallPopup
        open={showTeamPopup}
        onClose={() => setShowTeamPopup(false)}
        emoji="⚔️"
        title="Friendly Battles — Beat Friends, Beat JEE"
        description="Students who compete with peers score 23% higher. Challenge your study group, climb team leaderboards. At just ₹29/month — your biggest edge."
      />

      <div className="container mx-auto">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2">
          <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
          Compete & Prepare
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {/* Weekly Test Series Card */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleContestClick} className="cursor-pointer">
            <Card className="p-4 sm:p-6 bg-gradient-to-br from-orange-500/20 via-red-500/10 to-red-500/20 border-orange-500/30 hover:border-orange-500/50 transition-all overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-red-500/20 to-transparent rounded-full translate-y-1/2 -translate-x-1/2" />
              {!hasAccess && (
                <div className="absolute top-3 left-3 bg-[#E50914] text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Crown className="w-3 h-3" /> Premium
                </div>
              )}
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Weekly Test Series</h3>
                      <p className="text-sm text-muted-foreground">JEE Main 2025</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex items-center gap-4">
                  {contestStatus === "live" ? (
                    <Badge className="bg-green-500 text-white animate-pulse">
                      <span className="relative flex h-2 w-2 mr-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                      </span>
                      LIVE NOW
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-orange-500/50">
                      <Clock className="w-3 h-3 mr-1" />
                      {countdown || "Loading..."}
                    </Badge>
                  )}
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span>300 marks</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  Every Sunday 2 PM - 5 PM • All India Rank
                </p>
              </div>
            </Card>
          </motion.div>

          {/* Friendly Battles Card */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleTeamClick} className="cursor-pointer">
            <Card className="p-4 sm:p-6 bg-gradient-to-br from-blue-500/20 via-red-500/10 to-indigo-500/20 border-blue-500/30 hover:border-blue-500/50 transition-all overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-red-500/20 to-transparent rounded-full translate-y-1/2 -translate-x-1/2" />
              {!hasAccess && (
                <div className="absolute top-3 left-3 bg-[#E50914] text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Crown className="w-3 h-3" /> Premium
                </div>
              )}
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-red-500 flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Friendly Battles</h3>
                      <p className="text-sm text-muted-foreground">{teamName || "Create or join a team"}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex items-center gap-4">
                  {teamName ? (
                    <Badge variant="outline" className="border-blue-500/50">
                      <Users className="w-3 h-3 mr-1" />
                      {teamMemberCount}/4 members
                    </Badge>
                  ) : (
                    <Badge className="bg-blue-500 text-white">
                      <Target className="w-3 h-3 mr-1" />
                      Get Started
                    </Badge>
                  )}
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span>Challenges</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  Prepare with friends • Team leaderboards
                </p>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
