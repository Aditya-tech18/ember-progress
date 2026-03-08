import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { LatexRenderer } from "@/components/LatexRenderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Clock,
  ChevronLeft,
  Flag,
  AlertTriangle,
  Loader2,
  Send,
  Save,
  Atom,
  FlaskConical,
  Calculator,
  Shield,
  Trophy,
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
}

interface Answer {
  questionId: number;
  userAnswer: string | null;
  isMarkedForReview: boolean;
}

const MAX_SECTION_B_ATTEMPTS = 5;

const subjectConfig = {
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
};

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

const ContestPage = () => {
  const navigate = useNavigate();
  const { contestId } = useParams<{ contestId: string }>();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<number, Answer>>(new Map());
  const [timeLeft, setTimeLeft] = useState(3 * 60 * 60);
  const [selectedSubject, setSelectedSubject] = useState<string>("Physics");
  const [currentSection, setCurrentSection] = useState<"A" | "B">("A");
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [contestData, setContestData] = useState<any>(null);
  const [screenshotBlocked, setScreenshotBlocked] = useState(false);

  const subjects = ["Physics", "Chemistry", "Mathematics"];
  const currentQuestion = questions[currentIndex];
  const isNumerical = currentQuestion && !parseOptions(currentQuestion.options_list).hasOptions;

  // Screenshot prevention
  useEffect(() => {
    const preventScreenshot = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen" || 
          (e.ctrlKey && e.key === "p") || 
          (e.metaKey && e.shiftKey && (e.key === "3" || e.key === "4" || e.key === "5"))) {
        e.preventDefault();
        setScreenshotBlocked(true);
        toast.error("Screenshots are not allowed during the contest!");
        setTimeout(() => setScreenshotBlocked(false), 2000);
      }
    };

    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    document.body.style.userSelect = "none";
    document.body.style.webkitUserSelect = "none";

    window.addEventListener("keydown", preventScreenshot);
    document.addEventListener("contextmenu", preventContextMenu);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        toast.warning("Please don't switch tabs during the contest!");
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.body.style.userSelect = "";
      document.body.style.webkitUserSelect = "";
      window.removeEventListener("keydown", preventScreenshot);
      document.removeEventListener("contextmenu", preventContextMenu);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    initializeContest();
  }, [contestId]);

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

  const initializeContest = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUserId(user.id);

      // Fetch contest data
      if (contestId) {
        const { data: contest } = await supabase
          .from("contests")
          .select("*")
          .eq("contest_id", contestId)
          .single();

        if (contest) {
          setContestData(contest);
          
          const endTime = new Date(contest.end_time).getTime();
          const now = Date.now();
          const remainingSeconds = Math.max(0, Math.floor((endTime - now) / 1000));
          setTimeLeft(remainingSeconds);
        }
      }

      await fetchQuestions();
    } catch (err) {
      console.error("Error initializing contest:", err);
      toast.error("Failed to load contest");
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async () => {
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
    const question = questions.find(q => q.id === questionId);
    if (question) {
      const subjectQuestions = questions.filter(q => q.subject === question.subject);
      const indexInSubject = subjectQuestions.indexOf(question);
      const isInSectionB = indexInSubject >= 20;

      if (isInSectionB && answer.trim() !== "") {
        const currentAnswer = answers.get(questionId);
        const wasEmpty = !currentAnswer?.userAnswer || currentAnswer.userAnswer.trim() === "";
        
        if (wasEmpty) {
          const attemptedCount = getSectionBAttemptedCount(question.subject);
          if (attemptedCount >= MAX_SECTION_B_ATTEMPTS) {
            toast.error(`You can only attempt ${MAX_SECTION_B_ATTEMPTS} questions in Section B per subject.`);
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
      const nextQuestion = questions[currentIndex + 1];
      if (nextQuestion) {
        const subjectQuestions = questions.filter(q => q.subject === nextQuestion.subject);
        const indexInSubject = subjectQuestions.indexOf(nextQuestion);
        setCurrentSection(indexInSubject < 20 ? "A" : "B");
        setSelectedSubject(nextQuestion.subject);
      }
    }
  };

  const getSubjectQuestions = (subject: string, section: "A" | "B") => {
    const subjectQuestions = questions.filter((q) => q.subject === subject);
    if (section === "A") {
      return subjectQuestions.slice(0, 20);
    }
    return subjectQuestions.slice(20);
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
    if (!userId || !contestId) {
      toast.error("Missing required data");
      return;
    }

    try {
      let totalScore = 0;

      questions.forEach((q) => {
        const answer = answers.get(q.id);
        const userAnswer = answer?.userAnswer?.trim() || "";
        const correctAnswer = q.correct_answer?.trim() || "";

        if (userAnswer && userAnswer === correctAnswer) {
          totalScore += 4;
        } else if (userAnswer) {
          totalScore -= 1;
        }
      });

      // Update participant with score
      const { error } = await supabase
        .from("contest_participants")
        .update({
          total_marks: totalScore,
          submitted_at: new Date().toISOString(),
        })
        .eq("contest_id", contestId)
        .eq("user_id", userId);

      if (error) throw error;

      // Update ranks
      await supabase.rpc("update_contest_ranks", { p_contest_id: contestId });

      toast.success(`Contest submitted! Your score: ${totalScore}/300`);
      navigate("/weekly-contest");
    } catch (err) {
      console.error("Error submitting contest:", err);
      toast.error("Failed to submit contest");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading contest...</p>
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
          <Button onClick={() => navigate("/weekly-contest")} className="mt-4">
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
    <div className={`min-h-screen bg-background flex flex-col ${screenshotBlocked ? 'blur-lg' : ''}`}>
      {/* Screenshot Block Overlay */}
      {screenshotBlocked && (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
          <div className="text-center text-white">
            <Shield className="w-24 h-24 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold">Screenshots Blocked!</h2>
            <p className="text-muted-foreground">Screenshots are not allowed during the contest.</p>
          </div>
        </div>
      )}

      {/* Fixed Header */}
      <div className="sticky top-0 z-50 bg-card/95 backdrop-blur-lg border-b border-border shadow-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
                <Trophy className="w-3 h-3 mr-1" />
                Weekly Contest
              </Badge>
              <span className="font-bold text-foreground text-lg hidden md:inline">
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

      {/* Subject Tabs */}
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

      {/* Question Palette */}
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
            <div className="flex items-center justify-between mb-4">
              <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold">
                Q.{currentQuestionIndexInSection + 1}
              </span>
            </div>

            {currentQuestion.question_image_url && (
              <div className="mb-6 rounded-xl overflow-hidden bg-muted/50">
                <img
                  src={currentQuestion.question_image_url}
                  alt="Question"
                  className="w-full h-auto max-h-80 object-contain pointer-events-none"
                  draggable={false}
                />
              </div>
            )}

            <div className="mb-8">
              <div className="text-lg leading-relaxed text-foreground whitespace-pre-wrap">
                <LatexRenderer content={currentQuestion.question_text} />
              </div>
            </div>

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
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border shadow-2xl">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="flex-1 h-12 text-sm sm:text-base font-semibold"
            >
              <ChevronLeft className="w-5 h-5 mr-1 sm:mr-2" />
              Previous
            </Button>

            <Button
              variant="outline"
              onClick={() => handleMarkForReview(currentQuestion.id)}
              className={`flex-1 h-12 text-sm sm:text-base font-semibold ${
                currentAnswer?.isMarkedForReview 
                  ? "border-gold text-gold bg-gold/10" 
                  : ""
              }`}
            >
              <Flag className={`w-5 h-5 mr-1 sm:mr-2 ${currentAnswer?.isMarkedForReview ? "fill-gold" : ""}`} />
              Mark
            </Button>

            <Button
              onClick={handleSaveAndNext}
              disabled={currentIndex === questions.length - 1}
              className="flex-1 h-12 text-sm sm:text-base font-semibold bg-gradient-to-r from-success to-emerald-500"
            >
              <Save className="w-5 h-5 mr-1 sm:mr-2" />
              Save & Next
            </Button>

            <Button
              onClick={() => setShowSubmitConfirm(true)}
              className="flex-1 h-12 text-sm sm:text-base font-semibold bg-gradient-to-r from-destructive to-red-600"
            >
              <Send className="w-5 h-5 mr-1 sm:mr-2" />
              Submit
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
              <h3 className="text-2xl font-bold text-foreground mb-4">✅ Submit Contest?</h3>
              <p className="text-muted-foreground mb-6">
                Are you sure you want to submit? You won't be able to change your answers after submission.
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
                  className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-primary"
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

export default ContestPage;
