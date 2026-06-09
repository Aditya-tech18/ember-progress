import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Rocket, Loader2 } from "lucide-react";

export default function NeetMockTestInstructions() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const [accepted, setAccepted] = useState(false);
  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("neet_mock_tests").select("*").eq("test_id", testId).maybeSingle();
      setTest(data);
      setLoading(false);
    })();
  }, [testId]);

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-[#e63946]" />
    </div>
  );

  if (!test) return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <p>Test not found.</p>
      <Button onClick={() => navigate("/mock-tests")} className="mt-4">Back</Button>
    </div>
  );

  const rows = [
    { sub: "Physics", q: 45, m: 180 },
    { sub: "Chemistry", q: 45, m: 180 },
    { sub: "Botany", q: 45, m: 180 },
    { sub: "Zoology", q: 45, m: 180 },
  ];

  const legend = [
    { color: "#2ecc71", label: "Answered" },
    { color: "#e63946", label: "Marked for Review" },
    { color: "#f39c12", label: "Visited but not answered" },
    { color: "#2d2d2d", border: "#444", label: "Not visited" },
    { color: "#9b59b6", label: "Marked & Answered" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Navbar />
      <div className="pt-20 pb-12 px-4 max-w-3xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/mock-tests")} className="mb-4 text-white/70">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-white/10 bg-[#111] p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold">{test.title}</h1>
            <p className="text-white/60 text-sm mt-1">National Testing Agency · Computer Based Test</p>
          </div>

          <h2 className="font-semibold mb-3">Paper Pattern</h2>
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm border border-white/10 rounded-lg overflow-hidden">
              <thead className="bg-white/5">
                <tr>
                  <th className="text-left p-3">Subject</th>
                  <th className="p-3">Questions</th>
                  <th className="p-3">Max Marks</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.sub} className="border-t border-white/10">
                    <td className="p-3">{r.sub}</td>
                    <td className="p-3 text-center">{r.q}</td>
                    <td className="p-3 text-center">{r.m}</td>
                  </tr>
                ))}
                <tr className="border-t border-white/10 bg-white/5 font-semibold">
                  <td className="p-3">Total</td>
                  <td className="p-3 text-center">180</td>
                  <td className="p-3 text-center">720</td>
                </tr>
              </tbody>
            </table>
            <div className="text-center text-white/60 text-xs mt-2">Duration: 200 minutes (3 hours 20 minutes)</div>
          </div>

          <h2 className="font-semibold mb-3">General Instructions</h2>
          <ol className="list-decimal pl-5 space-y-1.5 text-sm text-white/75 mb-6">
            <li>Read each question carefully before answering. Attempt all 180 questions.</li>
            <li>The clock has been set at the server and the countdown timer will display the remaining time on top right.</li>
            <li>Use of calculators, log tables or any electronic devices is strictly prohibited.</li>
            <li>In the actual exam you would use a blue/black pen on the OMR sheet. Here, click an option to select it.</li>
            <li>You can navigate freely across questions and sections using the palette.</li>
          </ol>

          <h2 className="font-semibold mb-3">Marking Scheme</h2>
          <div className="grid grid-cols-3 gap-2 mb-6 text-center text-sm">
            <div className="rounded-lg bg-green-500/10 border border-green-500/30 p-3">
              <div className="text-xl font-bold text-green-400">+4</div>
              <div className="text-xs text-white/60">Correct</div>
            </div>
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3">
              <div className="text-xl font-bold text-[#e63946]">-1</div>
              <div className="text-xs text-white/60">Wrong</div>
            </div>
            <div className="rounded-lg bg-white/5 border border-white/15 p-3">
              <div className="text-xl font-bold text-white/70">0</div>
              <div className="text-xs text-white/60">Skipped</div>
            </div>
          </div>

          <h2 className="font-semibold mb-3">Question Palette Legend</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
            {legend.map((l) => (
              <div key={l.label} className="flex items-center gap-2 text-xs text-white/75">
                <span className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold border"
                  style={{ background: l.color, borderColor: (l as any).border || l.color }}>
                  {""}
                </span>
                {l.label}
              </div>
            ))}
          </div>

          <label className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/15 mb-5 cursor-pointer">
            <Checkbox checked={accepted} onCheckedChange={(v) => setAccepted(!!v)} className="mt-0.5" />
            <span className="text-sm text-white/85">I have read and understood all the instructions. I declare that I am the same candidate whose details are mentioned above.</span>
          </label>

          <Button
            disabled={!accepted}
            onClick={() => navigate(`/mock-test/${testId}`)}
            className="w-full bg-[#e63946] hover:bg-[#d62c39] disabled:opacity-40 disabled:cursor-not-allowed h-12 text-base font-semibold"
          >
            <Rocket className="w-5 h-5 mr-2" /> Start Test
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
