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
      const table = isNEET ? "neet_questions" : "questions";
      
      // Get distinct year+shift combos with counts
      const { data, error } = await supabase
        .from(table)
        .select("exam_year, exam_shift, subject");

      if (error) throw error;

      if (!data || data.length === 0) {
        // Show placeholder cards if no data yet
        const placeholders = isNEET
          ? [
              { year: 2025, shift: "NEET 2025", total: 180 },
              { year: 2024, shift: "NEET 2024", total: 200 },
              { year: 2023, shift: "NEET 2023", total: 200 },
              { year: 2022, shift: "NEET 2022", total: 200 },
            ]
          : [];

        if (isNEET) {
          const cards: MockTestCard[] = placeholders.map((p) => ({
            id: `neet_${p.year}`,
            title: p.shift,
            year: p.year,
            shift: p.shift,
            questionCount: p.total,
            duration: "3 hrs 20 min",
            pattern:
              p.year === 2025
                ? "180 MCQs • Physics (45) + Chemistry (45) + Biology (90)"
                : "200 MCQs • Section A (35 compulsory) + Section B (10 of 15) per subject",
            subjects: [
              { name: "Physics", count: p.year === 2025 ? 45 : 50 },
              { name: "Chemistry", count: p.year === 2025 ? 45 : 50 },
              { name: "Biology", count: p.year === 2025 ? 90 : 100 },
            ],
          }));
          setMockTests(cards);
        }
        setLoading(false);
        return;
      }

      // Group by year+shift
      const groups: Record<string, { year: number; shift: string; subjects: Record<string, number> }> = {};
      data.forEach((q: any) => {
        const key = `${q.exam_year}_${q.exam_shift || "Main"}`;
        if (!groups[key]) {
          groups[key] = { year: q.exam_year, shift: q.exam_shift || "Main", subjects: {} };
        }
        const subj = q.subject || "Other";
        groups[key].subjects[subj] = (groups[key].subjects[subj] || 0) + 1;
      });

      const cards: MockTestCard[] = Object.entries(groups)
        .map(([key, g]) => {
          const totalQ = Object.values(g.subjects).reduce((a, b) => a + b, 0);
          const subjectList = Object.entries(g.subjects).map(([name, count]) => ({ name, count }));

          return {
            id: key,
            title: `${examLabel} ${g.year} - ${g.shift}`,
            year: g.year,
            shift: g.shift,
            questionCount: totalQ,
            duration: isNEET ? "3 hrs 20 min" : "3 hrs",
            pattern: isNEET
              ? `${totalQ} MCQs • ${subjectList.map((s) => `${s.name} (${s.count})`).join(" + ")}`
              : `${totalQ} MCQs • ${subjectList.map((s) => `${s.name} (${s.count})`).join(" + ")}`,
            subjects: subjectList,
          };
        })
        .sort((a, b) => b.year - a.year);

      setMockTests(cards);
    } catch (error) {
      console.error("Error fetching mock tests:", error);
      // Show placeholder for NEET even on error
      if (isNEET) {
        setMockTests([
          {
            id: "neet_2025",
            title: "NEET 2025",
            year: 2025,
            shift: "NEET 2025",
            questionCount: 180,
            duration: "3 hrs 20 min",
            pattern: "180 MCQs • Physics (45) + Chemistry (45) + Biology (90)",
            subjects: [
              { name: "Physics", count: 45 },
              { name: "Chemistry", count: 45 },
              { name: "Biology", count: 90 },
            ],
          },
          {
            id: "neet_2024",
            title: "NEET 2024",
            year: 2024,
            shift: "NEET 2024",
            questionCount: 200,
            duration: "3 hrs 20 min",
            pattern: "200 MCQs • Physics (50) + Chemistry (50) + Biology (100)",
            subjects: [
              { name: "Physics", count: 50 },
              { name: "Chemistry", count: 50 },
              { name: "Biology", count: 100 },
            ],
          },
          {
            id: "neet_2023",
            title: "NEET 2023",
            year: 2023,
            shift: "NEET 2023",
            questionCount: 200,
            duration: "3 hrs 20 min",
            pattern: "200 MCQs • Physics (50) + Chemistry (50) + Biology (100)",
            subjects: [
              { name: "Physics", count: 50 },
              { name: "Chemistry", count: 50 },
              { name: "Biology", count: 100 },
            ],
          },
          {
            id: "neet_2022",
            title: "NEET 2022",
            year: 2022,
            shift: "NEET 2022",
            questionCount: 200,
            duration: "3 hrs 20 min",
            pattern: "200 MCQs • Physics (50) + Chemistry (50) + Biology (100)",
            subjects: [
              { name: "Physics", count: 50 },
              { name: "Chemistry", count: 50 },
              { name: "Biology", count: 100 },
            ],
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = (testId: string) => {
    if (!hasAccess) {
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
              {examLabel} Mock Tests
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
              {mockTests.map((test, index) => (
                <motion.div
                  key={test.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative overflow-hidden rounded-2xl border border-red-900/40 bg-gradient-to-br from-[#1a1a2e] to-[#0d0d1a] shadow-lg shadow-red-900/10"
                >
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
                          <h3 className="text-sm font-semibold text-red-400 mb-2">
                            📝 Exam Pattern
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {test.pattern}
                          </p>
                          <div className="flex items-center gap-4 mt-3 text-xs">
                            <span className="px-2 py-1 rounded bg-green-500/15 text-green-400 border border-green-500/20">
                              +4 Correct
                            </span>
                            <span className="px-2 py-1 rounded bg-red-500/15 text-red-400 border border-red-500/20">
                              -1 Wrong
                            </span>
                            <span className="px-2 py-1 rounded bg-white/5 text-muted-foreground border border-white/10">
                              0 Unattempted
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        <Button
                          onClick={() => handleStartTest(test.id)}
                          className="bg-gradient-to-r from-red-700 to-red-500 hover:from-red-600 hover:to-red-400 text-white font-semibold px-8 shadow-lg shadow-red-900/30"
                          size="lg"
                        >
                          {hasAccess ? (
                            <>
                              <Rocket className="w-4 h-4 mr-2" />
                              Start Test
                            </>
                          ) : (
                            <>
                              <Lock className="w-4 h-4 mr-2" />
                              Unlock Test
                            </>
                          )}
                        </Button>
                        {!hasAccess && (
                          <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                            <Crown className="w-3 h-3 text-yellow-500" />
                            Premium required
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MockTestList;
