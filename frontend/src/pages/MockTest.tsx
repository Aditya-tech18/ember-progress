/**
 * MockTest — JEE NTA CBT–style interface
 * Mirrors the real NTA CBT layout: orange header, subject tabs,
 * right-side question palette with status legend, bottom nav.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LatexRenderer } from "@/components/LatexRenderer";
import { toast } from "sonner";
import { getCachedGoal } from "@/utils/examConfig";
import { Loader2, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";

/* ─── Types ─────────────────────────────────────────── */
interface Question {
  id: number;
  subject: string;
  chapter: string;
  question_text: string;
  options_list: string | null;
  correct_answer: string;
  solution: string;
  question_image_url: string | null;
  exam_year: number;
  exam_shift: string;
}

type QuestionStatus = "not-visited" | "not-answered" | "answered" | "marked" | "answered-marked";

interface AnswerState {
  value: string | null;
  marked: boolean;
  visited: boolean;
}

/* ─── Constants ─────────────────────────────────────── */
const SECTION_A_SIZE_JEE = 20;
const MAX_SECTION_B_ATTEMPTS_JEE = 5;
const JEE_DURATION = 3 * 60 * 60; // 3 hrs in seconds

function isIntegerQuestion(opts: any): boolean {
  if (opts === null || opts === undefined) return true;
  if (typeof opts === "string") {
    const s = opts.trim();
    if (s === "" || s === "{}" || s === "null") return true;
    try {
      const parsed = JSON.parse(s);
      return !parsed || (typeof parsed === "object" && Object.keys(parsed).length === 0);
    } catch { return false; }
  }
  if (typeof opts === "object") return Object.keys(opts).length === 0;
  return false;
}

function parseOptions(optionsList: string | null): Record<string, string> {
  if (!optionsList) return {};
  try {
    const parsed = typeof optionsList === "string" ? JSON.parse(optionsList) : optionsList;
    if (parsed && typeof parsed === "object" && Object.keys(parsed).length > 0) return parsed;
  } catch { /* ignore */ }
  return {};
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatHHMMSS(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

/* ─── Status helpers ──────────────────────────────── */
function getStatus(a: AnswerState): QuestionStatus {
  if (!a.visited) return "not-visited";
  if (a.marked && a.value) return "answered-marked";
  if (a.marked) return "marked";
  if (a.value) return "answered";
  return "not-answered";
}

const STATUS_STYLE: Record<QuestionStatus, string> = {
  "not-visited":    "bg-[#808080] text-white",
  "not-answered":   "bg-[#E74C3C] text-white",
  "answered":       "bg-[#27AE60] text-white",
  "marked":         "bg-[#8E44AD] text-white",
  "answered-marked":"bg-[#8E44AD] text-white relative",
};

/* ─── Subject tab colors ─────────────────────────── */
const SUBJECT_COLORS: Record<string, string> = {
  Physics: "#1565C0",
  Chemistry: "#2E7D32",
  Mathematics: "#E65100",
  Biology: "#2E7D32",
};

/* ──────────────────────────────────────────────────── */
const MockTest = () => {
  const navigate = useNavigate();
  const { testId } = useParams<{ testId: string }>();
  const goal = getCachedGoal();
  const isNEET = goal === "NEET";
  const subjects = isNEET
    ? ["Physics", "Chemistry", "Biology"]
    : ["Physics", "Chemistry", "Mathematics"];

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<number, AnswerState>>(new Map());
  const [timeLeft, setTimeLeft] = useState(isNEET ? 200 * 60 : JEE_DURATION);
  const [selectedSubject, setSelectedSubject] = useState("Physics");
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false); // mobile palette toggle
  const [candidateName, setCandidateName] = useState("Aspirant");
  const submittedRef = useRef(false);

  /* ── Load user name ── */
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.full_name) setCandidateName(user.user_metadata.full_name);
      else if (user?.email) setCandidateName(user.email.split("@")[0]);
    });
  }, []);

  /* ── Timer countdown ── */
  useEffect(() => {
    const id = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { handleAutoSubmit(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  /* ── Fetch questions ── */
  useEffect(() => { fetchQuestions(); }, [testId]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      if (isNEET) {
        const yearMatch = testId?.match(/(\d{4})/);
        const year = yearMatch ? parseInt(yearMatch[1]) : null;
        if (!year) { toast.error("Invalid test ID"); return; }
        const { data, error } = await supabase
          .from("neet_questions").select("*")
          .eq("exam_year", year).order("subject").order("id");
        if (error) throw error;
        const subjectOrder = ["Physics", "Chemistry", "Biology"];
        const sorted = (data || []).sort((a: any, b: any) => {
          const ai = subjectOrder.indexOf(a.subject || "");
          const bi = subjectOrder.indexOf(b.subject || "");
          return ai !== bi ? ai - bi : a.id - b.id;
        });
        initQuestions(sorted.map((q: any) => ({ ...q, subject: q.subject || "Physics" })));
      } else {
        const shift = decodeURIComponent(testId || "");
        if (!shift) { toast.error("Invalid test"); return; }
        const { data: shiftData, error } = await supabase
          .from("questions").select("*")
          .eq("exam_shift", shift)
          .in("subject", ["Physics", "Chemistry", "Mathematics"]);
        if (error) throw error;
        const sortedQuestions: Question[] = [];
        for (const subj of ["Physics", "Chemistry", "Mathematics"]) {
          const subjQs = (shiftData || []).filter((q: any) => q.subject === subj);
          const mcqs = subjQs.filter((q: any) => !isIntegerQuestion(q.options_list)).slice(0, 20);
          let integers = subjQs.filter((q: any) => isIntegerQuestion(q.options_list)).slice(0, 10);
          if (integers.length < 10) {
            const needed = 10 - integers.length;
            const { data: pool } = await supabase.from("questions").select("*")
              .eq("subject", subj).neq("exam_shift", shift);
            const extra = shuffleArray((pool || []).filter((q: any) => isIntegerQuestion(q.options_list))).slice(0, needed);
            integers = [...integers, ...extra];
          }
          [...mcqs, ...integers].forEach((q: any) => sortedQuestions.push({ ...q, subject: subj }));
        }
        initQuestions(sortedQuestions);
      }
    } catch (err) {
      console.error("Error fetching questions:", err);
      toast.error("Failed to load test questions");
    } finally {
      setLoading(false);
    }
  };

  const initQuestions = (qs: Question[]) => {
    setQuestions(qs);
    const init = new Map<number, AnswerState>();
    qs.forEach(q => init.set(q.id, { value: null, marked: false, visited: false }));
    setAnswers(init);
    if (qs.length > 0) {
      // Mark first question as visited
      init.set(qs[0].id, { value: null, marked: false, visited: true });
      setAnswers(new Map(init));
    }
  };

  /* ── Navigation helpers ── */
  const currentQuestion = questions[currentIndex];

  const subjectQuestions = useCallback((subj: string) =>
    questions.filter(q => q.subject === subj), [questions]);

  const goToQuestion = (q: Question) => {
    const idx = questions.indexOf(q);
    if (idx === -1) return;
    setCurrentIndex(idx);
    setSelectedSubject(q.subject);
    // mark as visited
    setAnswers(prev => {
      const next = new Map(prev);
      const cur = next.get(q.id) || { value: null, marked: false, visited: false };
      next.set(q.id, { ...cur, visited: true });
      return next;
    });
  };

  const goNext = () => {
    if (currentIndex < questions.length - 1) goToQuestion(questions[currentIndex + 1]);
  };
  const goPrev = () => {
    if (currentIndex > 0) goToQuestion(questions[currentIndex - 1]);
  };

  /* ── Answer handlers ── */
  const handleSelect = (optKey: string) => {
    if (!currentQuestion) return;
    setAnswers(prev => {
      const next = new Map(prev);
      const cur = next.get(currentQuestion.id)!;
      next.set(currentQuestion.id, { ...cur, value: cur.value === optKey ? null : optKey });
      return next;
    });
  };

  const handleNumerical = (val: string) => {
    if (!currentQuestion) return;
    setAnswers(prev => {
      const next = new Map(prev);
      const cur = next.get(currentQuestion.id)!;
      next.set(currentQuestion.id, { ...cur, value: val });
      return next;
    });
  };

  const handleSaveAndNext = () => {
    goNext();
  };

  const handleMarkForReview = () => {
    if (!currentQuestion) return;
    setAnswers(prev => {
      const next = new Map(prev);
      const cur = next.get(currentQuestion.id)!;
      next.set(currentQuestion.id, { ...cur, marked: true, visited: true });
      return next;
    });
    goNext();
  };

  const handleSaveMarkForReview = () => {
    if (!currentQuestion) return;
    setAnswers(prev => {
      const next = new Map(prev);
      const cur = next.get(currentQuestion.id)!;
      next.set(currentQuestion.id, { ...cur, marked: true, visited: true });
      return next;
    });
    goNext();
  };

  const handleClearResponse = () => {
    if (!currentQuestion) return;
    setAnswers(prev => {
      const next = new Map(prev);
      const cur = next.get(currentQuestion.id)!;
      next.set(currentQuestion.id, { ...cur, value: null });
      return next;
    });
  };

  /* ── Section B limit (JEE only) ── */
  const sectionBAttempted = (subj: string): number => {
    const sq = subjectQuestions(subj);
    const sectionB = sq.slice(SECTION_A_SIZE_JEE);
    return sectionB.filter(q => answers.get(q.id)?.value?.trim()).length;
  };

  /* ── Submit ── */
  const handleAutoSubmit = () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    doSubmit();
  };

  const doSubmit = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Please login to submit test"); return; }

      let totalScore = 0;
      const subjectScores: Record<string, { score: number; correct: number; wrong: number; unattempted: number }> = {};
      subjects.forEach(s => subjectScores[s] = { score: 0, correct: 0, wrong: 0, unattempted: 0 });

      const counters: Record<string, number> = {};
      questions.forEach(q => {
        counters[q.subject] = (counters[q.subject] ?? 0);
      });
      const subjectIndexMap = new Map<number, number>();
      const ctr: Record<string, number> = {};
      questions.forEach(q => {
        ctr[q.subject] = ctr[q.subject] ?? 0;
        subjectIndexMap.set(q.id, ctr[q.subject]++);
      });

      questions.forEach(q => {
        const ans = answers.get(q.id);
        const userVal = ans?.value?.trim() || "";
        const correct = q.correct_answer?.trim() || "";
        const subj = q.subject;
        const isSectionB = (subjectIndexMap.get(q.id) ?? 0) >= SECTION_A_SIZE_JEE;
        const wrongPenalty = isNEET ? -1 : isSectionB ? 0 : -1;

        if (!userVal) {
          subjectScores[subj].unattempted++;
        } else if (userVal === correct) {
          subjectScores[subj].score += 4; totalScore += 4; subjectScores[subj].correct++;
        } else {
          subjectScores[subj].score += wrongPenalty; totalScore += wrongPenalty; subjectScores[subj].wrong++;
        }
      });

      const totalTime = isNEET ? 200 * 60 : JEE_DURATION;
      const timeSpent = totalTime - timeLeft;
      const physS = subjectScores["Physics"] || { score: 0, correct: 0, wrong: 0, unattempted: 0 };
      const chemS = subjectScores["Chemistry"] || { score: 0, correct: 0, wrong: 0, unattempted: 0 };
      const mathS = subjectScores[isNEET ? "Biology" : "Mathematics"] || { score: 0, correct: 0, wrong: 0, unattempted: 0 };

      const { data: result, error } = await supabase.from("mock_test_results").insert({
        user_id: user.id,
        test_id: `mock_test_${testId}`,
        total_score: totalScore,
        physics_score: physS.score,
        chemistry_score: chemS.score,
        maths_score: mathS.score,
        physics_correct: physS.correct,
        physics_wrong: physS.wrong,
        physics_unattempted: physS.unattempted,
        chemistry_correct: chemS.correct,
        chemistry_wrong: chemS.wrong,
        chemistry_unattempted: chemS.unattempted,
        maths_correct: mathS.correct,
        maths_wrong: mathS.wrong,
        maths_unattempted: mathS.unattempted,
        total_questions_attempted: questions.length - [...answers.values()].filter(a => !a.value).length,
        total_correct: physS.correct + chemS.correct + mathS.correct,
        total_wrong: physS.wrong + chemS.wrong + mathS.wrong,
        total_unattempted: physS.unattempted + chemS.unattempted + mathS.unattempted,
        time_spent_seconds: timeSpent,
      }).select().single();

      if (error) throw error;
      navigate(`/mock-test/result/${result.id}`, { state: { answers: Object.fromEntries(answers), questions } });
    } catch (err) {
      console.error("Error submitting test:", err);
      toast.error("Failed to submit test");
    }
  };

  /* ─────────────── Palette counts ─────────────── */
  const answersArr = [...answers.values()];
  const countNotVisited  = answersArr.filter(a => !a.visited).length;
  const countNotAnswered = answersArr.filter(a => a.visited && !a.value && !a.marked).length;
  const countAnswered    = answersArr.filter(a => a.value && !a.marked).length;
  const countMarked      = answersArr.filter(a => a.marked && !a.value).length;
  const countAnsweredMarked = answersArr.filter(a => a.value && a.marked).length;

  /* ─────────────── Loading ─────────────── */
  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-[#FF6600] animate-spin mx-auto mb-4" />
        <p className="text-gray-600 font-medium">Loading Test Paper...</p>
      </div>
    </div>
  );

  if (!currentQuestion) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 font-medium">No questions available</p>
        <button onClick={() => navigate("/mock-tests")} className="mt-4 px-6 py-2 bg-[#FF6600] text-white rounded font-semibold">
          Go Back
        </button>
      </div>
    </div>
  );

  const opts = parseOptions(currentQuestion.options_list);
  const isNumerical = isIntegerQuestion(currentQuestion.options_list);
  const currentAns = answers.get(currentQuestion.id);
  const curSubjQs = subjectQuestions(selectedSubject);
  const qNumberInSubject = curSubjQs.indexOf(currentQuestion);
  const totalQNum = currentIndex + 1;

  /* ─────────────── Render ─────────────── */
  return (
    <div className="min-h-screen flex flex-col bg-[#f0f0f0] font-sans">

      {/* ═══ TOP HEADER ═══ */}
      <header className="bg-white border-b-2 border-[#FF6600] shadow-sm">
        <div className="flex items-center justify-between px-3 py-2">
          {/* Left: Logo + exam name */}
          <div className="flex items-center gap-2">
            {/* NTA-style orange/green logo */}
            <div className="w-10 h-10 rounded-full bg-[#FF6600] flex items-center justify-center text-white font-black text-xs leading-none overflow-hidden shrink-0">
              <div className="text-center">
                <div className="text-[8px] font-black">NTA</div>
                <div className="text-[6px]">CBT</div>
              </div>
            </div>
            <div>
              <div className="font-black text-[#FF6600] text-sm leading-none">
                {isNEET ? "NEET UG" : "JEE MAIN"}
              </div>
              <div className="text-[10px] text-gray-500">Test Series — Prepixo</div>
            </div>
          </div>

          {/* Right: candidate + timer */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end text-xs text-gray-600">
              <span><b>Candidate:</b> {candidateName}</span>
              <span><b>Subject:</b> {selectedSubject}</span>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-mono font-bold text-sm border-2 ${
              timeLeft < 600 ? "border-red-500 bg-red-50 text-red-600" : "border-[#FF6600] bg-orange-50 text-[#FF6600]"
            }`}>
              ⏱ {formatHHMMSS(timeLeft)}
            </div>
          </div>
        </div>

        {/* Subject tabs row */}
        <div className="flex items-center bg-[#FF6600] overflow-x-auto">
          <div className="px-3 py-2 text-white font-black text-sm whitespace-nowrap">
            {isNEET ? "NEET UG" : "JEE MAIN"}
          </div>
          {subjects.map(subj => (
            <button
              key={subj}
              onClick={() => {
                setSelectedSubject(subj);
                const first = subjectQuestions(subj)[0];
                if (first) goToQuestion(first);
              }}
              className={`px-4 py-2 font-bold text-sm whitespace-nowrap border-l border-orange-400 transition-colors ${
                selectedSubject === subj
                  ? "bg-white text-[#FF6600]"
                  : "text-white hover:bg-orange-500"
              }`}
            >
              {subj.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      {/* ═══ BODY ═══ */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Question Panel ── */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-white">

          {/* Question header */}
          <div className="border-b border-gray-200 px-4 py-2 flex items-center justify-between bg-gray-50">
            <span className="font-bold text-gray-800 text-sm">
              Question {qNumberInSubject >= 0 ? qNumberInSubject + 1 : totalQNum} :
            </span>
            {/* Section A/B indicator */}
            <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
              !isNEET && qNumberInSubject >= SECTION_A_SIZE_JEE
                ? "bg-amber-100 text-amber-700 border border-amber-300"
                : "bg-blue-100 text-blue-700 border border-blue-300"
            }`}>
              {!isNEET
                ? qNumberInSubject >= SECTION_A_SIZE_JEE ? "Section B (Integer)" : "Section A (MCQ)"
                : "MCQ"
              }
            </span>
          </div>

          {/* Question body */}
          <div className="flex-1 px-4 py-4 min-h-0">
            {/* Question image */}
            {currentQuestion.question_image_url && (
              <div className="mb-4 rounded-lg overflow-hidden border border-gray-200">
                <img src={currentQuestion.question_image_url} alt="Question" className="max-w-full h-auto max-h-56 object-contain mx-auto" />
              </div>
            )}

            {/* Question text */}
            <div className="text-gray-800 text-sm leading-relaxed mb-5 font-serif">
              <LatexRenderer content={currentQuestion.question_text} />
            </div>

            {/* Options */}
            {isNumerical ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 font-medium">Enter your numerical answer:</p>
                <input
                  type="text"
                  value={currentAns?.value || ""}
                  onChange={e => handleNumerical(e.target.value)}
                  placeholder="Type or use keypad below..."
                  className="w-full border-2 border-gray-300 focus:border-[#FF6600] rounded px-4 py-3 text-xl font-mono text-center outline-none transition-colors"
                  readOnly
                />
                {/* NTA-style number keypad */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                  <div className="grid grid-cols-5 gap-2 mb-2">
                    {["7","8","9","⌫","C"].map(k => (
                      <button
                        key={k}
                        onClick={() => {
                          if (k === "C") { handleNumerical(""); }
                          else if (k === "⌫") { handleNumerical((currentAns?.value || "").slice(0, -1)); }
                          else { handleNumerical((currentAns?.value || "") + k); }
                        }}
                        className={`h-11 rounded-lg font-bold text-sm transition-all active:scale-95 shadow-sm ${
                          k === "C" ? "bg-red-500 text-white hover:bg-red-600"
                          : k === "⌫" ? "bg-amber-500 text-white hover:bg-amber-600"
                          : "bg-white border border-gray-300 text-gray-800 hover:bg-[#FF6600] hover:text-white hover:border-[#FF6600]"
                        }`}
                      >{k}</button>
                    ))}
                  </div>
                  <div className="grid grid-cols-5 gap-2 mb-2">
                    {["4","5","6","+","-"].map(k => (
                      <button
                        key={k}
                        onClick={() => {
                          if (k === "+" || k === "-") {
                            const cur = currentAns?.value || "";
                            if (k === "-" && !cur.startsWith("-")) handleNumerical("-" + cur);
                            else if (k === "+" && cur.startsWith("-")) handleNumerical(cur.slice(1));
                          } else {
                            handleNumerical((currentAns?.value || "") + k);
                          }
                        }}
                        className={`h-11 rounded-lg font-bold text-sm transition-all active:scale-95 shadow-sm ${
                          k === "+" || k === "-" ? "bg-blue-500 text-white hover:bg-blue-600"
                          : "bg-white border border-gray-300 text-gray-800 hover:bg-[#FF6600] hover:text-white hover:border-[#FF6600]"
                        }`}
                      >{k}</button>
                    ))}
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {["1","2","3","0","."].map(k => (
                      <button
                        key={k}
                        onClick={() => handleNumerical((currentAns?.value || "") + k)}
                        className="h-11 rounded-lg font-bold text-sm bg-white border border-gray-300 text-gray-800 hover:bg-[#FF6600] hover:text-white hover:border-[#FF6600] transition-all active:scale-95 shadow-sm"
                      >{k}</button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(opts).map(([key, val], idx) => {
                  const isSelected = currentAns?.value === key;
                  return (
                    <div
                      key={key}
                      onClick={() => handleSelect(key)}
                      className={`flex items-start gap-3 px-4 py-3 rounded border-2 cursor-pointer transition-all select-none ${
                        isSelected
                          ? "border-[#FF6600] bg-orange-50"
                          : "border-gray-200 hover:border-gray-400 bg-white"
                      }`}
                    >
                      {/* Radio circle */}
                      <div className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                        isSelected ? "border-[#FF6600] bg-[#FF6600]" : "border-gray-400"
                      }`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <div className="flex-1 text-sm text-gray-800">
                        <span className="font-bold mr-2">({idx + 1})</span>
                        <LatexRenderer content={val} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Action buttons (NTA style) ── */}
          <div className="border-t border-gray-200 bg-gray-50 px-3 py-3 space-y-2">
            {/* Row 1 */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleSaveAndNext}
                className="px-4 py-2 bg-[#27AE60] hover:bg-[#219653] text-white font-bold text-xs rounded transition-colors"
              >
                SAVE &amp; NEXT
              </button>
              <button
                onClick={handleSaveMarkForReview}
                className="px-4 py-2 bg-[#8E44AD] hover:bg-[#7D3C98] text-white font-bold text-xs rounded transition-colors"
              >
                SAVE &amp; MARK FOR REVIEW
              </button>
              <button
                onClick={handleClearResponse}
                className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 font-bold text-xs rounded border border-gray-300 transition-colors"
              >
                CLEAR RESPONSE
              </button>
            </div>
            {/* Row 2 */}
            <div className="flex gap-2">
              <button
                onClick={handleMarkForReview}
                className="px-4 py-2 bg-[#2980B9] hover:bg-[#2471A3] text-white font-bold text-xs rounded transition-colors"
              >
                MARK FOR REVIEW &amp; NEXT
              </button>
            </div>
          </div>

          {/* ── Bottom nav ── */}
          <div className="border-t-2 border-gray-300 bg-white px-3 py-2 flex items-center justify-between">
            <button
              onClick={goPrev}
              disabled={currentIndex === 0}
              className="flex items-center gap-1 px-4 py-2 border border-gray-400 rounded font-bold text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> BACK
            </button>

            {/* Mobile palette toggle */}
            <button
              onClick={() => setPaletteOpen(p => !p)}
              className="lg:hidden px-3 py-2 bg-[#FF6600] text-white font-bold text-xs rounded"
            >
              {paletteOpen ? "Hide Palette" : "Question Palette"}
            </button>

            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-5 py-2 bg-[#E74C3C] hover:bg-[#C0392B] text-white font-bold text-sm rounded transition-colors"
            >
              SUBMIT
            </button>

            <button
              onClick={goNext}
              disabled={currentIndex === questions.length - 1}
              className="flex items-center gap-1 px-4 py-2 border border-gray-400 rounded font-bold text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-40 transition-colors"
            >
              NEXT <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Question Palette (right sidebar, desktop) ── */}
        <aside className={`
          w-64 shrink-0 bg-white border-l-2 border-gray-200 flex flex-col overflow-y-auto
          ${paletteOpen ? "fixed inset-0 z-50 w-full" : "hidden lg:flex"}
        `}>
          {/* Candidate info */}
          <div className="bg-[#FF6600] text-white px-3 py-3 text-sm">
            <div className="font-bold">{candidateName}</div>
            <div className="text-orange-100 text-xs">{isNEET ? "NEET UG" : "JEE Main"} — Test Series</div>
          </div>

          {/* Legend */}
          <div className="px-3 py-3 border-b border-gray-200 space-y-1.5">
            {[
              { status: "not-visited" as QuestionStatus, label: "Not Visited", count: countNotVisited },
              { status: "not-answered" as QuestionStatus, label: "Not Answered", count: countNotAnswered },
              { status: "answered" as QuestionStatus, label: "Answered", count: countAnswered },
              { status: "marked" as QuestionStatus, label: "Marked for Review", count: countMarked },
              { status: "answered-marked" as QuestionStatus, label: "Answered & Marked", count: countAnsweredMarked },
            ].map(({ status, label, count }) => (
              <div key={status} className="flex items-center gap-2 text-xs">
                <div className={`w-7 h-7 rounded flex items-center justify-center font-bold text-xs ${STATUS_STYLE[status]}`}>
                  {count}
                </div>
                <span className="text-gray-600">{label}</span>
              </div>
            ))}
          </div>

          {/* Question grid per subject */}
          {subjects.map(subj => {
            const qs = subjectQuestions(subj);
            if (!qs.length) return null;
            return (
              <div key={subj} className="px-3 py-3 border-b border-gray-100">
                <div className="text-xs font-black text-gray-500 uppercase mb-2"
                  style={{ color: SUBJECT_COLORS[subj] }}>
                  {subj}
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {qs.map((q, idx) => {
                    const a = answers.get(q.id) || { value: null, marked: false, visited: false };
                    const status = getStatus(a);
                    const isCurrent = q.id === currentQuestion.id;
                    return (
                      <button
                        key={q.id}
                        onClick={() => { goToQuestion(q); if (paletteOpen) setPaletteOpen(false); }}
                        className={`
                          w-9 h-9 rounded text-xs font-bold transition-all
                          ${STATUS_STYLE[status]}
                          ${isCurrent ? "ring-2 ring-offset-1 ring-[#FF6600] scale-110" : "hover:scale-105"}
                          ${status === "answered-marked" ? "after:content-['✓'] after:absolute after:top-0 after:right-0 after:text-[8px]" : ""}
                        `}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Close palette on mobile */}
          {paletteOpen && (
            <button
              onClick={() => setPaletteOpen(false)}
              className="m-3 py-2 bg-gray-200 text-gray-700 font-bold text-sm rounded"
            >
              Close
            </button>
          )}
        </aside>
      </div>

      {/* ═══ SUBMIT MODAL ═══ */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-[#FF6600] text-white px-5 py-3">
              <h3 className="font-black text-base">Confirm Submission</h3>
            </div>
            <div className="p-5">
              {/* Summary table */}
              <table className="w-full text-xs border border-gray-200 rounded overflow-hidden mb-4">
                <thead className="bg-[#FF6600] text-white">
                  <tr>
                    <th className="px-2 py-1.5 text-left">Subject</th>
                    <th className="px-2 py-1.5 text-center">Answered</th>
                    <th className="px-2 py-1.5 text-center">Not Ans.</th>
                    <th className="px-2 py-1.5 text-center">Marked</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map(subj => {
                    const qs = subjectQuestions(subj);
                    const ans = qs.filter(q => answers.get(q.id)?.value).length;
                    const notAns = qs.filter(q => !answers.get(q.id)?.value).length;
                    const marked = qs.filter(q => answers.get(q.id)?.marked).length;
                    return (
                      <tr key={subj} className="border-t border-gray-100">
                        <td className="px-2 py-1.5 font-semibold">{subj.slice(0, 4)}.</td>
                        <td className="px-2 py-1.5 text-center text-[#27AE60] font-bold">{ans}</td>
                        <td className="px-2 py-1.5 text-center text-[#E74C3C] font-bold">{notAns}</td>
                        <td className="px-2 py-1.5 text-center text-[#8E44AD] font-bold">{marked}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="text-xs text-gray-500 mb-5 text-center">
                Once submitted you cannot change answers. Marked-for-review answered questions will be evaluated.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 py-2.5 border-2 border-gray-300 text-gray-700 font-bold text-sm rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { setShowSubmitModal(false); doSubmit(); }}
                  className="flex-1 py-2.5 bg-[#E74C3C] hover:bg-[#C0392B] text-white font-bold text-sm rounded transition-colors"
                >
                  Submit Test
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import NeetMockTest from "./neet/NeetMockTest";
const MockTestRouter = () => (getCachedGoal() === "NEET" ? <NeetMockTest /> : <MockTest />);
export default MockTestRouter;
