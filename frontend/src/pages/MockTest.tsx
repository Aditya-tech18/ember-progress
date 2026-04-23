import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { LatexRenderer } from "@/components/LatexRenderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getCachedGoal } from "@/utils/examConfig";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  AlertTriangle,
  Loader2,
  Send,
  Save,
  Atom,
  FlaskConical,
  Calculator,
  BookOpen,
} from "lucide-react";

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

interface Answer {
  questionId: number;
  userAnswer: string | null;
  isMarkedForReview: boolean;
}

// Max 5 attempts allowed in Section B per subject (JEE)
// Max 10 attempts allowed in Section B per subject (NEET)
const MAX_SECTION_B_ATTEMPTS_JEE = 5;
const MAX_SECTION_B_ATTEMPTS_NEET = 10;

// Section A size: JEE = 20, NEET = 35
const SECTION_A_SIZE_JEE = 20;
const SECTION_A_SIZE_NEET = 35;

// Subject configuration with icons and colors
const subjectConfig: Record<string, { icon: any; color: string; bgColor: string; textColor: string }> = {
  Physics: {
    icon: Atom,
    color: "from-electric-blue to-cyan-500",
    bgColor: "bg-electric-blue",
    textColor: "text-electric-blue",
  },
  Chemistry: {
    icon: FlaskConical,
    color: "from-primary to-crimson",
    bgColor: "bg-primary",
    textColor: "text-primary",
  },
  Mathematics: {
    icon: Calculator,
    color: "from-gold to-amber-500",
    bgColor: "bg-gold",
    textColor: "text-gold",
  },
  Biology: {
    icon: BookOpen,
    color: "from-green-500 to-emerald-500",
    bgColor: "bg-green-600",
    textColor: "text-green-500",
  },
};

// Mock Test Question IDs Configuration for JEE Main 2 April 2025 Shift 2
const getMockTestQuestionIds = () => {
  const mathsSectionA = Array.from({ length: 20 }, (_, i) => 202524201 + i);
  const mathsSectionBFirst5 = Array.from({ length: 5 }, (_, i) => 202524221 + i);
  const mathsSectionBLast5 = [21, 22, 23, 24, 25];

  const physicsSectionA = Array.from({ length: 20 }, (_, i) => 202524226 + i);
  const physicsSectionBFirst5 = Array.from({ length: 5 }, (_, i) => 202524246 + i);
  const physicsSectionBLast5 = Array.from({ length: 8 }, (_, i) => 20244552 + i);

  const chemistrySectionA = Array.from({ length: 20 }, (_, i) => 202524251 + i);
  const chemistrySectionBFirst5 = Array.from({ length: 5 }, (_, i) => 202524271 + i);
  const chemistrySectionBLast5 = Array.from({ length: 5 }, (_, i) => 20244485 + i);

  return {
    Mathematics: [...mathsSectionA, ...mathsSectionBFirst5, ...mathsSectionBLast5],
    Physics: [...physicsSectionA, ...physicsSectionBFirst5, ...physicsSectionBLast5.slice(0, 5)],
    Chemistry: [...chemistrySectionA, ...chemistrySectionBFirst5, ...chemistrySectionBLast5],
  };
};

const MockTest = () => {
  const navigate = useNavigate();
  const { testId } = useParams<{ testId: string }>();
  const goal = getCachedGoal();
  const isNEET = goal === "NEET";

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<number, Answer>>(new Map());
  const [timeLeft, setTimeLeft] = useState(isNEET ? 200 * 60 : 3 * 60 * 60); // NEET: 200 min, JEE: 180 min
  const [selectedSubject, setSelectedSubject] = useState<string>("Physics");
  const [currentSection, setCurrentSection] = useState<"A" | "B">("A");
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  const subjects = isNEET ? ["Physics", "Chemistry", "Biology"] : ["Physics", "Chemistry", "Mathematics"];
  const sectionASize = isNEET ? SECTION_A_SIZE_NEET : SECTION_A_SIZE_JEE;
  const maxSectionBAttempts = isNEET ? MAX_SECTION_B_ATTEMPTS_NEET : MAX_SECTION_B_ATTEMPTS_JEE;
  const currentQuestion = questions[currentIndex];
  const isNumerical = currentQuestion && !parseOptions(currentQuestion.options_list).hasOptions;

  useEffect(() => {
    fetchQuestions();
  }, [testId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      if (isNEET) {
        // Parse year from testId like "neet_2025" or "2025_NEET 2025"
        const yearMatch = testId?.match(/(\d{4})/);
        const year = yearMatch ? parseInt(yearMatch[1]) : null;

        if (!year) {
          toast.error("Invalid test ID");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("neet_questions")
          .select("*")
          .eq("exam_year", year)
          .order("subject")
          .order("id");

        if (error) throw error;

        if (data && data.length > 0) {
          // Sort by subject order: Physics, Chemistry, Biology
          const subjectOrder = ["Physics", "Chemistry", "Biology"];
          const sorted = data.sort((a: any, b: any) => {
            const ai = subjectOrder.indexOf(a.subject || "");
            const bi = subjectOrder.indexOf(b.subject || "");
            if (ai !== bi) return ai - bi;
            return a.id - b.id;
          });

          const mappedQuestions: Question[] = sorted.map((q: any) => ({
            id: q.id,
            subject: q.subject || "Physics",
            chapter: q.chapter || "",
            question_text: q.question_text,
            options_list: q.options_list,
            correct_answer: q.correct_answer || "",
            solution: q.solution || "",
            question_image_url: q.question_image_url,
            exam_year: q.exam_year,
            exam_shift: q.exam_shift || "",
          }));

          setQuestions(mappedQuestions);

          const initialAnswers = new Map<number, Answer>();
          mappedQuestions.forEach((q) => {
            initialAnswers.set(q.id, {
              questionId: q.id,
              userAnswer: null,
              isMarkedForReview: false,
            });
          });
          setAnswers(initialAnswers);
        }
      } else {
        // JEE flow (existing)
        const questionIds = getMockTestQuestionIds();
        const allIds = [
          ...questionIds.Physics,
          ...questionIds.Chemistry,
          ...questionIds.Mathematics,
        ];

        const { data, error } = await supabase
          .from("questions")
          .select("*")
          .in("id", allIds);

        if (error) throw error;

        if (data && data.length > 0) {
          const sortedQuestions: Question[] = [];
          
          questionIds.Physics.forEach(id => {
            const q = data.find(d => d.id === id);
            if (q) sortedQuestions.push({ ...q, subject: "Physics" });
          });
          
          questionIds.Chemistry.forEach(id => {
            const q = data.find(d => d.id === id);
            if (q) sortedQuestions.push({ ...q, subject: "Chemistry" });
          });
          
          questionIds.Mathematics.forEach(id => {
            const q = data.find(d => d.id === id);
            if (q) sortedQuestions.push({ ...q, subject: "Mathematics" });
          });

          setQuestions(sortedQuestions);
          
          const initialAnswers = new Map<number, Answer>();
          sortedQuestions.forEach((q) => {
            initialAnswers.set(q.id, {
              questionId: q.id,
              userAnswer: null,
              isMarkedForReview: false,
            });
          });
          setAnswers(initialAnswers);
        }
      }
    } catch (err) {
      console.error("Error fetching questions:", err);
      toast.error("Failed to load test questions");
    } finally {
      setLoading(false);
    }
  };

  function parseOptions(optionsList: string | null): { hasOptions: boolean; options: Record<string, string> } {
    if (!optionsList) return { hasOptions: false, options: {} };
    try {
      const parsed = typeof optionsList === "string" ? JSON.parse(optionsList) : optionsList;
      if (typeof parsed === "object" && parsed !== null && Object.keys(parsed).length > 0) {
        return { hasOptions: true, options: parsed };
      }
    } catch (e) {
      console.error("Error parsing options:", e);
    }
    return { hasOptions: false, options: {} };
  }

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Get count of answered questions in Section B for current subject
  const getSectionBAttemptedCount = (subject: string): number => {
    const sectionBQuestions = getSubjectQuestions(subject, "B");
    let count = 0;
    sectionBQuestions.forEach((q) => {
      const ans = answers.get(q.id);
      if (ans?.userAnswer && ans.userAnswer.trim() !== "") {
        count++;
      }
    });
    return count;
  };

  const handleAnswerChange = (questionId: number, answer: string) => {
    // Check if this is a Section B question
    const question = questions.find(q => q.id === questionId);
    if (question) {
      const subjectQuestions = questions.filter(q => q.subject === question.subject);
      const indexInSubject = subjectQuestions.indexOf(question);
      const isInSectionB = indexInSubject >= sectionASize;

      if (isInSectionB && answer.trim() !== "") {
        const currentAnswer = answers.get(questionId);
        const wasEmpty = !currentAnswer?.userAnswer || currentAnswer.userAnswer.trim() === "";
        
        if (wasEmpty) {
          const attemptedCount = getSectionBAttemptedCount(question.subject);
          if (attemptedCount >= maxSectionBAttempts) {
            toast.error(`You can only attempt ${maxSectionBAttempts} questions in Section B per subject.`);
            return;
          }
        }
      }
    }

    setAnswers((prev) => {
      const newAnswers = new Map(prev);
      const current = newAnswers.get(questionId);
      newAnswers.set(questionId, {
        ...current!,
        userAnswer: answer,
      });
      return newAnswers;
    });
  };

  const handleMarkForReview = (questionId: number) => {
    setAnswers((prev) => {
      const newAnswers = new Map(prev);
      const current = newAnswers.get(questionId);
      newAnswers.set(questionId, {
        ...current!,
        isMarkedForReview: !current?.isMarkedForReview,
      });
      return newAnswers;
    });
  };

  const handleSaveAndNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      // Update section based on new question
      const nextQuestion = questions[currentIndex + 1];
      if (nextQuestion) {
        const subjectQuestions = questions.filter(q => q.subject === nextQuestion.subject);
        const indexInSubject = subjectQuestions.indexOf(nextQuestion);
        setCurrentSection(indexInSubject < sectionASize ? "A" : "B");
        setSelectedSubject(nextQuestion.subject);
      }
    }
  };

  const getSubjectQuestions = (subject: string, section: "A" | "B") => {
    const subjectQuestions = questions.filter((q) => q.subject === subject);
    if (section === "A") {
      return subjectQuestions.slice(0, sectionASize);
    }
    return subjectQuestions.slice(sectionASize);
  };

  const goToQuestion = (subject: string, section: "A" | "B", index: number) => {
    const subjectQuestions = getSubjectQuestions(subject, section);
    const question = subjectQuestions[index];
    if (question) {
      const globalIndex = questions.indexOf(question);
      setCurrentIndex(globalIndex);
      setSelectedSubject(subject);
      setCurrentSection(section);
    }
  };

  const handleSubmitTest = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please login to submit test");
        return;
      }

      let totalScore = 0;
      let physicsScore = 0, chemistryScore = 0, mathsScore = 0;
      let physicsCorrect = 0, physicsWrong = 0, physicsUnattempted = 0;
      let chemistryCorrect = 0, chemistryWrong = 0, chemistryUnattempted = 0;
      let mathsCorrect = 0, mathsWrong = 0, mathsUnattempted = 0;

      questions.forEach((q) => {
        const answer = answers.get(q.id);
        const userAnswer = answer?.userAnswer?.trim() || "";
        const correctAnswer = q.correct_answer?.trim() || "";
        const subject = q.subject?.toLowerCase() || "";

        if (!userAnswer) {
          if (subject === "physics") physicsUnattempted++;
          else if (subject === "chemistry") chemistryUnattempted++;
          else mathsUnattempted++;
        } else if (userAnswer === correctAnswer) {
          totalScore += 4;
          if (subject === "physics") { physicsScore += 4; physicsCorrect++; }
          else if (subject === "chemistry") { chemistryScore += 4; chemistryCorrect++; }
          else { mathsScore += 4; mathsCorrect++; }
        } else {
          totalScore -= 1;
          if (subject === "physics") { physicsScore -= 1; physicsWrong++; }
          else if (subject === "chemistry") { chemistryScore -= 1; chemistryWrong++; }
          else { mathsScore -= 1; mathsWrong++; }
        }
      });

      const timeSpent = 3 * 60 * 60 - timeLeft;
      const totalCorrect = physicsCorrect + chemistryCorrect + mathsCorrect;
      const totalWrong = physicsWrong + chemistryWrong + mathsWrong;
      const totalUnattempted = physicsUnattempted + chemistryUnattempted + mathsUnattempted;

      const { data: result, error } = await supabase
        .from("mock_test_results")
        .insert({
          user_id: user.id,
          test_id: `mock_test_${testId}`,
          total_score: totalScore,
          physics_score: physicsScore,
          chemistry_score: chemistryScore,
          maths_score: mathsScore,
          physics_correct: physicsCorrect,
          physics_wrong: physicsWrong,
          physics_unattempted: physicsUnattempted,
          chemistry_correct: chemistryCorrect,
          chemistry_wrong: chemistryWrong,
          chemistry_unattempted: chemistryUnattempted,
          maths_correct: mathsCorrect,
          maths_wrong: mathsWrong,
          maths_unattempted: mathsUnattempted,
          total_questions_attempted: totalCorrect + totalWrong,
          total_correct: totalCorrect,
          total_wrong: totalWrong,
          total_unattempted: totalUnattempted,
          time_spent_seconds: timeSpent,
        })
        .select()
        .single();

      if (error) throw error;

      navigate(`/mock-test/result/${result.id}`, {
        state: { answers: Object.fromEntries(answers), questions },
      });
    } catch (err) {
      console.error("Error submitting test:", err);
      toast.error("Failed to submit test");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading test...</p>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-destructive">No questions available</p>
          <Button onClick={() => navigate("/mock-tests")} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const { options } = parseOptions(currentQuestion.options_list);
  const currentAnswer = answers.get(currentQuestion.id);
  const currentSubjectQuestions = getSubjectQuestions(selectedSubject, currentSection);
  const currentQuestionIndexInSection = currentSubjectQuestions.findIndex(q => q.id === currentQuestion.id);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Fixed Header with Timer */}
      <div className="sticky top-0 z-50 bg-card/95 backdrop-blur-lg border-b border-border shadow-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="font-bold text-foreground text-lg">
                {selectedSubject} - Section {currentSection}
              </span>
            </div>

            <div className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-lg ${
              timeLeft < 600 
                ? "bg-destructive/20 text-destructive border border-destructive/30" 
                : "bg-primary/20 text-primary border border-primary/30"
            }`}>
              <Clock className="w-5 h-5" />
              <span className="font-bold">{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Subject Tabs - Full Names */}
      <div className="bg-card/80 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-center gap-3">
            {subjects.map((subject) => {
              const config = subjectConfig[subject as keyof typeof subjectConfig];
              const isSelected = selectedSubject === subject;
              return (
                <button
                  key={subject}
                  onClick={() => {
                    setSelectedSubject(subject);
                    setCurrentSection("A");
                    const firstQuestion = getSubjectQuestions(subject, "A")[0];
                    if (firstQuestion) {
                      setCurrentIndex(questions.indexOf(firstQuestion));
                    }
                  }}
                  className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 ${
                    isSelected
                      ? `bg-gradient-to-r ${config.color} text-white shadow-lg scale-105`
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {subject}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="bg-card/60 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-2">
          <div className="flex justify-center gap-4">
            {(["A", "B"] as const).map((section) => {
              const isSelected = currentSection === section;
              const config = subjectConfig[selectedSubject as keyof typeof subjectConfig];
              const sectionBCount = section === "B" ? getSectionBAttemptedCount(selectedSubject) : 0;
              return (
                <button
                  key={section}
                  onClick={() => {
                    setCurrentSection(section);
                    const firstQuestion = getSubjectQuestions(selectedSubject, section)[0];
                    if (firstQuestion) {
                      setCurrentIndex(questions.indexOf(firstQuestion));
                    }
                  }}
                  className={`px-5 py-2 rounded-full font-medium text-sm border-2 transition-all ${
                    isSelected
                      ? `${config.bgColor} text-white border-transparent`
                      : `border-primary/50 ${config.textColor} hover:bg-primary/10`
                  }`}
                >
                  Section {section} {section === "A" ? "(MCQ)" : `(Integer - ${sectionBCount}/${MAX_SECTION_B_ATTEMPTS})`}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Question Palette - At Top */}
      <div className="bg-card/40 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="glass-card p-4 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground">Question Palette</h3>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-success/30 border-2 border-success"></div>
                  <span className="text-muted-foreground">Answered</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-gold/30 border-2 border-gold"></div>
                  <span className="text-muted-foreground">Review</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-4 rounded bg-muted border-2 border-border"></div>
                  <span className="text-muted-foreground">Not Answered</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-10 sm:grid-cols-15 md:grid-cols-20 gap-2">
              {currentSubjectQuestions.map((q, idx) => {
                const ans = answers.get(q.id);
                let bgClass = "bg-muted hover:bg-muted/80";
                let borderClass = "border-border";
                
                if (ans?.isMarkedForReview) {
                  bgClass = "bg-gold/30";
                  borderClass = "border-gold";
                } else if (ans?.userAnswer) {
                  bgClass = "bg-success/30";
                  borderClass = "border-success";
                }
                
                const isCurrent = questions[currentIndex]?.id === q.id;
                
                return (
                  <button
                    key={q.id}
                    onClick={() => goToQuestion(selectedSubject, currentSection, idx)}
                    className={`w-10 h-10 md:w-12 md:h-12 rounded-lg font-bold text-sm border-2 transition-all ${bgClass} ${borderClass} ${
                      isCurrent ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110" : ""
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pb-32">
        <div className="container mx-auto px-4 py-6">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 md:p-8 rounded-2xl"
          >
            {/* Question Header */}
            <div className="flex items-center justify-between mb-4">
              <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold">
                Q.{currentQuestionIndexInSection + 1}
              </span>
              <span className="text-sm text-muted-foreground">
                {currentQuestion.exam_year} | {currentQuestion.exam_shift}
              </span>
            </div>

            {/* Question Image */}
            {currentQuestion.question_image_url && (
              <div className="mb-6 rounded-xl overflow-hidden bg-muted/50">
                <img
                  src={currentQuestion.question_image_url}
                  alt="Question"
                  className="w-full h-auto max-h-80 object-contain"
                />
              </div>
            )}

            {/* Question Text */}
            <div className="mb-8">
              <div className="text-lg leading-relaxed text-foreground whitespace-pre-wrap">
                <LatexRenderer content={currentQuestion.question_text} />
              </div>
            </div>

            {/* Options / Numerical Input */}
            <div className="space-y-3">
              {isNumerical ? (
                <div className="space-y-4">
                  <p className="text-muted-foreground font-medium">Enter your numerical answer:</p>
                  <Input
                    type="text"
                    value={currentAnswer?.userAnswer || ""}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    placeholder="Type your answer..."
                    className="text-2xl h-16 text-center font-mono border-2 border-primary/50 focus:border-primary"
                  />
                </div>
              ) : (
                Object.entries(options).map(([key, value]) => {
                  const isSelected = currentAnswer?.userAnswer === key;
                  return (
                    <div
                      key={key}
                      onClick={() => {
                        // Toggle selection
                        if (isSelected) {
                          handleAnswerChange(currentQuestion.id, "");
                        } else {
                          handleAnswerChange(currentQuestion.id, key);
                        }
                      }}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? "border-primary bg-primary/10 shadow-lg"
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 ${
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {key}
                        </div>
                        <div className="flex-1 overflow-x-auto pt-2">
                          <LatexRenderer content={value} />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border shadow-2xl z-50">
        <div className="w-full px-2 sm:px-4 py-2 sm:py-3">
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2 max-w-full">
            <Button
              variant="outline"
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="h-11 sm:h-12 text-xs sm:text-sm font-semibold px-2 sm:px-4 flex-col sm:flex-row gap-0.5 sm:gap-2"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden text-[10px]">Prev</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => handleMarkForReview(currentQuestion.id)}
              className={`h-11 sm:h-12 text-xs sm:text-sm font-semibold px-2 sm:px-4 flex-col sm:flex-row gap-0.5 sm:gap-2 ${
                currentAnswer?.isMarkedForReview 
                  ? "border-gold text-gold bg-gold/10" 
                  : ""
              }`}
            >
              <Flag className={`w-4 h-4 sm:w-5 sm:h-5 ${currentAnswer?.isMarkedForReview ? "fill-gold" : ""}`} />
              <span className="text-[10px] sm:text-sm">Mark</span>
            </Button>

            <Button
              onClick={handleSaveAndNext}
              disabled={currentIndex === questions.length - 1}
              className="h-11 sm:h-12 text-xs sm:text-sm font-semibold px-3 sm:px-4 bg-gradient-to-r from-success to-emerald-500 gap-2"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Next</span>
            </Button>

            {/* Always visible Submit button */}
            <Button
              onClick={() => setShowSubmitConfirm(true)}
              className="h-11 sm:h-12 text-xs sm:text-sm font-semibold px-2 sm:px-4 bg-gradient-to-r from-destructive to-red-600 flex-col sm:flex-row gap-0.5 sm:gap-2"
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-[10px] sm:text-sm">Submit</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      <AnimatePresence>
        {showSubmitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowSubmitConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card p-8 max-w-md w-full rounded-2xl border border-border"
            >
              <h3 className="text-2xl font-bold text-foreground mb-4">✅ Submit Test?</h3>
              <p className="text-muted-foreground mb-6">
                Are you sure you want to submit the test? You won't be able to change your answers after submission.
              </p>
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setShowSubmitConfirm(false)}
                  className="flex-1 h-12"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setShowSubmitConfirm(false);
                    handleSubmitTest();
                  }}
                  className="flex-1 h-12 bg-gradient-to-r from-red-600 to-primary"
                >
                  Yes, Submit
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MockTest;
