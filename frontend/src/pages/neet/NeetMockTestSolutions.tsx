import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LatexRenderer } from "@/components/LatexRenderer";
import { getStoredRecord, fetchPaperByShift, parseOptions, type NeetQuestion, SECTION_KEYS, SECTION_LABELS, type SectionKey } from "./neetMockUtils";
import { ArrowLeft, Loader2, Search, ChevronDown, ChevronUp } from "lucide-react";

type Filter = "all" | "correct" | "wrong" | "unattempted" | "marked";

export default function NeetMockTestSolutions() {
  const { resultId } = useParams<{ resultId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rec, setRec] = useState<any>(null);
  const [paper, setPaper] = useState<NeetQuestion[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [openIds, setOpenIds] = useState<Set<number>>(new Set());
  const [sectionFilter, setSectionFilter] = useState<SectionKey | "all">("all");

  useEffect(() => {
    (async () => {
      if (!resultId) return;
      const r = getStoredRecord(resultId);
      setRec(r);
      if (r) {
        const p = await fetchPaperByShift(r.examShift);
        if (p) setPaper(p.all);
      }
      setLoading(false);
    })();
  }, [resultId]);

  const att = rec?.attempts?.[rec.bestAttemptIndex];

  const filtered = useMemo(() => {
    if (!att) return [];
    let sectionIds: number[] | null = null;
    if (sectionFilter !== "all") sectionIds = att.sectionMap[sectionFilter];

    return paper.filter((q) => {
      if (sectionIds && !sectionIds.includes(q.id)) return false;
      const ans = att.answers[q.id] ?? null;
      const flagged = (att.flagged || []).includes(q.id);
      if (filter === "correct" && !(ans && ans === q.correct_answer)) return false;
      if (filter === "wrong" && !(ans && ans !== q.correct_answer)) return false;
      if (filter === "unattempted" && ans) return false;
      if (filter === "marked" && !flagged) return false;
      if (search && !q.question_text.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [paper, att, filter, search, sectionFilter]);

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-[#e63946]" />
    </div>
  );

  if (!rec || !att) return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 text-center">
      <p>No result found.</p>
      <Button onClick={() => navigate("/mock-tests")} className="mt-4">Back</Button>
    </div>
  );

  const sectionOf = (qid: number): SectionKey => {
    for (const k of SECTION_KEYS) if (att.sectionMap[k].includes(qid)) return k;
    return "physics";
  };

  const renderSolution = (sol: string | null) => {
    if (!sol) return (
      <div className="rounded-lg border border-dashed border-white/15 p-4 text-sm text-white/60 text-center">
        Solution will be uploaded soon.
      </div>
    );
    const parts = [
      { key: "Key Concept", text: "" },
      { key: "Explanation", text: "" },
      { key: "Trick Used", text: "" },
      { key: "Formula Used", text: "" },
    ];
    let current = -1;
    let rest = sol;
    parts.forEach((p, i) => {
      const re = new RegExp(`${p.key}\\s*:`, "i");
      const m = rest.match(re);
      if (m && m.index !== undefined) {
        if (current === -1 && m.index > 0) {
          // text before first label goes to Explanation if not set
        }
      }
    });
    // Simpler approach: split by labels
    const labels = ["Key Concept:", "Explanation:", "Trick Used:", "Formula Used:"];
    const buckets: Record<string, string> = {};
    let work = sol;
    // tokenize
    const re = /(Key Concept:|Explanation:|Trick Used:|Formula Used:)/gi;
    const splits = work.split(re);
    let curLabel = "Explanation:";
    let buffer = "";
    for (const piece of splits) {
      if (labels.includes(piece.replace(/\s+/g, " ").trim() as any) || /^(key concept|explanation|trick used|formula used):$/i.test(piece.trim())) {
        if (buffer.trim()) buckets[curLabel] = (buckets[curLabel] || "") + buffer.trim();
        curLabel = piece.trim().replace(/^\w/, c => c.toUpperCase());
        // normalize
        const lower = curLabel.toLowerCase();
        if (lower.startsWith("key")) curLabel = "Key Concept:";
        else if (lower.startsWith("expl")) curLabel = "Explanation:";
        else if (lower.startsWith("trick")) curLabel = "Trick Used:";
        else if (lower.startsWith("formula")) curLabel = "Formula Used:";
        buffer = "";
      } else {
        buffer += piece;
      }
    }
    if (buffer.trim()) buckets[curLabel] = (buckets[curLabel] || "") + buffer.trim();

    const colors: Record<string, string> = {
      "Key Concept:": "border-blue-500/30 bg-blue-500/5",
      "Explanation:": "border-white/15 bg-white/5",
      "Trick Used:": "border-yellow-500/30 bg-yellow-500/5",
      "Formula Used:": "border-green-500/30 bg-green-500/5",
    };

    const ordered = ["Key Concept:", "Explanation:", "Formula Used:", "Trick Used:"];
    return (
      <div className="space-y-2">
        {ordered.filter(l => buckets[l]).map((l) => (
          <div key={l} className={`rounded-lg border p-3 ${colors[l]}`}>
            <div className="text-xs font-semibold mb-1 text-white/80">{l.replace(":", "")}</div>
            <LatexRenderer content={buckets[l]} className="text-sm text-white/85 whitespace-pre-wrap" />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Navbar />
      <div className="pt-20 pb-12 px-3 md:px-6 max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(`/mock-test/result/${resultId}`)} className="mb-3 text-white/70">
          <ArrowLeft className="w-4 h-4 mr-2" /> Result
        </Button>
        <h1 className="text-2xl font-bold mb-1">Solution Review</h1>
        <p className="text-white/60 text-sm mb-4">{rec.examShift}</p>

        <div className="flex flex-wrap gap-2 mb-3">
          {(["all", "correct", "wrong", "unattempted", "marked"] as Filter[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border ${filter === f ? "bg-[#e63946] border-[#e63946] text-white" : "bg-white/5 border-white/15 text-white/70"}`}>
              {f === "all" ? "All" : f[0].toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          <button onClick={() => setSectionFilter("all")}
            className={`px-3 py-1.5 rounded-full text-xs border ${sectionFilter === "all" ? "bg-white/15 border-white/20" : "bg-white/5 border-white/10 text-white/70"}`}>All Subjects</button>
          {SECTION_KEYS.map(k => (
            <button key={k} onClick={() => setSectionFilter(k)}
              className={`px-3 py-1.5 rounded-full text-xs border ${sectionFilter === k ? "bg-white/15 border-white/20" : "bg-white/5 border-white/10 text-white/70"}`}>
              {SECTION_LABELS[k]}
            </button>
          ))}
        </div>

        <div className="relative mb-4">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search questions..." className="pl-9 bg-white/5 border-white/15 text-white" />
        </div>

        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="rounded-xl border border-white/10 bg-[#111] p-8 text-center text-white/60 text-sm">No questions match this filter.</div>
          )}
          {filtered.map((q, idx) => {
            const ans = att.answers[q.id] ?? null;
            const isCorrect = ans && ans === q.correct_answer;
            const opts = parseOptions(q.options_list);
            const open = openIds.has(q.id);
            const sec = sectionOf(q.id);
            return (
              <div key={q.id} className="rounded-xl border border-white/10 bg-[#111] p-4">
                <div className="flex items-center justify-between mb-2 text-xs text-white/60">
                  <span>Q{idx + 1} · {SECTION_LABELS[sec]}</span>
                  <span className={`px-2 py-0.5 rounded-full ${ans ? (isCorrect ? "bg-green-500/15 text-green-400" : "bg-[#e63946]/15 text-[#e63946]") : "bg-white/10 text-white/60"}`}>
                    {ans ? (isCorrect ? "Correct" : "Wrong") : "Unattempted"}
                  </span>
                </div>
                <LatexRenderer content={q.question_text} className="text-sm text-white mb-3" />
                {q.question_image_url && <img src={q.question_image_url} alt="" className="rounded-lg mb-3 max-h-64" />}
                <div className="space-y-1.5 mb-2">
                  {opts.map((o) => {
                    const isAns = o.letter === q.correct_answer;
                    const isUser = o.letter === ans;
                    let cls = "border-white/10 bg-white/5";
                    if (isAns) cls = "border-green-500/40 bg-green-500/10";
                    else if (isUser && !isCorrect) cls = "border-[#e63946]/40 bg-[#e63946]/10";
                    return (
                      <div key={o.letter} className={`p-2.5 rounded-lg border text-sm flex items-start gap-2 ${cls}`}>
                        <span className="font-bold w-5">{o.letter}.</span>
                        <span className="flex-1"><LatexRenderer content={String(o.text)} /></span>
                        {isAns && <span className="text-[10px] text-green-400 font-semibold">CORRECT</span>}
                        {isUser && !isCorrect && <span className="text-[10px] text-[#e63946] font-semibold">YOURS</span>}
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={() => setOpenIds((p) => { const n = new Set(p); n.has(q.id) ? n.delete(q.id) : n.add(q.id); return n; })}
                  className="text-xs text-[#e63946] flex items-center gap-1 mt-2"
                >
                  {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />} View Solution
                </button>
                {open && <div className="mt-3">{renderSolution(q.solution)}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
