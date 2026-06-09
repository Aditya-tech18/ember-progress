import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Crown, Shield, Star, Award, Medal, Zap, Rocket, Target, Flame, Gem, Swords, Trophy, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const LeaderboardModal = ({ isOpen, onClose }: Props) => {
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) fetchLeaderboard();
  }, [isOpen]);

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
        else if (subject === "Mathematics") userStats[userId].mathematics++;
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
    const sorted = sortKey
      ? [...data].sort((a, b) => b[sortKey] - a[sortKey])
      : data;

    return sorted.map((entry, index) => {
      const isMe = entry.user_id === currentUserId;
      const rankInfo = getRankForScore(entry.total);
      const RankIcon = rankInfo.icon;

      return (
        <motion.div
          key={entry.user_id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.02 }}
          className={`grid grid-cols-12 gap-4 px-4 py-3.5 rounded-xl transition-all ${
            isMe ? "bg-primary/10 border border-primary/30" : "bg-muted/30 hover:bg-muted/50"
          } ${index < 3 ? "border-l-4" : ""} ${
            index === 0 ? "border-l-yellow-500" : index === 1 ? "border-l-gray-400" : index === 2 ? "border-l-amber-700" : ""
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
              <span className="text-lg font-bold text-muted-foreground w-8 text-center">{index + 1}</span>
            )}
          </div>
          <div className="col-span-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isMe ? "bg-gradient-to-br from-primary to-crimson" : "bg-gradient-to-br from-violet-500 to-red-600"
            }`}>
              <span className="text-white font-bold text-sm">{entry.combat_name.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <p className={`font-semibold ${isMe ? "text-primary" : "text-foreground"}`}>
                {entry.combat_name}
                {isMe && <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">YOU</span>}
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <RankIcon className="w-3 h-3" />
                {entry.rankTitle}
              </div>
            </div>
          </div>
          <div className="col-span-2 flex items-center justify-center">
            <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-sm font-semibold">{entry.physics}</span>
          </div>
          <div className="col-span-2 flex items-center justify-center">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-semibold">{entry.chemistry}</span>
          </div>
          <div className="col-span-2 flex items-center justify-center">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-sm font-semibold">{entry.mathematics}</span>
          </div>
          <div className="col-span-1 flex items-center justify-end">
            <span className="text-lg font-bold text-foreground">{entry.total}</span>
          </div>
        </motion.div>
      );
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] p-0 bg-background/95 backdrop-blur-xl border-border/50 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            Global Leaderboard
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              <span className="relative flex h-2 w-2 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
              </span>
              Live
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="all" className="flex-1 flex flex-col">
          <div className="px-6 py-3 border-b border-border/30">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="all" className="gap-2"><Users className="w-4 h-4" />All Warriors</TabsTrigger>
              <TabsTrigger value="physics" className="gap-2">⚡ Physics</TabsTrigger>
              <TabsTrigger value="chemistry" className="gap-2">🧪 Chemistry</TabsTrigger>
              <TabsTrigger value="mathematics" className="gap-2">📐 Mathematics</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 px-6 py-4" style={{ maxHeight: "60vh" }}>
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
              </div>
            ) : data.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <Trophy className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p>No warriors yet!</p>
              </div>
            ) : (
              <>
                <TabsContent value="all" className="mt-0 space-y-2">
                  <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/30">
                    <div className="col-span-1">#</div>
                    <div className="col-span-4">Warrior</div>
                    <div className="col-span-2 text-center">Physics</div>
                    <div className="col-span-2 text-center">Chemistry</div>
                    <div className="col-span-2 text-center">Maths</div>
                    <div className="col-span-1 text-right">Total</div>
                  </div>
                  {renderRows()}
                </TabsContent>
                <TabsContent value="physics" className="mt-0 space-y-2">
                  <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/30">
                    <div className="col-span-1">#</div>
                    <div className="col-span-4">Warrior</div>
                    <div className="col-span-2 text-center">Physics</div>
                    <div className="col-span-2 text-center">Chemistry</div>
                    <div className="col-span-2 text-center">Maths</div>
                    <div className="col-span-1 text-right">Total</div>
                  </div>
                  {renderRows("physics")}
                </TabsContent>
                <TabsContent value="chemistry" className="mt-0 space-y-2">
                  <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/30">
                    <div className="col-span-1">#</div>
                    <div className="col-span-4">Warrior</div>
                    <div className="col-span-2 text-center">Physics</div>
                    <div className="col-span-2 text-center">Chemistry</div>
                    <div className="col-span-2 text-center">Maths</div>
                    <div className="col-span-1 text-right">Total</div>
                  </div>
                  {renderRows("chemistry")}
                </TabsContent>
                <TabsContent value="mathematics" className="mt-0 space-y-2">
                  <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/30">
                    <div className="col-span-1">#</div>
                    <div className="col-span-4">Warrior</div>
                    <div className="col-span-2 text-center">Physics</div>
                    <div className="col-span-2 text-center">Chemistry</div>
                    <div className="col-span-2 text-center">Maths</div>
                    <div className="col-span-1 text-right">Total</div>
                  </div>
                  {renderRows("mathematics")}
                </TabsContent>
              </>
            )}
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
