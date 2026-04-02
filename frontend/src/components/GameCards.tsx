import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, Users, Clock, ChevronRight, 
  Flame, Zap, Star, Target 
} from "lucide-react";
import { differenceInSeconds, isBefore, isAfter } from "date-fns";

interface Contest {
  contest_id: string;
  title: string;
  start_time: string;
  end_time: string;
  result_time: string;
}

export const GameCards = () => {
  const navigate = useNavigate();
  const [contest, setContest] = useState<Contest | null>(null);
  const [countdown, setCountdown] = useState("");
  const [contestStatus, setContestStatus] = useState<"upcoming" | "live" | "ended">("upcoming");
  const [teamMemberCount, setTeamMemberCount] = useState(0);
  const [teamName, setTeamName] = useState<string | null>(null);

  useEffect(() => {
    fetchContestData();
    fetchTeamData();
    
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [contest]);

  const fetchContestData = async () => {
    const now = new Date().toISOString();
    const { data } = await supabase
      .from("contests")
      .select("*")
      .gte("result_time", now)
      .order("start_time", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (data) {
      setContest(data);
    }
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
      const { data: team } = await supabase
        .from("teams")
        .select("team_name")
        .eq("team_id", membership.team_id)
        .single();
      
      const { data: members } = await supabase
        .from("team_members")
        .select("id")
        .eq("team_id", membership.team_id);

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
      
      if (days > 0) {
        setCountdown(`${days}d ${hrs}h ${mins}m`);
      } else if (hrs > 0) {
        setCountdown(`${hrs}h ${mins}m`);
      } else {
        setCountdown(`${mins}m`);
      }
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

  return (
    <section className="px-3 sm:px-4 py-6 sm:py-8">
      <div className="container mx-auto">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-2">
          <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
          Compete & Prepare
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {/* Weekly Contest Card */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/weekly-contest")}
            className="cursor-pointer"
          >
            <Card className="p-4 sm:p-6 bg-gradient-to-br from-orange-500/20 via-red-500/10 to-red-500/20 border-orange-500/30 hover:border-orange-500/50 transition-all overflow-hidden relative">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-red-500/20 to-transparent rounded-full translate-y-1/2 -translate-x-1/2" />
              
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Weekly Contest</h3>
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

          {/* Team Preparation Card */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/team")}
            className="cursor-pointer"
          >
            <Card className="p-4 sm:p-6 bg-gradient-to-br from-blue-500/20 via-red-500/10 to-indigo-500/20 border-blue-500/30 hover:border-blue-500/50 transition-all overflow-hidden relative">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-red-500/20 to-transparent rounded-full translate-y-1/2 -translate-x-1/2" />
              
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-red-500 flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">Friendly Prep</h3>
                      <p className="text-sm text-muted-foreground">
                        {teamName || "Create or join a team"}
                      </p>
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
