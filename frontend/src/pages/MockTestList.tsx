import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { getCachedGoal, getExamLabel } from "@/utils/examConfig";
import { toast } from "sonner";
import {
  ArrowLeft,
  Clock,
  FileQuestion,
  Calendar,
  Rocket,
  Crown,
  Lock,
  Loader2,
  Beaker,
  BookOpen,
  Atom,
} from "lucide-react";

interface MockTestCard {
  id: string;
  title: string;
  year: number;
  shift: string;
  questionCount: number;
  duration: string;
  pattern: string;
  subjects: { name: string; count: number }[];
}

const MockTestList = () => {
  const navigate = useNavigate();
  const { hasAccess, loading: subLoading } = useSubscription();
  const [mockTests, setMockTests] = useState<MockTestCard[]>([]);
  const [loading, setLoading] = useState(true);
  const goal = getCachedGoal();
  const examLabel = getExamLabel(goal);
  const isNEET = goal === "NEET";

  useEffect(() => {
    fetchMockTests();
  }, []);

  const fetchMockTests = async () => {
    try {
      // NEET branch is handled by the router (NeetMockTestList). This is JEE-only at runtime.
      const { data, error } = await supabase
        .from("questions")
        .select("exam_year, exam_shift, subject, options_list");

      if (error) throw error;
      if (!data || data.length === 0) {
        setMockTests([]);
        setLoading(false);
        return;
      }

      const isIntegerQ = (opts: any) => {
        if (opts === null || opts === undefined) return true;
        if (typeof opts === "string") {
          const s = opts.trim();
          if (s === "" || s === "{}" || s === "null") return true;
          try {
            const parsed = JSON.parse(s);
            return !parsed || (typeof parsed === "object" && Object.keys(parsed).length === 0);
          } catch {
            return false;
          }
        }
        if (typeof opts === "object") return Object.keys(opts).length === 0;
        return false;
      };

      type ShiftAgg = {
        shift: string;
        year: number;
        subjects: Record<string, { mcq: number; integer: number }>;
      };
      const groups: Record<string, ShiftAgg> = {};
      data.forEach((q: any) => {
        const shift = q.exam_shift;
        if (!shift) return;
        if (!groups[shift]) groups[shift] = { shift, year: q.exam_year, subjects: {} };
        const subj = q.subject;
        if (!subj) return;
        if (!groups[shift].subjects[subj]) groups[shift].subjects[subj] = { mcq: 0, integer: 0 };
        if (isIntegerQ(q.options_list)) groups[shift].subjects[subj].integer++;
        else groups[shift].subjects[subj].mcq++;
      });

      // Only shifts with ≥25 questions per Physics / Chemistry / Mathematics qualify.
      const qualified = Object.values(groups).filter((g) => {
        const phy = g.subjects["Physics"];
        const chem = g.subjects["Chemistry"];
        const math = g.subjects["Mathematics"];
        return (
          phy && chem && math &&
          phy.mcq + phy.integer >= 25 &&
          chem.mcq + chem.integer >= 25 &&
          math.mcq + math.integer >= 25
        );
      });

      const cards: MockTestCard[] = qualified
        .map((g) => ({
          id: encodeURIComponent(g.shift),
          title: `${g.shift} Test Series`,
          year: g.year,
          shift: g.shift,
          questionCount: 90,
          duration: "3 hrs",
          pattern: "60 MCQs (Section A) + 30 Integer (Section B, attempt any 5 per subject)",
          subjects: [
            { name: "Physics", count: 30 },
            { name: "Chemistry", count: 30 },
            { name: "Mathematics", count: 30 },
          ],
        }))
        .sort((a, b) => (b.year || 0) - (a.year || 0));

      setMockTests(cards);
    } catch (error) {
      console.error("Error fetching mock tests:", error);
      setMockTests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = (testId: string, index: number) => {
    // First 2 mock tests are FREE, rest require subscription
    const isFree = index < 2;
    if (!isFree && !hasAccess) {
      navigate("/subscription");
      return;
    }
    navigate(`/mock-test/instructions/${testId}`);
  };

  const getSubjectIcon = (name: string) => {
    if (name === "Physics") return <Atom className="w-3.5 h-3.5" />;
    if (name === "Chemistry") return <Beaker className="w-3.5 h-3.5" />;
    return <BookOpen className="w-3.5 h-3.5" />;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="mb-4 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>

            <h1 className="text-3xl font-bold text-foreground mb-2">
              {examLabel} Test Series
            </h1>
            <p className="text-muted-foreground">
              Practice with real {examLabel} exam papers
            </p>
          </motion.div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : mockTests.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              No mock tests available yet for {examLabel}.
            </div>
          ) : (
            <div className="space-y-6">
              {mockTests.map((test, index) => {
                const isFree = index < 2;
                const isLocked = !isFree && !hasAccess;
                return (
                <motion.div
                  key={test.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative overflow-hidden rounded-2xl border border-red-900/40 bg-gradient-to-br from-[#1a1a2e] to-[#0d0d1a] shadow-lg shadow-red-900/10"
                >
                  {/* FREE badge */}
                  {isFree && (
                    <div className="absolute top-3 right-3 z-10 px-2.5 py-1 bg-green-500 text-white text-xs font-black rounded-full shadow-lg">
                      FREE
                    </div>
                  )}
                  {isLocked && (
                    <div className="absolute top-3 right-3 z-10 px-2.5 py-1 bg-amber-500 text-white text-xs font-black rounded-full shadow-lg flex items-center gap-1">
                      <Lock className="w-3 h-3" /> PRO
                    </div>
                  )}
                  {/* Netflix-style top accent */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-700 via-red-500 to-red-700" />

                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h2 className="text-xl font-bold text-foreground">
                            {test.title}
                          </h2>
                          <span className="px-2.5 py-1 rounded-full bg-red-600/20 text-red-400 text-xs font-bold border border-red-600/30">
                            {test.year}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-red-400" />
                            <span>{test.duration}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <FileQuestion className="w-4 h-4 text-red-400" />
                            <span>{test.questionCount} Questions</span>
                          </div>
                        </div>

                        {/* Subject breakdown pills */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {test.subjects.map((subj) => (
                            <span
                              key={subj.name}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-muted-foreground"
                            >
                              {getSubjectIcon(subj.name)}
                              {subj.name}: {subj.count}
                            </span>
                          ))}
                        </div>

                        <div className="bg-black/30 border border-white/5 p-4 rounded-xl">
                          <h3 className="text-sm font-semibold text-red-400 mb-2">📝 Exam Pattern</h3>
                          <p className="text-sm text-muted-foreground">{test.pattern}</p>
                          <div className="flex items-center gap-4 mt-3 text-xs">
                            <span className="px-2 py-1 rounded bg-green-500/15 text-green-400 border border-green-500/20">+4 Correct</span>
                            <span className="px-2 py-1 rounded bg-red-500/15 text-red-400 border border-red-500/20">-1 Wrong</span>
                            <span className="px-2 py-1 rounded bg-white/5 text-muted-foreground border border-white/10">0 Unattempted</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        <Button
                          onClick={() => handleStartTest(test.id, index)}
                          className={`font-semibold px-8 shadow-lg ${
                            isFree
                              ? "bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 shadow-green-900/30"
                              : isLocked
                              ? "bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 shadow-amber-900/30"
                              : "bg-gradient-to-r from-red-700 to-red-500 hover:from-red-600 hover:to-red-400 shadow-red-900/30"
                          } text-white`}
                          size="lg"
                        >
                          {isFree ? (
                            <><Rocket className="w-4 h-4 mr-2" />Start Free Test</>
                          ) : isLocked ? (
                            <><Lock className="w-4 h-4 mr-2" />Unlock Test</>
                          ) : (
                            <><Rocket className="w-4 h-4 mr-2" />Start Test</>
                          )}
                        </Button>
                        {isLocked && (
                          <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                            <Crown className="w-3 h-3 text-yellow-500" />
                            Subscribe at just ₹29/month
                          </p>
                        )}
                        {isFree && (
                          <p className="text-xs text-green-400 text-center font-semibold">✓ No subscription needed</p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import NeetMockTestList from "./neet/NeetMockTestList";
const MockTestListRouter = () => (getCachedGoal() === "NEET" ? <NeetMockTestList /> : <MockTestList />);
export default MockTestListRouter;
