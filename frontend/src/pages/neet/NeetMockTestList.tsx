import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { fetchAvailablePapers, getStoredRecord, fetchLeaderboardStats } from "./neetMockUtils";
import { ArrowLeft, Clock, FileQuestion, Trophy, CheckCircle2, Rocket, Loader2, Star } from "lucide-react";

interface PaperCard {
  test_id: string;
  title: string;
  exam_shift: string;
  exam_year: number;
  bestScore?: number;
  rank?: number | null;
  total?: number;
  attempted?: boolean;
}

export default function NeetMockTestList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<PaperCard[]>([]);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const papers = await fetchAvailablePapers();
    const { data: { user } } = await supabase.auth.getUser();
    const results: PaperCard[] = [];
    for (const p of papers) {
      const rec = getStoredRecord(p.test_id);
      let rank: number | null = null, total = 0;
      if (rec && user) {
        const stats = await fetchLeaderboardStats(p.test_id, rec.bestScore);
        rank = stats.rank; total = stats.total;
      }
      results.push({
        test_id: p.test_id,
        title: p.title,
        exam_shift: p.exam_shift,
        exam_year: p.exam_year,
        attempted: !!rec,
        bestScore: rec?.bestScore,
        rank, total,
      });
    }
    results.sort((a, b) => b.exam_year - a.exam_year);
    setCards(results);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Navbar />
      <div className="pt-20 pb-24 px-4 lg:px-8 max-w-5xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-4 text-white/70">
          <ArrowLeft className="w-4 h-4 mr-2" /> Home
        </Button>
        <h1 className="text-3xl font-bold mb-1">NEET Mock Tests</h1>
        <p className="text-white/60 mb-8 text-sm">NTA pattern · 180 questions · 200 minutes · 720 marks</p>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#e63946]" /></div>
        ) : cards.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#111] p-10 text-center">
            <FileQuestion className="w-10 h-10 text-white/40 mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-1">No complete papers available yet</h3>
            <p className="text-sm text-white/50">
              Mock test cards appear only when a paper has all 180 questions uploaded
              (45 Physics · 45 Chemistry · 45 Botany · 45 Zoology). Check back soon.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {cards.map((c, i) => (
              <motion.div
                key={c.test_id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-white/10 bg-[#111] overflow-hidden"
              >
                <div className="h-1 bg-gradient-to-r from-[#e63946] via-orange-500 to-[#e63946]" />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-2xl font-bold tracking-tight">NEET {c.exam_year}</div>
                      <div className="text-sm text-white/60 mt-0.5">{c.exam_shift.replace(/^NEET \d{4}\s*/, "")} · Full Paper</div>
                    </div>
                    {c.attempted && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/15 border border-green-500/30 text-green-400 text-xs">
                        <CheckCircle2 className="w-3 h-3" /> Attempted
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs flex items-center gap-1">
                      <FileQuestion className="w-3 h-3 text-[#e63946]" /> 180 Questions
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#e63946]" /> 200 Minutes
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-[#e63946]" /> 720 Marks
                    </span>
                  </div>

                  {c.attempted ? (
                    <div className="space-y-3">
                      <div className="flex items-end justify-between p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20">
                        <div>
                          <div className="text-xs text-white/60">Your Best Score</div>
                          <div className="text-2xl font-bold text-green-400 leading-tight">{c.bestScore} <span className="text-sm text-white/50 font-normal">/ 720</span></div>
                        </div>
                        {c.rank && c.total ? (
                          <div className="text-right">
                            <div className="text-xs text-white/60 flex items-center gap-1 justify-end"><Star className="w-3 h-3 text-yellow-400" /> Rank</div>
                            <div className="text-sm font-semibold">{c.rank} <span className="text-white/50">/ {c.total}</span></div>
                          </div>
                        ) : null}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button onClick={() => navigate(`/mock-test/result/${c.test_id}`)} variant="outline" className="border-white/20 text-white hover:bg-white/10">
                          View Result
                        </Button>
                        <Button onClick={() => navigate(`/mock-test/instructions/${c.test_id}`)} className="bg-[#e63946] hover:bg-[#d62c39]">
                          Reattempt
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button onClick={() => navigate(`/mock-test/instructions/${c.test_id}`)} className="w-full bg-[#e63946] hover:bg-[#d62c39] text-white font-semibold">
                      <Rocket className="w-4 h-4 mr-2" /> Start Test
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
