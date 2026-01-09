import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { LatexRenderer } from "@/components/LatexRenderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  BookOpen,
  Send,
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

const MockTest = () => {
  const navigate = useNavigate();
  const { testId } = useParams<{ testId: string }>();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<number, Answer>>(new Map());
  const [timeLeft, setTimeLeft] = useState(3 * 60 * 60); // 3 hours in seconds
  const [selectedSubject, setSelectedSubject] = useState<string>("Physics");
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

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
      // Fetch questions with ID starting with 2025242 (April 2 2025 Shift 2)
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .like("id", "2025%")
        .order("id", { ascending: true })
        .limit(90);

      if (error) throw error;

      if (data && data.length > 0) {
        setQuestions(data);
        // Initialize answers
        const initialAnswers = new Map<number, Answer>();
        data.forEach((q) => {
          initialAnswers.set(q.id, {
            questionId: q.id,
            userAnswer: null,
            isMarkedForReview: false,
          });
        });
        setAnswers(initialAnswers);
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

  const handleAnswerChange = (questionId: number, answer: string) => {
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

  const handleSubmitTest = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please login to submit test");
        return;
      }

      // Calculate scores
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
        state: {
          answers: Object.fromEntries(answers),
          questions,
        },
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

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="font-bold text-foreground">Mock Test</span>
              <span className="text-sm text-muted-foreground">
                Q.{currentIndex + 1}/{questions.length}
              </span>
            </div>

            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${timeLeft < 600 ? "bg-destructive/20 text-destructive" : "bg-primary/20 text-primary"}`}>
              <Clock className="w-4 h-4" />
              <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
            </div>

            <Button
              onClick={() => setShowSubmitConfirm(true)}
              className="bg-gradient-to-r from-purple-600 to-primary"
            >
              <Send className="w-4 h-4 mr-2" />
              Submit Test
            </Button>
          </div>
        </div>
      </div>

      <div className="pt-20 pb-32">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Question Panel */}
            <div className="lg:col-span-3">
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-card p-6 md:p-8"
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    {currentQuestion.subject}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm">
                    {currentQuestion.chapter}
                  </span>
                </div>

                {currentQuestion.question_image_url && (
                  <div className="mb-6 rounded-lg overflow-hidden bg-muted/50">
                    <img
                      src={currentQuestion.question_image_url}
                      alt="Question"
                      className="w-full h-auto max-h-80 object-contain"
                    />
                  </div>
                )}

                <div className="mb-8">
                  <div className="text-lg leading-relaxed text-foreground overflow-x-auto question-scroll">
                    <LatexRenderer content={currentQuestion.question_text} />
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-3">
                  {isNumerical ? (
                    <div className="space-y-4">
                      <p className="text-muted-foreground">Enter your numerical answer:</p>
                      <Input
                        type="text"
                        value={currentAnswer?.userAnswer || ""}
                        onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                        placeholder="Type your answer..."
                        className="text-2xl h-16 text-center font-mono border-primary"
                      />
                    </div>
                  ) : (
                    Object.entries(options).map(([key, value]) => (
                      <div
                        key={key}
                        onClick={() => handleAnswerChange(currentQuestion.id, key)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                          currentAnswer?.userAnswer === key
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold shrink-0 ${
                              currentAnswer?.userAnswer === key
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {key}
                          </div>
                          <div className="flex-1 overflow-x-auto question-scroll">
                            <LatexRenderer content={value} />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-4 mt-8">
                  <Button
                    variant="outline"
                    onClick={() => handleMarkForReview(currentQuestion.id)}
                    className={currentAnswer?.isMarkedForReview ? "border-gold text-gold" : ""}
                  >
                    <Flag className={`w-4 h-4 mr-2 ${currentAnswer?.isMarkedForReview ? "fill-gold" : ""}`} />
                    {currentAnswer?.isMarkedForReview ? "Marked" : "Mark for Review"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleAnswerChange(currentQuestion.id, "")}
                  >
                    Clear Response
                  </Button>
                </div>
              </motion.div>
            </div>

            {/* Question Palette */}
            <div className="lg:col-span-1">
              <div className="glass-card p-4 sticky top-24">
                <h3 className="font-semibold text-foreground mb-4">Question Palette</h3>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {["Physics", "Chemistry", "Mathematics"].map((sub) => (
                    <button
                      key={sub}
                      onClick={() => setSelectedSubject(sub)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        selectedSubject === sub
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {sub.substring(0, 3)}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-5 gap-2 max-h-60 overflow-y-auto">
                  {questions
                    .filter((q) => q.subject === selectedSubject)
                    .map((q, idx) => {
                      const ans = answers.get(q.id);
                      let bgClass = "bg-muted";
                      if (ans?.isMarkedForReview) bgClass = "bg-gold/20 border-gold";
                      else if (ans?.userAnswer) bgClass = "bg-success/20 border-success";
                      
                      return (
                        <button
                          key={q.id}
                          onClick={() => setCurrentIndex(questions.indexOf(q))}
                          className={`w-10 h-10 rounded-lg font-semibold text-sm border-2 ${bgClass} ${
                            questions[currentIndex]?.id === q.id ? "ring-2 ring-primary" : ""
                          }`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                </div>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-success/20 border-2 border-success"></div>
                    <span className="text-muted-foreground">Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gold/20 border-2 border-gold"></div>
                    <span className="text-muted-foreground">Marked for Review</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-muted border-2 border-border"></div>
                    <span className="text-muted-foreground">Not Answered</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border p-4">
        <div className="container mx-auto flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="text-sm text-muted-foreground">
            Question {currentIndex + 1} of {questions.length}
          </div>

          <Button
            onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
            disabled={currentIndex === questions.length - 1}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      <AnimatePresence>
        {showSubmitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-6 rounded-2xl max-w-md mx-4"
            >
              <h3 className="text-xl font-bold text-foreground mb-4">Submit Test?</h3>
              <p className="text-muted-foreground mb-6">
                Are you sure you want to submit the test? You won't be able to change your answers after submission.
              </p>
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setShowSubmitConfirm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitTest}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-primary"
                >
                  Submit
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
