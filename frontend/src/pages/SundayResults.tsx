import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, Crown, Swords, Medal, Star, 
  Clock, Users, ChevronRight, Flame, Lock,
  PartyPopper, Sparkles
} from "lucide-react";
import { format, isAfter, isBefore, setHours, setMinutes } from "date-fns";

interface BattleResult {
  challenge_id: string;
  challenger_team: string;
  challenger_name: string;
  challenger_score: number;
  opponent_team: string;
  opponent_name: string;
  opponent_score: number;
  winner_team: string | null;
  winner_name: string | null;
  start_time: string;
}

const SundayResults = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState<BattleResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [isResultsTime, setIsResultsTime] = useState(false);
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    checkResultsTime();
    const interval = setInterval(checkResultsTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isResultsTime) {
      fetchResults();
    }
  }, [isResultsTime]);

  const checkResultsTime = () => {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday
    
    // Results available on Sunday between 5 PM and 10 PM
    const startTime = setMinutes(setHours(now, 17), 0);
    const endTime = setMinutes(setHours(now, 22), 0);
    
    const isSunday = day === 0;
    const isInTimeWindow = isAfter(now, startTime) && isBefore(now, endTime);
    
    setIsResultsTime(isSunday && isInTimeWindow);

    if (!isSunday || isBefore(now, startTime)) {
      // Calculate countdown to next results window
      let nextSunday = new Date(now);
      
      // If not Sunday, find next Sunday
      while (nextSunday.getDay() !== 0) {
        nextSunday.setDate(nextSunday.getDate() + 1);
      }
      
      nextSunday = setMinutes(setHours(nextSunday, 17), 0);
      
      const diff = nextSunday.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      if (days > 0) {
        setCountdown(`${days}d ${hours}h ${minutes}m`);
      } else {
        setCountdown(`${hours}h ${minutes}m ${seconds}s`);
      }
    } else if (isAfter(now, endTime)) {
      setCountdown("Results closed for today");
    }
    
    setLoading(false);
  };

  const fetchResults = async () => {
    try {
      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: challenges } = await supabase
        .from("team_challenges")
        .select("*")
        .eq("status", "completed")
        .gte("start_time", today.toISOString())
        .lt("start_time", tomorrow.toISOString())
        .order("start_time", { ascending: false });

      if (!challenges) return;

      const resultsData: BattleResult[] = [];

      for (const challenge of challenges) {
        const { data: challengerTeam } = await supabase
          .from("teams")
          .select("team_name")
          .eq("team_id", challenge.challenger_team)
          .single();

        const { data: opponentTeam } = await supabase
          .from("teams")
          .select("team_name")
          .eq("team_id", challenge.opponent_team)
          .single();

        let winnerName = null;
        if (challenge.winner_team) {
          const { data: winner } = await supabase
            .from("teams")
            .select("team_name")
            .eq("team_id", challenge.winner_team)
            .single();
          winnerName = winner?.team_name || null;
        }

        resultsData.push({
          challenge_id: challenge.challenge_id,
          challenger_team: challenge.challenger_team,
          challenger_name: challengerTeam?.team_name || "Unknown",
          challenger_score: challenge.challenger_score || 0,
          opponent_team: challenge.opponent_team,
          opponent_name: opponentTeam?.team_name || "Unknown",
          opponent_score: challenge.opponent_score || 0,
          winner_team: challenge.winner_team,
          winner_name: winnerName,
          start_time: challenge.start_time,
        });
      }

      setResults(resultsData);
    } catch (error) {
      console.error("Error fetching results:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-14">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Badge className="mb-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
            <Trophy className="w-3 h-3 mr-1" />
            Battle Results
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Sunday Battle Results
          </h1>
          <p className="text-muted-foreground">
            Results are available every Sunday from 5 PM to 10 PM
          </p>
        </motion.div>

        {!isResultsTime ? (
          /* Locked State */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-lg mx-auto"
          >
            <Card className="p-8 text-center bg-gradient-to-br from-muted/50 to-background border-2 border-dashed border-muted-foreground/30">
              <Lock className="w-20 h-20 mx-auto mb-6 text-muted-foreground/50" />
              <h2 className="text-2xl font-bold mb-2">Results Locked</h2>
              <p className="text-muted-foreground mb-6">
                Battle results are only visible on Sundays between 5 PM - 10 PM
              </p>
              
              <div className="p-6 bg-muted/50 rounded-xl mb-6">
                <p className="text-sm text-muted-foreground mb-2">Results available in</p>
                <p className="text-4xl font-mono font-bold bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
                  {countdown}
                </p>
              </div>

              <Button onClick={() => navigate("/team")} variant="outline">
                Go to Team Dashboard
              </Button>
            </Card>
          </motion.div>
        ) : (
          /* Results View */
          <div className="space-y-6">
            {results.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <Swords className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <h2 className="text-xl font-bold mb-2">No Battles Today</h2>
                <p className="text-muted-foreground">
                  There were no team battles scheduled for today.
                </p>
              </motion.div>
            ) : (
              results.map((result, index) => (
                <motion.div
                  key={result.challenge_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Card className="p-6 overflow-hidden relative">
                    {/* Winner Celebration Background */}
                    {result.winner_team && (
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-transparent to-yellow-500/10 pointer-events-none" />
                    )}

                    <div className="relative z-10">
                      {/* Battle Header */}
                      <div className="flex items-center justify-center gap-2 mb-6">
                        <Swords className="w-5 h-5 text-red-500" />
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(result.start_time), "h:mm a")}
                        </span>
                      </div>

                      {/* Teams Face-off */}
                      <div className="grid grid-cols-3 gap-4 items-center">
                        {/* Challenger Team */}
                        <motion.div
                          initial={{ x: -50, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.2 * index }}
                          className={`text-center p-4 rounded-xl ${
                            result.winner_team === result.challenger_team
                              ? "bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/50"
                              : "bg-muted/50"
                          }`}
                        >
                          {result.winner_team === result.challenger_team && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.5, type: "spring" }}
                              className="mb-2"
                            >
                              <Crown className="w-8 h-8 mx-auto text-yellow-500" />
                            </motion.div>
                          )}
                          <h3 className="font-bold text-lg mb-2">{result.challenger_name}</h3>
                          <div className={`text-4xl font-bold ${
                            result.winner_team === result.challenger_team
                              ? "text-yellow-500"
                              : "text-foreground"
                          }`}>
                            {result.challenger_score}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Average Score</p>
                        </motion.div>

                        {/* VS */}
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                            VS
                          </div>
                          {result.winner_team && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.6 }}
                              className="mt-3 flex items-center gap-1 text-sm font-medium text-yellow-500"
                            >
                              <PartyPopper className="w-4 h-4" />
                              Winner!
                            </motion.div>
                          )}
                        </div>

                        {/* Opponent Team */}
                        <motion.div
                          initial={{ x: 50, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.2 * index }}
                          className={`text-center p-4 rounded-xl ${
                            result.winner_team === result.opponent_team
                              ? "bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/50"
                              : "bg-muted/50"
                          }`}
                        >
                          {result.winner_team === result.opponent_team && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.5, type: "spring" }}
                              className="mb-2"
                            >
                              <Crown className="w-8 h-8 mx-auto text-yellow-500" />
                            </motion.div>
                          )}
                          <h3 className="font-bold text-lg mb-2">{result.opponent_name}</h3>
                          <div className={`text-4xl font-bold ${
                            result.winner_team === result.opponent_team
                              ? "text-yellow-500"
                              : "text-foreground"
                          }`}>
                            {result.opponent_score}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Average Score</p>
                        </motion.div>
                      </div>

                      {/* Winner Banner */}
                      {result.winner_name && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.4 }}
                          className="mt-6 p-4 bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-yellow-500/20 rounded-xl text-center border border-yellow-500/30"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <Sparkles className="w-5 h-5 text-yellow-500" />
                            <span className="font-bold text-lg">
                              🏆 {result.winner_name} Wins!
                            </span>
                            <Sparkles className="w-5 h-5 text-yellow-500" />
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SundayResults;
