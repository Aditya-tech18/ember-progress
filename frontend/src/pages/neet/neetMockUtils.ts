// Utilities for NEET mock test flow
import { supabase } from "@/integrations/supabase/client";

export interface NeetQuestion {
  id: number;
  subject: string;
  chapter: string | null;
  exam_shift: string;
  exam_year: number;
  question_text: string;
  options_list: any;
  correct_answer: string | null;
  solution: string | null;
  question_image_url: string | null;
}

export interface NeetSectionedQuestions {
  physics: NeetQuestion[];
  chemistry: NeetQuestion[];
  botany: NeetQuestion[];
  zoology: NeetQuestion[];
  all: NeetQuestion[];
}

export const SECTION_KEYS = ["physics", "chemistry", "botany", "zoology"] as const;
export type SectionKey = typeof SECTION_KEYS[number];

export const SECTION_LABELS: Record<SectionKey, string> = {
  physics: "Physics",
  chemistry: "Chemistry",
  botany: "Botany",
  zoology: "Zoology",
};

export const DURATION_SECONDS = 200 * 60; // 12000
export const MARKS_CORRECT = 4;
export const MARKS_WRONG = -1;
export const MAX_MARKS = 720;

export interface NeetAttempt {
  attemptNumber: number;
  totalScore: number;
  physicsScore: number;
  chemistryScore: number;
  botanyScore: number;
  zoologyScore: number;
  physicsCorrect: number; physicsWrong: number; physicsUnattempted: number;
  chemistryCorrect: number; chemistryWrong: number; chemistryUnattempted: number;
  botanyCorrect: number; botanyWrong: number; botanyUnattempted: number;
  zoologyCorrect: number; zoologyWrong: number; zoologyUnattempted: number;
  totalCorrect: number; totalWrong: number; totalUnattempted: number;
  answers: Record<number, string | null>;
  flagged: number[];
  timeSpentSeconds: number;
  submittedAt: string;
  // Snapshot of which question ids belonged to which section (for solutions)
  sectionMap: { physics: number[]; chemistry: number[]; botany: number[]; zoology: number[] };
}

export interface NeetTestRecord {
  testId: string;
  examShift: string;
  examYear: number;
  attempts: NeetAttempt[];
  bestScore: number;
  bestAttemptIndex: number;
}

const STORAGE_PREFIX = "neet_mock_v1_";
const TIMER_PREFIX = "neet_mock_timer_v1_";
const ANSWERS_PREFIX = "neet_mock_answers_v1_";

export const getStoredRecord = (testId: string): NeetTestRecord | null => {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + testId);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

export const saveRecord = (rec: NeetTestRecord) => {
  localStorage.setItem(STORAGE_PREFIX + rec.testId, JSON.stringify(rec));
};

export const getStartTimestamp = (testId: string): number | null => {
  const v = localStorage.getItem(TIMER_PREFIX + testId);
  return v ? parseInt(v, 10) : null;
};

export const setStartTimestamp = (testId: string, ts: number) => {
  localStorage.setItem(TIMER_PREFIX + testId, String(ts));
};

export const clearStartTimestamp = (testId: string) => {
  localStorage.removeItem(TIMER_PREFIX + testId);
  localStorage.removeItem(ANSWERS_PREFIX + testId);
};

export const persistInProgressAnswers = (
  testId: string,
  data: { answers: Record<number, string | null>; flagged: number[]; visited: number[] }
) => {
  localStorage.setItem(ANSWERS_PREFIX + testId, JSON.stringify(data));
};

export const loadInProgressAnswers = (testId: string) => {
  try {
    const raw = localStorage.getItem(ANSWERS_PREFIX + testId);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

export const fetchPaperByShift = async (examShift: string): Promise<NeetSectionedQuestions | null> => {
  const { data, error } = await supabase
    .from("neet_questions")
    .select("*")
    .eq("exam_shift", examShift)
    .order("subject", { ascending: true })
    .order("id", { ascending: true });
  if (error || !data) return null;
  const phys = data.filter((q: any) => q.subject === "Physics");
  const chem = data.filter((q: any) => q.subject === "Chemistry");
  let botany = data.filter((q: any) => q.subject === "Botany");
  let zoology = data.filter((q: any) => q.subject === "Zoology");
  // Legacy fallback for papers stored under single "Biology" subject
  if (botany.length === 0 && zoology.length === 0) {
    const bio = data.filter((q: any) => q.subject === "Biology");
    if (bio.length === 90) {
      botany = bio.slice(0, 45);
      zoology = bio.slice(45, 90);
    }
  }
  if (phys.length !== 45 || chem.length !== 45 || botany.length !== 45 || zoology.length !== 45) return null;
  return {
    physics: phys as any,
    chemistry: chem as any,
    botany: botany as any,
    zoology: zoology as any,
    all: [...phys, ...chem, ...botany, ...zoology] as any,
  };
};

export const fetchAvailablePapers = async () => {
  const { data: mockTests, error } = await supabase
    .from("neet_mock_tests")
    .select("*")
    .eq("is_published", true);
  if (error || !mockTests) return [];
  const { data: counts } = await supabase
    .from("neet_questions")
    .select("exam_shift, subject");
  if (!counts) return [];
  const tally: Record<string, Record<string, number>> = {};
  counts.forEach((r: any) => {
    if (!tally[r.exam_shift]) tally[r.exam_shift] = {};
    tally[r.exam_shift][r.subject] = (tally[r.exam_shift][r.subject] || 0) + 1;
  });
  return mockTests.filter((t: any) => {
    const c = tally[t.exam_shift] || {};
    const newSplit = c.Physics === 45 && c.Chemistry === 45 && c.Botany === 45 && c.Zoology === 45;
    const legacySplit = c.Physics === 45 && c.Chemistry === 45 && c.Biology === 90;
    return newSplit || legacySplit;
  });
};

export const scoreSection = (qs: NeetQuestion[], answers: Record<number, string | null>) => {
  let correct = 0, wrong = 0, unattempted = 0;
  for (const q of qs) {
    const a = answers[q.id] ?? null;
    if (!a) unattempted++;
    else if (q.correct_answer && a === q.correct_answer) correct++;
    else wrong++;
  }
  return { correct, wrong, unattempted, score: correct * MARKS_CORRECT + wrong * MARKS_WRONG };
};

export const computeAttempt = (
  paper: NeetSectionedQuestions,
  answers: Record<number, string | null>,
  timeSpentSeconds: number,
  attemptNumber: number,
): NeetAttempt => {
  const p = scoreSection(paper.physics, answers);
  const c = scoreSection(paper.chemistry, answers);
  const b = scoreSection(paper.botany, answers);
  const z = scoreSection(paper.zoology, answers);
  return {
    attemptNumber,
    totalScore: p.score + c.score + b.score + z.score,
    physicsScore: p.score, chemistryScore: c.score, botanyScore: b.score, zoologyScore: z.score,
    physicsCorrect: p.correct, physicsWrong: p.wrong, physicsUnattempted: p.unattempted,
    chemistryCorrect: c.correct, chemistryWrong: c.wrong, chemistryUnattempted: c.unattempted,
    botanyCorrect: b.correct, botanyWrong: b.wrong, botanyUnattempted: b.unattempted,
    zoologyCorrect: z.correct, zoologyWrong: z.wrong, zoologyUnattempted: z.unattempted,
    totalCorrect: p.correct + c.correct + b.correct + z.correct,
    totalWrong: p.wrong + c.wrong + b.wrong + z.wrong,
    totalUnattempted: p.unattempted + c.unattempted + b.unattempted + z.unattempted,
    answers,
    flagged: [],
    timeSpentSeconds,
    submittedAt: new Date().toISOString(),
    sectionMap: {
      physics: paper.physics.map(q => q.id),
      chemistry: paper.chemistry.map(q => q.id),
      botany: paper.botany.map(q => q.id),
      zoology: paper.zoology.map(q => q.id),
    },
  };
};

export const upsertLeaderboard = async (testId: string, bestScore: number) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("neet_mock_leaderboard").upsert(
      { test_id: testId, user_id: user.id, best_score: bestScore, updated_at: new Date().toISOString() },
      { onConflict: "test_id,user_id" }
    );
  } catch (e) { console.error("leaderboard upsert", e); }
};

export const fetchLeaderboardStats = async (testId: string, userBestScore: number) => {
  const { data, error } = await supabase
    .from("neet_mock_leaderboard")
    .select("user_id, best_score")
    .eq("test_id", testId);
  if (error || !data) return { rank: null as number | null, total: 0, percentile: null as number | null };
  const total = data.length;
  const better = data.filter((r: any) => r.best_score > userBestScore).length;
  const rank = better + 1;
  const percentile = total > 0 ? ((total - rank) / total) * 100 : null;
  return { rank, total, percentile };
};

// Map options_list "1"/"2"/"3"/"4" -> A/B/C/D
export const optionLetter = (idx: number) => ["A", "B", "C", "D"][idx];
export const parseOptions = (options_list: any): { letter: string; text: string }[] => {
  if (!options_list) return [];
  let obj = options_list;
  if (typeof obj === "string") { try { obj = JSON.parse(obj); } catch { return []; } }
  const keys = ["1", "2", "3", "4"];
  return keys.map((k, i) => ({ letter: optionLetter(i), text: obj?.[k] ?? "" }));
};

export const formatHHMMSS = (totalSec: number) => {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};
