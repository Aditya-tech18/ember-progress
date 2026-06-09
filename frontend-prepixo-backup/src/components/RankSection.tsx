import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Crown, Shield, Star, Award, Medal, Zap, Rocket, Target, Flame, Gem, Swords, Trophy,
  X, TrendingUp, Users, ChevronRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ranks = [
  { name: "Recruit", range: "0-49", min: 0, max: 49, icon: Shield, description: "Begin your journey" },
  { name: "Private", range: "50-99", min: 50, max: 99, icon: Star, description: "Building foundation" },
  { name: "Corporal", range: "100-199", min: 100, max: 199, icon: Award, description: "Gaining momentum" },
  { name: "Sergeant", range: "200-349", min: 200, max: 349, icon: Medal, description: "Consistent performer" },
  { name: "Lieutenant", range: "350-499", min: 350, max: 499, icon: Zap, description: "Rising star" },
  { name: "Captain", range: "500-699", min: 500, max: 699, icon: Rocket, description: "Skilled warrior" },
  { name: "Major", range: "700-999", min: 700, max: 999, icon: Target, description: "Expert level" },
  { name: "Colonel", range: "1000-1499", min: 1000, max: 1499, icon: Flame, description: "Battle-hardened" },
  { name: "Brigadier", range: "1500-1999", min: 1500, max: 1999, icon: Gem, description: "Elite force" },
  { name: "General", range: "2000-2999", min: 2000, max: 2999, icon: Swords, description: "Master tactician" },
  { name: "Field Marshal", range: "3000-4999", min: 3000, max: 4999, icon: Trophy, description: "Legendary" },
  { name: "Supreme Marshal", range: "5000+", min: 5000, max: Infinity, icon: Crown, description: "Ultimate champion" },
];

interface LeaderboardEntry {
  rank: number;
  combat_name: string;
  user_id: string;
  physics: number;
  chemistry: number;
  mathematics: number;
  total: number;
  rankTitle: string;
}

const getRankForScore = (score: number) => {
  for (const rank of [...ranks].reverse()) {
    if (score >= rank.min) {
      return rank;
    }
  }
  return ranks[0];
};

export const RankSection = () => {
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [userSolvedCount, setUserSolvedCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchUserProgress();
  }, []);

  const fetchUserProgress = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      const { count } = await supabase
        .from("submissions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      setUserSolvedCount(count || 0);
    }
  };

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      // Get all submissions with user info
      const { data: submissions } = await supabase
        .from("submissions")
        .select(`
          user_id,
          question_id,
          questions!inner(subject)
        `);

      if (!submissions) {
        setLoading(false);
        return;
      }

      // Get all users with combat names
      const { data: users } = await supabase
        .from("users")
        .select("id, combat_name, full_name");

      // Aggregate by user
      const userStats: Record<string, { physics: number; chemistry: number; mathematics: number }> = {};
      
      submissions.forEach((sub: any) => {
        const userId = sub.user_id;
        const subject = sub.questions?.subject || "";
        
        if (!userStats[userId]) {
          userStats[userId] = { physics: 0, chemistry: 0, mathematics: 0 };
        }
        
        if (subject === "Physics") userStats[userId].physics++;
        else if (subject === "Chemistry") userStats[userId].chemistry++;
        else if (subject === "Mathematics") userStats[userId].mathematics++;
      });

      // Create leaderboard entries - FILTER OUT ANONYMOUS USERS
      const entries: LeaderboardEntry[] = Object.entries(userStats)
        .map(([userId, stats]) => {
          const user = users?.find(u => u.id === userId);
          const total = stats.physics + stats.chemistry + stats.mathematics;
          const rankInfo = getRankForScore(total);
          
          return {
            rank: 0,
            user_id: userId,
            combat_name: user?.combat_name || user?.full_name || "",
            physics: stats.physics,
            chemistry: stats.chemistry,
            mathematics: stats.mathematics,
            total,
            rankTitle: rankInfo.name
          };
        })
        // Filter out users without combat_name or full_name (Anonymous users)
        .filter(entry => entry.combat_name && entry.combat_name.trim() !== "" && entry.combat_name !== "Anonymous");

      // Sort by total and assign ranks
      entries.sort((a, b) => b.total - a.total);
      entries.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      setLeaderboardData(entries);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLeaderboard = () => {
    setShowLeaderboard(true);
    fetchLeaderboard();
  };

  const currentRank = getRankForScore(userSolvedCount);
  const currentRankIndex = ranks.findIndex(r => r.name === currentRank.name);
  const nextRank = ranks[currentRankIndex + 1];
  const questionsToNextRank = nextRank ? nextRank.min - userSolvedCount : 0;

  return (
    <section className="py-12 sm:py-20 relative overflow-hidden">
      <div className="container mx-auto px-3 sm:px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
              Your Rank Journey
            </h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleOpenLeaderboard}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-crimson rounded-full text-white text-sm font-semibold shadow-lg hover:shadow-primary/30 transition-shadow"
            >
              <Trophy className="w-4 h-4" />
              Leaderboard
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Rise through the ranks by solving questions and mastering subjects
          </p>
        </motion.div>

        {/* Rank Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4">
          {ranks.map((rank, index) => {
            const Icon = rank.icon;
            const isPast = index < currentRankIndex;
            const isCurrent = index === currentRankIndex;
            const isFuture = index > currentRankIndex;

            return (
              <motion.div
                key={rank.name}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className={`relative group cursor-pointer`}
              >
                <div
                  className={`glass-card rounded-xl sm:rounded-2xl p-2.5 sm:p-4 text-center transition-all duration-300 h-full
                    ${isCurrent ? "ring-2 ring-primary animate-glow-pulse" : ""}
                    ${isPast ? "opacity-60" : ""}
                    ${isFuture ? "opacity-40" : ""}
                  `}
                >
                  <div
                    className={`w-8 h-8 sm:w-12 sm:h-12 mx-auto rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-3 transition-colors
                      ${isCurrent ? "bg-gradient-to-br from-primary to-orange" : "bg-muted"}
                      ${isPast ? "bg-accent/30" : ""}
                    `}
                  >
                    <Icon
                      className={`w-4 h-4 sm:w-6 sm:h-6 ${isCurrent ? "text-primary-foreground" : isPast ? "text-accent" : "text-muted-foreground"}`}
                    />
                  </div>

                  <h4 className={`font-bold text-[10px] sm:text-sm mb-0.5 sm:mb-1 ${isCurrent ? "text-primary" : "text-foreground"} truncate`}>
                    {rank.name}
                  </h4>

                  <div className="text-[9px] sm:text-xs text-muted-foreground mb-1 sm:mb-2">
                    {rank.range} Qs
                  </div>

                  {isCurrent && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 px-2 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold"
                    >
                      YOU
                    </motion.div>
                  )}

                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-popover rounded-lg text-xs text-popover-foreground opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-lg">
                    {rank.description}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Motivational Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 glass-card rounded-full">
            <Rocket className="w-5 h-5 text-primary" />
            <span className="text-muted-foreground">
              {nextRank ? (
                <>
                  You're <span className="text-foreground font-semibold">{questionsToNextRank} questions</span> away from becoming a <span className="text-primary font-bold">{nextRank.name}</span>!
                </>
              ) : (
                <span className="text-primary font-bold">You've reached the highest rank! 🏆</span>
              )}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Leaderboard Dialog */}
      <Dialog open={showLeaderboard} onOpenChange={setShowLeaderboard}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[85vh] p-0 bg-background/95 backdrop-blur-xl border-border/50 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              Global Leaderboard
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <span className="relative flex h-2 w-2 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                </span>
                Live
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="all" className="flex-1 flex flex-col">
            <div className="px-6 py-3 border-b border-border/30">
              <TabsList className="bg-muted/50">
                <TabsTrigger value="all" className="gap-2">
                  <Users className="w-4 h-4" />
                  All Warriors
                </TabsTrigger>
                <TabsTrigger value="physics" className="gap-2">
                  ⚡ Physics
                </TabsTrigger>
                <TabsTrigger value="chemistry" className="gap-2">
                  🧪 Chemistry
                </TabsTrigger>
                <TabsTrigger value="mathematics" className="gap-2">
                  📐 Mathematics
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1 px-6 py-4" style={{ maxHeight: "60vh" }}>
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : leaderboardData.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  <Trophy className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>No warriors on the leaderboard yet!</p>
                  <p className="text-sm">Be the first to solve questions and claim your spot.</p>
                </div>
              ) : (
                <>
                  <TabsContent value="all" className="mt-0 space-y-2">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/30">
                      <div className="col-span-1">#</div>
                      <div className="col-span-4">Warrior</div>
                      <div className="col-span-2 text-center">Physics</div>
                      <div className="col-span-2 text-center">Chemistry</div>
                      <div className="col-span-2 text-center">Maths</div>
                      <div className="col-span-1 text-right">Total</div>
                    </div>

                    {leaderboardData.map((entry, index) => {
                      const isCurrentUser = entry.user_id === currentUserId;
                      const rankInfo = getRankForScore(entry.total);
                      const RankIcon = rankInfo.icon;
                      
                      return (
                        <motion.div
                          key={entry.user_id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className={`grid grid-cols-12 gap-4 px-4 py-4 rounded-xl transition-all ${
                            isCurrentUser 
                              ? "bg-primary/10 border border-primary/30 ring-1 ring-primary/20" 
                              : "bg-muted/30 hover:bg-muted/50"
                          } ${index < 3 ? "border-l-4" : ""} ${
                            index === 0 ? "border-l-yellow-500" : 
                            index === 1 ? "border-l-gray-400" : 
                            index === 2 ? "border-l-amber-700" : ""
                          }`}
                        >
                          <div className="col-span-1 flex items-center">
                            {index === 0 ? (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                                <Crown className="w-4 h-4 text-yellow-900" />
                              </div>
                            ) : index === 1 ? (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center">
                                <Medal className="w-4 h-4 text-gray-700" />
                              </div>
                            ) : index === 2 ? (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center">
                                <Award className="w-4 h-4 text-amber-200" />
                              </div>
                            ) : (
                              <span className="text-lg font-bold text-muted-foreground w-8 text-center">
                                {entry.rank}
                              </span>
                            )}
                          </div>
                          
                          <div className="col-span-4 flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              isCurrentUser 
                                ? "bg-gradient-to-br from-primary to-crimson" 
                                : "bg-gradient-to-br from-violet-500 to-red-600"
                            }`}>
                              <span className="text-white font-bold text-sm">
                                {entry.combat_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className={`font-semibold ${isCurrentUser ? "text-primary" : "text-foreground"}`}>
                                {entry.combat_name}
                                {isCurrentUser && (
                                  <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                                    YOU
                                  </span>
                                )}
                              </p>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <RankIcon className="w-3 h-3" />
                                {rankInfo.name}
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-span-2 flex items-center justify-center">
                            <span className="px-3 py-1 rounded-lg bg-blue-500/10 text-blue-400 font-semibold text-sm">
                              {entry.physics}
                            </span>
                          </div>
                          
                          <div className="col-span-2 flex items-center justify-center">
                            <span className="px-3 py-1 rounded-lg bg-green-500/10 text-green-400 font-semibold text-sm">
                              {entry.chemistry}
                            </span>
                          </div>
                          
                          <div className="col-span-2 flex items-center justify-center">
                            <span className="px-3 py-1 rounded-lg bg-orange-500/10 text-orange-400 font-semibold text-sm">
                              {entry.mathematics}
                            </span>
                          </div>
                          
                          <div className="col-span-1 flex items-center justify-end">
                            <span className={`text-lg font-bold ${
                              isCurrentUser ? "text-primary" : "text-foreground"
                            }`}>
                              {entry.total}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </TabsContent>

                  {["physics", "chemistry", "mathematics"].map((subject) => (
                    <TabsContent key={subject} value={subject} className="mt-0 space-y-2">
                      <div className="grid grid-cols-6 gap-4 px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/30">
                        <div className="col-span-1">#</div>
                        <div className="col-span-3">Warrior</div>
                        <div className="col-span-1 text-center">Rank</div>
                        <div className="col-span-1 text-right">{subject.charAt(0).toUpperCase() + subject.slice(1)}</div>
                      </div>

                      {[...leaderboardData]
                        .sort((a, b) => b[subject as keyof LeaderboardEntry] as number - (a[subject as keyof LeaderboardEntry] as number))
                        .map((entry, index) => {
                          const isCurrentUser = entry.user_id === currentUserId;
                          const subjectScore = entry[subject as keyof LeaderboardEntry] as number;
                          
                          return (
                            <motion.div
                              key={entry.user_id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.03 }}
                              className={`grid grid-cols-6 gap-4 px-4 py-4 rounded-xl transition-all ${
                                isCurrentUser 
                                  ? "bg-primary/10 border border-primary/30" 
                                  : "bg-muted/30 hover:bg-muted/50"
                              }`}
                            >
                              <div className="col-span-1 flex items-center">
                                <span className={`text-lg font-bold ${index < 3 ? "text-primary" : "text-muted-foreground"}`}>
                                  {index + 1}
                                </span>
                              </div>
                              
                              <div className="col-span-3 flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                  subject === "physics" ? "bg-gradient-to-br from-blue-500 to-cyan-600" :
                                  subject === "chemistry" ? "bg-gradient-to-br from-green-500 to-emerald-600" :
                                  "bg-gradient-to-br from-orange-500 to-red-600"
                                }`}>
                                  <span className="text-white font-bold text-sm">
                                    {entry.combat_name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <p className={`font-semibold ${isCurrentUser ? "text-primary" : "text-foreground"}`}>
                                    {entry.combat_name}
                                    {isCurrentUser && (
                                      <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                                        YOU
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="col-span-1 flex items-center justify-center">
                                <Badge variant="outline" className="text-xs">
                                  {entry.rankTitle}
                                </Badge>
                              </div>
                              
                              <div className="col-span-1 flex items-center justify-end">
                                <span className={`text-xl font-bold ${
                                  subject === "physics" ? "text-blue-400" :
                                  subject === "chemistry" ? "text-green-400" :
                                  "text-orange-400"
                                }`}>
                                  {subjectScore}
                                </span>
                              </div>
                            </motion.div>
                          );
                        })}
                    </TabsContent>
                  ))}
                </>
              )}
            </ScrollArea>
          </Tabs>
        </DialogContent>
      </Dialog>
    </section>
  );
};
