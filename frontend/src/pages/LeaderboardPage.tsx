import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Crown, Shield, Star, Award, Medal, Zap, Rocket, Target, Flame, Gem, Swords, Trophy, Users, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navbar } from "@/components/Navbar";
import { getCachedGoal } from "@/utils/examConfig";

const ranks = [
  { name: "Recruit", min: 0, max: 49, icon: Shield },
  { name: "Private", min: 50, max: 99, icon: Star },
  { name: "Corporal", min: 100, max: 199, icon: Award },
  { name: "Sergeant", min: 200, max: 349, icon: Medal },
  { name: "Lieutenant", min: 350, max: 499, icon: Zap },
  { name: "Captain", min: 500, max: 699, icon: Rocket },
  { name: "Major", min: 700, max: 999, icon: Target },
  { name: "Colonel", min: 1000, max: 1499, icon: Flame },
  { name: "Brigadier", min: 1500, max: 1999, icon: Gem },
  { name: "General", min: 2000, max: 2999, icon: Swords },
  { name: "Field Marshal", min: 3000, max: 4999, icon: Trophy },
  { name: "Supreme Marshal", min: 5000, max: Infinity, icon: Crown },
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
    if (score >= rank.min) return rank;
  }
  return ranks[0];
};

const LeaderboardPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const goal = getCachedGoal();
  const isNEET = goal === "NEET";
  const thirdSubject = isNEET ? "Biology" : "Mathematics";
  const thirdSubjectLabel = isNEET ? "Biology" : "Maths";

  useEffect(() => { fetchLeaderboard(); }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);

      const { data: submissions } = await supabase
        .from("submissions")
        .select("user_id, question_id, questions!inner(subject)");

      if (!submissions) { setLoading(false); return; }

      const { data: users } = await supabase
        .from("users")
        .select("id, combat_name, full_name");

      const userStats: Record<string, { physics: number; chemistry: number; mathematics: number }> = {};
      submissions.forEach((sub: any) => {
        const userId = sub.user_id;
        const subject = sub.questions?.subject || "";
        if (!userStats[userId]) userStats[userId] = { physics: 0, chemistry: 0, mathematics: 0 };
        if (subject === "Physics") userStats[userId].physics++;
        else if (subject === "Chemistry") userStats[userId].chemistry++;
        else if (subject === "Mathematics" || subject === "Biology") userStats[userId].mathematics++;
      });

      const entries: LeaderboardEntry[] = Object.entries(userStats)
        .map(([userId, stats]) => {
          const u = users?.find(x => x.id === userId);
          const total = stats.physics + stats.chemistry + stats.mathematics;
          return {
            rank: 0, user_id: userId,
            combat_name: u?.combat_name || u?.full_name || "",
            physics: stats.physics, chemistry: stats.chemistry, mathematics: stats.mathematics,
            total, rankTitle: getRankForScore(total).name,
          };
        })
        .filter(e => e.combat_name && e.combat_name.trim() !== "" && e.combat_name !== "Anonymous");

      entries.sort((a, b) => b.total - a.total);
      entries.forEach((e, i) => { e.rank = i + 1; });
      setData(entries);
    } catch (err) {
      console.error("Leaderboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderRows = (sortKey?: "physics" | "chemistry" | "mathematics") => {
    const sorted = sortKey ? [...data].sort((a, b) => b[sortKey] - a[sortKey]) : data;
    return sorted.map((entry, index) => {
      const isMe = entry.user_id === currentUserId;
      const rankInfo = getRankForScore(entry.total);
      const RankIcon = rankInfo.icon;
      return (
        <motion.div
          key={entry.user_id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.02 }}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            isMe ? "bg-primary/10 border border-primary/30" : "bg-muted/30 hover:bg-muted/50"
          } ${index === 0 ? "border-l-4 border-l-yellow-500" : index === 1 ? "border-l-4 border-l-gray-400" : index === 2 ? "border-l-4 border-l-amber-700" : ""}`}
        >
          {/* Rank badge */}
          <div className="w-9 shrink-0 flex items-center justify-center">
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
              <span className="text-base font-bold text-muted-foreground">{index + 1}</span>
            )}
          </div>

          {/* Avatar */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isMe ? "bg-gradient-to-br from-primary to-red-600" : "bg-gradient-to-br from-violet-500 to-red-600"
          }`}>
            <span className="text-white font-bold text-sm">{entry.combat_name.charAt(0).toUpperCase()}</span>
          </div>

          {/* Name + rank */}
          <div className="flex-1 min-w-0">
            <p className={`font-semibold text-sm truncate ${isMe ? "text-primary" : "text-foreground"}`}>
              {entry.combat_name}
              {isMe && <span className="ml-1.5 text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">YOU</span>}
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <RankIcon className="w-3 h-3" />{entry.rankTitle}
            </div>
          </div>

          {/* Scores */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-9 h-9 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center">{entry.physics}</span>
            <span className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center">{entry.chemistry}</span>
            <span className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold flex items-center justify-center">{entry.mathematics}</span>
            <span className="w-10 text-right font-black text-base text-foreground">{entry.total}</span>
          </div>
        </motion.div>
      );
    });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navbar />
      <div className="pt-20 px-4 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-foreground">Global Leaderboard</h1>
          </div>
          <Badge className="ml-auto bg-green-500/20 text-green-400 border-green-500/30">
            <span className="relative flex h-2 w-2 mr-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
            </span>
            Live
          </Badge>
        </div>

        <Tabs defaultValue="all">
          <TabsList className="bg-muted/50 w-full mb-4 flex overflow-x-auto">
            <TabsTrigger value="all" className="gap-1.5 flex-1 text-xs"><Users className="w-3.5 h-3.5" />All</TabsTrigger>
            <TabsTrigger value="physics" className="flex-1 text-xs">⚡ Physics</TabsTrigger>
            <TabsTrigger value="chemistry" className="flex-1 text-xs">🧪 Chemistry</TabsTrigger>
            <TabsTrigger value="mathematics" className="flex-1 text-xs">{isNEET ? "🌿" : "📐"} {thirdSubjectLabel}</TabsTrigger>
          </TabsList>

          {/* Column headers */}
          <div className="flex items-center gap-3 px-4 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border/30 mb-2">
            <div className="w-9 text-center">#</div>
            <div className="w-10" />
            <div className="flex-1">Warrior</div>
            <div className="flex gap-2">
              <span className="w-9 text-center text-blue-400">PHY</span>
              <span className="w-9 text-center text-emerald-400">CHM</span>
              <span className="w-9 text-center text-amber-400">{isNEET ? "BIO" : "MTH"}</span>
              <span className="w-10 text-right">TTL</span>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Trophy className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p>No warriors yet. Be the first!</p>
            </div>
          ) : (
            <>
              <TabsContent value="all" className="mt-0 space-y-2">{renderRows()}</TabsContent>
              <TabsContent value="physics" className="mt-0 space-y-2">{renderRows("physics")}</TabsContent>
              <TabsContent value="chemistry" className="mt-0 space-y-2">{renderRows("chemistry")}</TabsContent>
              <TabsContent value="mathematics" className="mt-0 space-y-2">{renderRows("mathematics")}</TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default LeaderboardPage;
