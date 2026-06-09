import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getStoredRecord, fetchLeaderboardStats, formatHHMMSS, MAX_MARKS } from "./neetMockUtils";
import { Trophy, Eye, RotateCcw, Home, Loader2 } from "lucide-react";

export default function NeetMockTestResult() {
  const { resultId } = useParams<{ resultId: string }>();
  const navigate = useNavigate();
  const [rec, setRec] = useState<any>(null);
  const [stats, setStats] = useState<{ rank: number | null; total: number; percentile: number | null }>({ rank: null, total: 0, percentile: null });
  const [name, setName] = useState("Candidate");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!resultId) return;
      const r = getStoredRecord(resultId);
      setRec(r);
      if (r) {
        const s = await fetchLeaderboardStats(resultId, r.bestScore);
        setStats(s);
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("users").select("combat_name, email").eq("id", user.id).maybeSingle();
        if (data) setName(data.combat_name || data.email || "Candidate");
      }
      setLoading(false);
    })();
  }, [resultId]);

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-[#e63946]" />
    </div>
  );

  if (!rec) return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 text-center">
      <p>No result found for this test.</p>
      <Button onClick={() => navigate("/mock-tests")} className="mt-4 bg-[#e63946]">Back</Button>
    </div>
  );

  const att = rec.attempts[rec.bestAttemptIndex];
  const rows = [
    { name: "Physics", q: 45, c: att.physicsCorrect, w: att.physicsWrong, u: att.physicsUnattempted, s: att.physicsScore },
    { name: "Chemistry", q: 45, c: att.chemistryCorrect, w: att.chemistryWrong, u: att.chemistryUnattempted, s: att.chemistryScore },
    { name: "Botany", q: 45, c: att.botanyCorrect, w: att.botanyWrong, u: att.botanyUnattempted, s: att.botanyScore },
    { name: "Zoology", q: 45, c: att.zoologyCorrect, w: att.zoologyWrong, u: att.zoologyUnattempted, s: att.zoologyScore },
  ];

  const total = { c: att.totalCorrect, w: att.totalWrong, u: att.totalUnattempted, s: att.totalScore };
  const pct = (att.totalScore / MAX_MARKS) * 100;

  // donut
  const arc = (pctVal: number) => {
    const r = 70; const C = 2 * Math.PI * r;
    return C * (1 - pctVal / 100);
  };
  const cFrac = (total.c / 180) * 100;
  const wFrac = (total.w / 180) * 100;
  const uFrac = (total.u / 180) * 100;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Navbar />
      <div className="pt-20 pb-12 px-4 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
          <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-2" />
          <h1 className="text-2xl md:text-3xl font-bold">{rec.examShift}</h1>
          <p className="text-white/60 text-sm">{name} · Best of {rec.attempts.length} attempt{rec.attempts.length>1?"s":""} · {new Date(att.submittedAt).toLocaleString()}</p>
        </motion.div>

        <div className="rounded-2xl border-2 border-[#e63946]/40 bg-gradient-to-br from-[#1a0a0e] to-[#111] p-6 mb-5">
          <div className="grid md:grid-cols-3 gap-4 items-center">
            <div className="text-center md:text-left">
              <div className="text-xs text-white/60">Your Score</div>
              <div className="text-5xl md:text-6xl font-extrabold text-[#e63946] leading-none">{total.s}</div>
              <div className="text-white/60 text-sm">out of {MAX_MARKS} · {pct.toFixed(2)}%</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-white/60">Percentile</div>
              <div className="text-3xl font-bold text-green-400">{stats.percentile !== null ? stats.percentile.toFixed(2) : "--"}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-white/60">Rank</div>
              <div className="text-3xl font-bold">{stats.rank ?? "--"} <span className="text-white/50 text-base">/ {stats.total || "--"}</span></div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5 mb-5">
          <div className="rounded-2xl border border-white/10 bg-[#111] p-5">
            <h3 className="font-semibold mb-3">Subject Performance</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs md:text-sm">
                <thead className="text-white/60">
                  <tr><th className="text-left p-2">Subject</th><th className="p-2">Q</th><th className="p-2 text-green-400">✓</th><th className="p-2 text-[#e63946]">✗</th><th className="p-2 text-white/50">−</th><th className="p-2">Score</th></tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.name} className="border-t border-white/5">
                      <td className="p-2 font-medium">{r.name}</td>
                      <td className="p-2 text-center">{r.q}</td>
                      <td className="p-2 text-center">{r.c}</td>
                      <td className="p-2 text-center">{r.w}</td>
                      <td className="p-2 text-center">{r.u}</td>
                      <td className="p-2 text-center font-bold">{r.s}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-white/10 bg-white/5 font-bold">
                    <td className="p-2">Total</td><td className="p-2 text-center">180</td>
                    <td className="p-2 text-center text-green-400">{total.c}</td>
                    <td className="p-2 text-center text-[#e63946]">{total.w}</td>
                    <td className="p-2 text-center text-white/60">{total.u}</td>
                    <td className="p-2 text-center">{total.s}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#111] p-5 flex flex-col items-center justify-center">
            <h3 className="font-semibold mb-3 self-start">Response Breakdown</h3>
            <svg viewBox="0 0 180 180" className="w-44 h-44">
              <circle cx="90" cy="90" r="70" fill="none" stroke="#222" strokeWidth="18" />
              <circle cx="90" cy="90" r="70" fill="none" stroke="#2ecc71" strokeWidth="18"
                strokeDasharray={`${2 * Math.PI * 70}`} strokeDashoffset={arc(cFrac)} transform="rotate(-90 90 90)" />
              <circle cx="90" cy="90" r="70" fill="none" stroke="#e63946" strokeWidth="18"
                strokeDasharray={`${(wFrac/100) * 2 * Math.PI * 70} ${2 * Math.PI * 70}`}
                transform={`rotate(${(cFrac/100)*360 - 90} 90 90)`} />
              <circle cx="90" cy="90" r="70" fill="none" stroke="#666" strokeWidth="18"
                strokeDasharray={`${(uFrac/100) * 2 * Math.PI * 70} ${2 * Math.PI * 70}`}
                transform={`rotate(${((cFrac+wFrac)/100)*360 - 90} 90 90)`} />
              <text x="90" y="86" textAnchor="middle" className="fill-white" fontSize="22" fontWeight="700">{total.c}</text>
              <text x="90" y="105" textAnchor="middle" className="fill-white/60" fontSize="10">correct</text>
            </svg>
            <div className="flex gap-3 text-xs mt-3">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Correct {total.c}</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#e63946]" /> Wrong {total.w}</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-gray-500" /> Skipped {total.u}</span>
            </div>
            <div className="text-xs text-white/60 mt-3">Time taken: <span className="font-mono text-white">{formatHHMMSS(att.timeSpentSeconds)}</span></div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button onClick={() => navigate(`/mock-test-solutions/${resultId}`)} className="bg-green-600 hover:bg-green-700">
            <Eye className="w-4 h-4 mr-2" /> View Solutions
          </Button>
          <Button onClick={() => navigate(`/mock-test/instructions/${resultId}`)} variant="outline" className="border-white/20 text-white hover:bg-white/10">
            <RotateCcw className="w-4 h-4 mr-2" /> Reattempt
          </Button>
          <Button onClick={() => navigate("/")} className="bg-[#e63946] hover:bg-[#d62c39]">
            <Home className="w-4 h-4 mr-2" /> Home
          </Button>
        </div>
      </div>
    </div>
  );
}
