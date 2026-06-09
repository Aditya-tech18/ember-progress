import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { LatexRenderer } from "@/components/LatexRenderer";
import {
  DURATION_SECONDS,
  SECTION_KEYS, SECTION_LABELS, type SectionKey,
  type NeetSectionedQuestions, type NeetQuestion,
  fetchPaperByShift, parseOptions, formatHHMMSS,
  getStartTimestamp, setStartTimestamp, clearStartTimestamp,
  persistInProgressAnswers, loadInProgressAnswers,
  computeAttempt, getStoredRecord, saveRecord, upsertLeaderboard,
} from "./neetMockUtils";
import { Loader2, ChevronUp, ChevronDown, AlertTriangle } from "lucide-react";

export default function NeetMockTest() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [test, setTest] = useState<any>(null);
  const [paper, setPaper] = useState<NeetSectionedQuestions | null>(null);
  const [section, setSection] = useState<SectionKey>("physics");
  const [indexInSection, setIndexInSection] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string | null>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [visited, setVisited] = useState<Set<number>>(new Set());
  const [now, setNow] = useState(Date.now());
  const [showPalette, setShowPalette] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [warned5, setWarned5] = useState(false);
  const [warningOpen, setWarningOpen] = useState(false);
  const submittedRef = useRef(false);

  // Load test + paper
  useEffect(() => {
    (async () => {
      if (!testId) return;
      const { data: t } = await supabase.from("neet_mock_tests").select("*").eq("test_id", testId).maybeSingle();
      if (!t) { setLoading(false); return; }
      setTest(t);
      const p = await fetchPaperByShift(t.exam_shift);
      setPaper(p);

      // start timer
      let start = getStartTimestamp(testId);
      if (!start) {
        start = Date.now();
        setStartTimestamp(testId, start);
      }

      const saved = loadInProgressAnswers(testId);
      if (saved) {
        setAnswers(saved.answers || {});
        setFlagged(new Set(saved.flagged || []));
        setVisited(new Set(saved.visited || []));
      }

      setLoading(false);
    })();
    // eslint-disable-next-line
  }, [testId]);

  // Tick
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  const start = testId ? getStartTimestamp(testId) : null;
  const elapsed = start ? Math.floor((now - start) / 1000) : 0;
  const timeLeft = Math.max(0, DURATION_SECONDS - elapsed);
  const isCritical = timeLeft <= 5 * 60;

  // 5-minute warning
  useEffect(() => {
    if (!warned5 && timeLeft <= 5 * 60 && timeLeft > 0) {
      setWarned5(true);
      setWarningOpen(true);
    }
    if (timeLeft <= 0 && !submittedRef.current && paper) {
      submittedRef.current = true;
      handleSubmit();
    }
    // eslint-disable-next-line
  }, [timeLeft, paper]);

  // Persist
  useEffect(() => {
    if (!testId) return;
    persistInProgressAnswers(testId, {
      answers, flagged: Array.from(flagged), visited: Array.from(visited),
    });
  }, [answers, flagged, visited, testId]);

  const sectionQs = useMemo<NeetQuestion[]>(() => {
    if (!paper) return [];
    return paper[section];
  }, [paper, section]);

  const currentQ = sectionQs[indexInSection];

  // Mark visited
  useEffect(() => {
    if (currentQ) {
      setVisited((prev) => {
        if (prev.has(currentQ.id)) return prev;
        const n = new Set(prev); n.add(currentQ.id); return n;
      });
    }
  }, [currentQ?.id]);

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-[#e63946]" />
    </div>
  );

  if (!test || !paper) return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-6 text-center">
      <div>
        <p className="mb-4">This paper isn't fully uploaded yet (needs exactly 45 Physics, 45 Chemistry, 45 Botany, 45 Zoology).</p>
        <Button onClick={() => navigate("/mock-tests")}>Back to Mock Tests</Button>
      </div>
    </div>
  );

  const selectAnswer = (letter: string) => {
    if (!currentQ) return;
    setAnswers((a) => ({ ...a, [currentQ.id]: letter }));
  };
  const clearResponse = () => {
    if (!currentQ) return;
    setAnswers((a) => ({ ...a, [currentQ.id]: null }));
  };
  const toggleFlag = () => {
    if (!currentQ) return;
    setFlagged((f) => {
      const n = new Set(f);
      if (n.has(currentQ.id)) n.delete(currentQ.id); else n.add(currentQ.id);
      return n;
    });
  };
  const goPrev = () => {
    if (indexInSection > 0) setIndexInSection(indexInSection - 1);
    else {
      const i = SECTION_KEYS.indexOf(section);
      if (i > 0) { setSection(SECTION_KEYS[i - 1]); setIndexInSection(44); }
    }
  };
  const saveAndNext = () => {
    if (indexInSection < sectionQs.length - 1) setIndexInSection(indexInSection + 1);
    else {
      const i = SECTION_KEYS.indexOf(section);
      if (i < SECTION_KEYS.length - 1) { setSection(SECTION_KEYS[i + 1]); setIndexInSection(0); }
    }
  };

  const handleSubmit = async () => {
    if (!paper || !testId || !test) return;
    setSubmitOpen(false);
    const timeSpent = Math.min(DURATION_SECONDS, elapsed);
    const existing = getStoredRecord(testId);
    const attemptNumber = (existing?.attempts.length ?? 0) + 1;
    const attempt = computeAttempt(paper, answers, timeSpent, attemptNumber);
    attempt.flagged = Array.from(flagged);
    const attempts = [...(existing?.attempts ?? []), attempt];
    const bestIndex = attempts.reduce((bestI, a, i) => (a.totalScore > attempts[bestI].totalScore ? i : bestI), 0);
    const rec = {
      testId,
      examShift: test.exam_shift,
      examYear: test.exam_year,
      attempts,
      bestScore: attempts[bestIndex].totalScore,
      bestAttemptIndex: bestIndex,
    };
    saveRecord(rec);
    clearStartTimestamp(testId);
    await upsertLeaderboard(testId, rec.bestScore);
    navigate(`/mock-test/result/${testId}`);
  };

  const opts = parseOptions(currentQ?.options_list);
  const selected = currentQ ? answers[currentQ.id] : null;

  const bubbleColor = (q: NeetQuestion) => {
    const ans = answers[q.id] ?? null;
    const isFlag = flagged.has(q.id);
    const isVis = visited.has(q.id);
    if (isFlag && ans) return { bg: "#9b59b6", fg: "#fff" };
    if (isFlag) return { bg: "#e63946", fg: "#fff" };
    if (ans) return { bg: "#2ecc71", fg: "#fff" };
    if (isVis) return { bg: "#f39c12", fg: "#fff" };
    return { bg: "#2d2d2d", fg: "#bbb" };
  };

  const stats = SECTION_KEYS.reduce((acc, k) => {
    const qs = paper[k];
    acc[k] = {
      answered: qs.filter((q) => answers[q.id]).length,
      total: qs.length,
    };
    return acc;
  }, {} as Record<SectionKey, { answered: number; total: number }>);

  const summary = {
    answered: Object.values(answers).filter(Boolean).length,
    flagged: flagged.size,
    notAnswered: 180 - Object.values(answers).filter(Boolean).length,
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Top bar */}
      <div className="border-b border-white/10 bg-[#111] px-3 md:px-5 py-2 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm md:text-base font-semibold truncate">{test.title}</div>
          <div className="text-[10px] text-white/50">NEET · NTA Pattern</div>
        </div>
        <div className={`px-3 py-1.5 rounded-full font-mono text-sm font-bold border ${isCritical ? "bg-[#e63946] border-[#e63946] text-white animate-pulse" : "bg-white/5 border-white/10 text-white"}`}>
          {formatHHMMSS(timeLeft)}
        </div>
      </div>

      {/* Section tabs */}
      <div className="border-b border-white/10 bg-[#0d0d0d] overflow-x-auto">
        <div className="flex min-w-max">
          {SECTION_KEYS.map((k) => (
            <button
              key={k}
              onClick={() => { setSection(k); setIndexInSection(0); }}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${section === k ? "border-[#e63946] text-white" : "border-transparent text-white/55 hover:text-white"}`}
            >
              {SECTION_LABELS[k]}
              <span className="ml-2 text-[10px] text-white/40">{stats[k].answered}/{stats[k].total}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Mobile palette toggle */}
        <div className="lg:hidden border-b border-white/10 bg-[#0d0d0d]">
          <button onClick={() => setShowPalette((s) => !s)} className="w-full px-4 py-2 text-sm flex items-center justify-between">
            <span className="font-medium">Question Palette · {SECTION_LABELS[section]}</span>
            {showPalette ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showPalette && (
            <div className="px-3 pb-3 grid grid-cols-10 gap-1.5">
              {sectionQs.map((q, i) => {
                const c = bubbleColor(q);
                return (
                  <button key={q.id} onClick={() => { setIndexInSection(i); setShowPalette(false); }}
                    className={`h-8 rounded text-[11px] font-semibold border ${i === indexInSection ? "ring-2 ring-white" : ""}`}
                    style={{ background: c.bg, color: c.fg, borderColor: c.bg }}>
                    {i + 1}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Question area */}
        <div className="flex-1 p-4 md:p-6 pb-32 lg:pb-6 overflow-y-auto">
          {currentQ ? (
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-[#e63946] text-white flex items-center justify-center text-sm font-bold">
                    {indexInSection + 1}
                  </div>
                  <div className="text-xs text-white/50">{SECTION_LABELS[section]} · Q.{indexInSection + 1} of 45</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-white/80 line-clamp-1 max-w-[180px] md:max-w-none">{currentQ.chapter || "—"}</div>
                  <div className="text-[10px] text-white/40">{currentQ.exam_year} · {currentQ.exam_shift}</div>
                </div>
              </div>

              <div className={`rounded-xl border p-4 md:p-5 mb-4 transition-colors ${
                flagged.has(currentQ.id)
                  ? "bg-yellow-400/10 border-yellow-400/60 shadow-[0_0_24px_-6px_rgba(250,204,21,0.45)]"
                  : "bg-[#111] border-white/10"
              }`}>
                <LatexRenderer content={currentQ.question_text} className="text-[15px] md:text-base leading-relaxed text-white" />
                {currentQ.question_image_url && (
                  <img src={currentQ.question_image_url} alt="question" className="mt-4 rounded-lg max-h-80 mx-auto" />
                )}
              </div>

              <div className="space-y-2">
                {opts.map((o) => {
                  const isSel = selected === o.letter;
                  return (
                    <button
                      key={o.letter}
                      onClick={() => selectAnswer(o.letter)}
                      className={`w-full text-left p-3 md:p-4 rounded-xl border flex items-start gap-3 transition-all ${isSel ? "border-[#e63946] bg-[#e63946]/10" : "border-white/10 bg-[#111] hover:border-white/30"}`}
                    >
                      <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${isSel ? "bg-[#e63946] text-white" : "bg-white/10 text-white/80"}`}>{o.letter}</span>
                      <span className="text-[14px] md:text-[15px] text-white/90 leading-relaxed flex-1 pt-0.5">
                        <LatexRenderer content={String(o.text)} />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        {/* Desktop palette */}
        <aside className="hidden lg:flex flex-col w-[300px] border-l border-white/10 bg-[#0d0d0d] p-4 overflow-y-auto">
          <div className="text-sm font-semibold mb-3">{SECTION_LABELS[section]} Palette</div>
          <div className="grid grid-cols-6 gap-2 mb-4">
            {sectionQs.map((q, i) => {
              const c = bubbleColor(q);
              return (
                <button key={q.id} onClick={() => setIndexInSection(i)}
                  className={`h-9 rounded text-xs font-semibold border ${i === indexInSection ? "ring-2 ring-white" : ""}`}
                  style={{ background: c.bg, color: c.fg, borderColor: c.bg }}>
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div className="text-xs space-y-1.5 text-white/70 mb-4">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded" style={{ background: "#2ecc71" }} /> Answered</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded" style={{ background: "#e63946" }} /> Marked</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded" style={{ background: "#9b59b6" }} /> Marked & Answered</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded" style={{ background: "#f39c12" }} /> Visited</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded" style={{ background: "#2d2d2d" }} /> Not visited</div>
          </div>
          <Button onClick={() => setSubmitOpen(true)} className="mt-auto bg-[#e63946] hover:bg-[#d62c39]">Submit Test</Button>
        </aside>
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:right-[300px] bg-[#111] border-t border-white/10 px-2 py-2 flex items-center gap-1.5 z-30 pb-[max(env(safe-area-inset-bottom),12px)]">
        <Button onClick={goPrev} variant="outline" className="border-white/20 text-white hover:bg-white/10 flex-1 h-11 text-xs md:text-sm px-2">Previous</Button>
        <Button onClick={toggleFlag} variant="outline" className="border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10 flex-1 h-11 text-xs md:text-sm px-2">
          {currentQ && flagged.has(currentQ.id) ? "Unmark" : "Mark"}
        </Button>
        <Button onClick={clearResponse} variant="outline" className="border-white/20 text-white hover:bg-white/10 flex-1 h-11 text-xs md:text-sm px-2">Clear</Button>
        <Button onClick={saveAndNext} className="bg-[#e63946] hover:bg-[#d62c39] flex-1 h-11 text-xs md:text-sm px-2">Save & Next</Button>
        <Button onClick={() => setSubmitOpen(true)} className="lg:hidden bg-green-600 hover:bg-green-700 h-11 text-xs px-3">Submit</Button>
      </div>

      <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
        <DialogContent className="bg-[#111] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Submit Test?</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm text-white/80">
            <div className="flex justify-between"><span>Answered</span><span className="font-semibold text-green-400">{summary.answered}</span></div>
            <div className="flex justify-between"><span>Unanswered</span><span className="font-semibold text-orange-400">{summary.notAnswered}</span></div>
            <div className="flex justify-between"><span>Marked for Review</span><span className="font-semibold text-[#e63946]">{summary.flagged}</span></div>
            <p className="text-xs text-white/50 mt-3">Once submitted, this attempt is locked. Your score will be saved.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubmitOpen(false)} className="border-white/20 text-white hover:bg-white/10">Cancel</Button>
            <Button onClick={handleSubmit} className="bg-[#e63946] hover:bg-[#d62c39]">Submit Final</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={warningOpen} onOpenChange={setWarningOpen}>
        <DialogContent className="bg-[#111] border-yellow-500/40 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-yellow-400" /> 5 minutes left</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-white/80">Please review your answers. The test will auto-submit when the timer reaches zero.</p>
          <DialogFooter>
            <Button onClick={() => setWarningOpen(false)} className="bg-[#e63946] hover:bg-[#d62c39]">Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
