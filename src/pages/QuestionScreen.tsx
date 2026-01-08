import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { LatexRenderer } from "@/components/LatexRenderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  BookOpen,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  Hash,
  Calendar,
  Clock,
} from "lucide-react";

interface Question {
  id: number;
  chapter: string | null;
  subject: string | null;
  exam_year: number | null;
  exam_shift: string | null;
  question_text: string;
  question_image_url: string | null;
  options_list: string | null;
  correct_answer: string | null;
  solution: string | null;
}

interface ParsedOptions {
  [key: string]: string;
}

const QuestionScreen = () => {
  const { questionId } = useParams<{ questionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { chapterName?: string; subject?: string; year?: number } | null;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSolution, setShowSolution] = useState(false);

  const currentQuestion = questions[currentIndex];
  const isNumerical = currentQuestion && !parseOptions(currentQuestion.options_list).hasOptions;

  useEffect(() => {
    fetchQuestions();
  }, [questionId, state]);

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);

    try {
      // If we have chapter info, fetch all questions from that chapter/year
      if (state?.chapterName && state?.year) {
        const { data, error: fetchError } = await supabase
          .from("questions")
          .select("*")
          .eq("chapter", state.chapterName)
          .eq("exam_year", state.year)
          .order("id", { ascending: true });

        if (fetchError) throw fetchError;

        if (data && data.length > 0) {
          setQuestions(data);
          
          // Find the index of the requested question
          const idx = data.findIndex((q) => q.id === parseInt(questionId || "0"));
          if (idx !== -1) setCurrentIndex(idx);
        }
      } else {
        // Fetch single question
        const { data, error: fetchError } = await supabase
          .from("questions")
          .select("*")
          .eq("id", parseInt(questionId || "0"))
          .single();

        if (fetchError) throw fetchError;
        if (data) setQuestions([data]);
      }
    } catch (err: any) {
      console.error("Error fetching question:", err);
      setError(err.message || "Failed to load question");
    } finally {
      setLoading(false);
    }
  };

  function parseOptions(optionsList: string | null): { hasOptions: boolean; options: ParsedOptions } {
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

  const handleOptionSelect = (optionKey: string) => {
    if (isSubmitted) return;
    setSelectedOption(optionKey);
  };

  const handleSubmit = async () => {
    if (!currentQuestion) return;
    
    if (isNumerical && !userAnswer.trim()) {
      toast.error("Please enter your answer");
      return;
    }
    if (!isNumerical && !selectedOption) {
      toast.error("Please select an option");
      return;
    }

    const userChoice = isNumerical ? userAnswer.trim() : selectedOption;
    const isCorrect = userChoice === currentQuestion.correct_answer;

    setIsSubmitted(true);
    setShowSolution(true);

    if (isCorrect) {
      toast.success("🎉 Correct Answer!", { duration: 2000 });
    } else {
      toast.error("❌ Incorrect", { duration: 2000 });
    }

    // Record submission
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("submissions").insert({
          user_id: user.id,
          question_id: currentQuestion.id,
          submitted_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error("Error recording submission:", err);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      resetState();
    } else {
      toast.success("🎉 Chapter completed!");
      navigate(-1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      resetState();
    }
  };

  const resetState = () => {
    setSelectedOption(null);
    setUserAnswer("");
    setIsSubmitted(false);
    setShowSolution(false);
  };

  const getOptionStyle = (optionKey: string) => {
    if (!isSubmitted) {
      return selectedOption === optionKey ? "border-primary bg-primary/10" : "border-border hover:border-primary/50";
    }

    const isCorrect = optionKey === currentQuestion?.correct_answer;
    const isSelected = optionKey === selectedOption;

    if (isCorrect) {
      return "border-success bg-success/10";
    }
    if (isSelected && !isCorrect) {
      return "border-destructive bg-destructive/10";
    }
    return "border-border opacity-60";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[80vh]">
          <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">Loading question...</p>
        </div>
      </div>
    );
  }

  if (error || !currentQuestion) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[80vh]">
          <AlertCircle className="w-12 h-12 text-destructive mb-4" />
          <p className="text-destructive mb-4">{error || "Question not found"}</p>
          <Button onClick={() => navigate(-1)} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const { options } = parseOptions(currentQuestion.options_list);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-20 pb-32">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mb-4 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Questions
            </Button>

            <div className="flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium">
                  <BookOpen className="w-4 h-4 mr-1.5" />
                  {currentQuestion.chapter}
                </span>
                <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-muted text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5 mr-1.5" />
                  {currentQuestion.exam_year}
                </span>
                <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-muted text-muted-foreground">
                  <Clock className="w-3.5 h-3.5 mr-1.5" />
                  {currentQuestion.exam_shift}
                </span>
              </div>

              <div className="text-muted-foreground font-medium">
                {currentIndex + 1} / {questions.length}
              </div>
            </div>
          </motion.div>

          {/* Question Card */}
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-6 md:p-8 mb-6"
          >
            {/* Question Image */}
            {currentQuestion.question_image_url && (
              <div className="mb-6 rounded-lg overflow-hidden bg-muted/50">
                <img
                  src={currentQuestion.question_image_url}
                  alt="Question diagram"
                  className="w-full h-auto max-h-80 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}

            {/* Question Text */}
            <div className="mb-8">
              <div className="flex items-start gap-3 mb-4">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/20 text-primary font-bold text-sm shrink-0">
                  Q
                </span>
                <div className="flex-1 text-lg leading-relaxed text-foreground overflow-x-auto question-scroll">
                  <LatexRenderer content={currentQuestion.question_text} />
                </div>
              </div>
            </div>

            {/* Options or Numerical Input */}
            <div className="space-y-3">
              {isNumerical ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Hash className="w-5 h-5 text-primary" />
                    <span className="text-muted-foreground">Enter your numerical answer:</span>
                  </div>
                  <div className="relative">
                    <Input
                      type="text"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      disabled={isSubmitted}
                      placeholder="Type your answer..."
                      className={`text-2xl h-16 text-center font-mono ${
                        isSubmitted
                          ? userAnswer === currentQuestion.correct_answer
                            ? "border-success bg-success/10"
                            : "border-destructive bg-destructive/10"
                          : "border-primary"
                      }`}
                    />
                  </div>
                  {isSubmitted && userAnswer !== currentQuestion.correct_answer && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 p-4 rounded-lg bg-success/10 border border-success"
                    >
                      <CheckCircle2 className="w-5 h-5 text-success" />
                      <span className="text-success font-medium">
                        Correct Answer: {currentQuestion.correct_answer}
                      </span>
                    </motion.div>
                  )}
                </div>
              ) : (
                Object.entries(options).map(([key, value]) => {
                  const isImageOption = typeof value === "string" && value.startsWith("http");
                  const isCorrect = key === currentQuestion.correct_answer;
                  const isSelected = key === selectedOption;

                  return (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => handleOptionSelect(key)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${getOptionStyle(key)} ${
                        isSubmitted ? "cursor-default" : ""
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold shrink-0 ${
                            isSubmitted && isCorrect
                              ? "bg-success text-success-foreground"
                              : isSubmitted && isSelected && !isCorrect
                              ? "bg-destructive text-destructive-foreground"
                              : isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {isSubmitted && isCorrect ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : isSubmitted && isSelected && !isCorrect ? (
                            <XCircle className="w-5 h-5" />
                          ) : (
                            key
                          )}
                        </div>
                        <div className="flex-1 overflow-x-auto question-scroll">
                          {isImageOption ? (
                            <img
                              src={value}
                              alt={`Option ${key}`}
                              className="max-h-20 object-contain"
                            />
                          ) : (
                            <LatexRenderer content={value} />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>

          {/* Solution */}
          <AnimatePresence>
            {showSolution && currentQuestion.solution && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="glass-card p-6 md:p-8 mb-6 overflow-hidden"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center">
                    <Lightbulb className="w-5 h-5 text-gold" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Solution</h3>
                </div>
                <div className="text-muted-foreground leading-relaxed overflow-x-auto question-scroll">
                  <LatexRenderer content={currentQuestion.solution} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border p-4">
        <div className="container mx-auto max-w-4xl flex items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="flex-1 sm:flex-none"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {!isSubmitted ? (
            <Button
              onClick={handleSubmit}
              disabled={isNumerical ? !userAnswer.trim() : !selectedOption}
              className="flex-1 sm:flex-none bg-gradient-to-r from-primary to-crimson text-primary-foreground font-semibold px-8"
            >
              Submit Answer
            </Button>
          ) : currentIndex < questions.length - 1 ? (
            <Button
              onClick={handleNext}
              className="flex-1 sm:flex-none bg-gradient-to-r from-primary to-crimson text-primary-foreground font-semibold px-8"
            >
              Next Question
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={() => navigate(-1)}
              className="flex-1 sm:flex-none bg-gradient-to-r from-success to-emerald text-success-foreground font-semibold px-8"
            >
              Finish
              <CheckCircle2 className="w-4 h-4 ml-2" />
            </Button>
          )}

          <Button
            variant="outline"
            onClick={handleNext}
            disabled={currentIndex === questions.length - 1}
            className="flex-1 sm:flex-none"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuestionScreen;