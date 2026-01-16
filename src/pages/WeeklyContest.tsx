import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, Clock, Users, Medal, Crown, 
  Play, Lock, CheckCircle, AlertCircle, Timer,
  ChevronRight, Star, Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInSeconds, isAfter, isBefore, addMinutes } from "date-fns";

interface Contest {
  contest_id: string;
  title: string;
  start_time: string;
  end_time: string;
  result_time: string;
}

interface Participant {
  id: string;
  display_name: string;
  total_marks: number;
  rank: number | null;
  submitted_at: string | null;
  user_id: string | null;
}

type ContestStatus = "upcoming" | "live" | "ended" | "results";

const WeeklyContest = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [contest, setContest] = useState<Contest | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);
  const [userParticipation, setUserParticipation] = useState<Participant | null>(null);
  const [countdown, setCountdown] = useState<string>("");
  const [contestStatus, setContestStatus] = useState<ContestStatus>("upcoming");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTester, setIsTester] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchContestData();
    checkTesterStatus();
    
    const interval = setInterval(() => {
      updateCountdown();
    }, 1000);
    
    return () => clearInterval(interval);
  }, [contest]);

  const checkTesterStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      const { data } = await supabase
        .from("contest_testers")
        .select("email")
        .eq("email", user.email)
        .maybeSingle();
      
      setIsTester(!!data);
    }
  };

  const fetchContestData = async () => {
    try {
      // Get the current/next contest
      const now = new Date().toISOString();
      
      const { data: contestData, error: contestError } = await supabase
        .from("contests")
        .select("*")
        .gte("result_time", now)
        .order("start_time", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (contestError) throw contestError;
      
      if (contestData) {
        setContest(contestData);
        
        // Fetch participants
        const { data: participantsData } = await supabase
          .from("contest_participants")
          .select("*")
          .eq("contest_id", contestData.contest_id)
          .order("rank", { ascending: true, nullsFirst: false });
        
        setParticipants(participantsData || []);
        
        // Check if current user is registered
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const userPart = participantsData?.find(p => p.user_id === user.id);
          if (userPart) {
            setIsRegistered(true);
            setUserParticipation(userPart);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching contest:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateCountdown = () => {
    if (!contest) return;

    const now = new Date();
    const start = new Date(contest.start_time);
    const end = new Date(contest.end_time);
    const result = new Date(contest.result_time);

    // For testers, always show as live
    if (isTester) {
      setContestStatus("live");
      const secsLeft = Math.max(0, differenceInSeconds(end, now));
      const hrs = Math.floor(secsLeft / 3600);
      const mins = Math.floor((secsLeft % 3600) / 60);
      const secs = secsLeft % 60;
      setCountdown(`${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      return;
    }

    if (isBefore(now, start)) {
      setContestStatus("upcoming");
      const secsLeft = differenceInSeconds(start, now);
      const days = Math.floor(secsLeft / 86400);
      const hrs = Math.floor((secsLeft % 86400) / 3600);
      const mins = Math.floor((secsLeft % 3600) / 60);
      const secs = secsLeft % 60;
      
      if (days > 0) {
        setCountdown(`${days}d ${hrs}h ${mins}m ${secs}s`);
      } else {
        setCountdown(`${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      }
    } else if (isAfter(now, start) && isBefore(now, end)) {
      setContestStatus("live");
      const secsLeft = differenceInSeconds(end, now);
      const hrs = Math.floor(secsLeft / 3600);
      const mins = Math.floor((secsLeft % 3600) / 60);
      const secs = secsLeft % 60;
      setCountdown(`${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
    } else if (isAfter(now, end) && isBefore(now, result)) {
      setContestStatus("ended");
      const secsLeft = differenceInSeconds(result, now);
      const mins = Math.floor(secsLeft / 60);
      const secs = secsLeft % 60;
      setCountdown(`Results in ${mins}m ${secs}s`);
    } else {
      setContestStatus("results");
      setCountdown("");
    }
  };

  const handleRegister = async () => {
    if (!displayName.trim()) {
      toast({
        title: "Display name required",
        description: "Please enter a unique display name",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Login required",
          description: "Please login to join the contest",
          variant: "destructive"
        });
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("contest_participants")
        .insert({
          contest_id: contest?.contest_id,
          user_id: user.id,
          display_name: displayName.trim()
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Name already taken",
            description: "Please choose a different display name",
            variant: "destructive"
          });
        } else {
          throw error;
        }
        return;
      }

      setIsRegistered(true);
      setUserParticipation(data);
      toast({
        title: "Registered successfully! 🎉",
        description: "You're now registered for the contest"
      });
      
      fetchContestData();
    } catch (error) {
      console.error("Error registering:", error);
      toast({
        title: "Registration failed",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartContest = () => {
    if (contest) {
      navigate(`/contest/${contest.contest_id}`);
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

  if (!contest) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Active Contest</h2>
          <p className="text-muted-foreground">Check back later for upcoming contests!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-14">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Badge className="mb-4 bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
            <Trophy className="w-3 h-3 mr-1" />
            Weekly Contest
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{contest.title}</h1>
          <p className="text-muted-foreground">
            {format(new Date(contest.start_time), "EEEE, MMMM d, yyyy")}
          </p>
          {isTester && (
            <Badge className="mt-2 bg-purple-500">🧪 Tester Access Enabled</Badge>
          )}
        </motion.div>

        {/* Countdown Timer */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className={`p-6 text-center ${
            contestStatus === "live" 
              ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/50" 
              : contestStatus === "upcoming"
              ? "bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/50"
              : "bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/50"
          }`}>
            <div className="flex items-center justify-center gap-2 mb-4">
              {contestStatus === "live" ? (
                <>
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  <span className="text-green-500 font-bold">LIVE NOW</span>
                </>
              ) : contestStatus === "upcoming" ? (
                <>
                  <Timer className="w-5 h-5 text-orange-500" />
                  <span className="text-orange-500 font-bold">STARTS IN</span>
                </>
              ) : contestStatus === "ended" ? (
                <>
                  <Clock className="w-5 h-5 text-purple-500" />
                  <span className="text-purple-500 font-bold">CALCULATING RESULTS</span>
                </>
              ) : (
                <>
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <span className="text-yellow-500 font-bold">RESULTS AVAILABLE</span>
                </>
              )}
            </div>
            
            {countdown && (
              <div className="text-4xl md:text-6xl font-mono font-bold bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
                {countdown}
              </div>
            )}

            <div className="flex justify-center gap-8 mt-4 text-sm text-muted-foreground">
              <div>
                <Clock className="w-4 h-4 inline mr-1" />
                {format(new Date(contest.start_time), "h:mm a")} - {format(new Date(contest.end_time), "h:mm a")}
              </div>
              <div>
                <Users className="w-4 h-4 inline mr-1" />
                {participants.length} Participants
              </div>
            </div>
          </Card>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Registration / Join Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                {isRegistered ? "You're Registered!" : "Join Contest"}
              </h3>

              {!isRegistered ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">
                      Choose your display name
                    </label>
                    <Input
                      placeholder="Enter unique display name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="mb-2"
                    />
                    <p className="text-xs text-muted-foreground">
                      This name will appear on the leaderboard
                    </p>
                  </div>
                  <Button 
                    onClick={handleRegister} 
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500"
                    disabled={isSubmitting || !displayName.trim()}
                  >
                    {isSubmitting ? "Registering..." : "Register Now"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                    <div>
                      <p className="font-bold">{userParticipation?.display_name}</p>
                      <p className="text-sm text-muted-foreground">You're all set!</p>
                    </div>
                  </div>

                  {(contestStatus === "live" || isTester) && (
                    <Button 
                      onClick={handleStartContest}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500"
                      size="lg"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      {userParticipation?.submitted_at ? "View Contest" : "Start Contest"}
                    </Button>
                  )}

                  {contestStatus === "upcoming" && !isTester && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Lock className="w-4 h-4" />
                      <span>Contest starts at {format(new Date(contest.start_time), "h:mm a")}</span>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </motion.div>

          {/* Contest Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-orange-500" />
                Contest Details
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-muted-foreground">Total Questions</span>
                  <span className="font-bold">75</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-muted-foreground">Maximum Marks</span>
                  <span className="font-bold">300</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="font-bold">3 Hours</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-muted-foreground">Negative Marking</span>
                  <span className="font-bold">-1 per wrong</span>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Leaderboard */}
        {(contestStatus === "results" || participants.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8"
          >
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Medal className="w-5 h-5 text-yellow-500" />
                {contestStatus === "results" ? "Final Leaderboard" : "Registered Participants"}
              </h3>

              <div className="space-y-2">
                {participants.slice(0, 10).map((participant, index) => (
                  <motion.div
                    key={participant.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      participant.user_id === userId 
                        ? "bg-orange-500/20 border border-orange-500/50" 
                        : "bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        index === 0 ? "bg-yellow-500 text-black" :
                        index === 1 ? "bg-gray-300 text-black" :
                        index === 2 ? "bg-amber-700 text-white" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {contestStatus === "results" && participant.rank 
                          ? participant.rank 
                          : index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{participant.display_name}</p>
                        {participant.submitted_at && (
                          <p className="text-xs text-muted-foreground">
                            Submitted
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {contestStatus === "results" && (
                      <div className="text-right">
                        <p className="font-bold text-lg">{participant.total_marks}</p>
                        <p className="text-xs text-muted-foreground">/300</p>
                      </div>
                    )}
                  </motion.div>
                ))}

                {participants.length > 10 && (
                  <p className="text-center text-muted-foreground text-sm pt-2">
                    +{participants.length - 10} more participants
                  </p>
                )}

                {participants.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    No participants yet. Be the first to join!
                  </p>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default WeeklyContest;
