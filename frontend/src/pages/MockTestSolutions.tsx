import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LatexRenderer } from "@/components/LatexRenderer";
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, Home } from "lucide-react";

interface Question {
  id: number;
  question_text: string;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  option4: string | null;
  correct_answer: string;
  solution: string | null;
  subject: string;
}

export default function MockTestSolutions() {
  const { resultId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSolutions();
  }, [resultId]);

  const fetchSolutions = async () => {
    try {
      // Fetch result
      const { data: result, error: resultError } = await supabase
        .from("mock_test_results")
        .select("*, mock_test_id, answers")
        .eq("id", parseInt(resultId || "0"))
        .single();

      if (resultError) throw resultError;

      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from("questions")
        .select("*")
        .in("question_id", result.answers ? Object.keys(result.answers).map(Number) : [])
        .order("question_id");

      if (questionsError) throw questionsError;

      setQuestions(questionsData || []);
      setUserAnswers(result.answers || {});
    } catch (err) {
      console.error("Error fetching solutions:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading solutions...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">No Solutions Available</h2>
          <Button onClick={() => navigate("/")} className="bg-gradient-to-r from-red-600 to-red-700">
            <Home className="w-4 h-4 mr-2" /> Go Home
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const userAnswer = userAnswers[currentQuestion.id];
  const isCorrect = userAnswer === currentQuestion.correct_answer;
  const wasAttempted = userAnswer !== undefined && userAnswer !== null;

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navbar />

      <div className="pt-20 px-3 sm:px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">Solutions Review</h1>
              <p className="text-muted-foreground">Question {currentIndex + 1} of {questions.length}</p>
            </div>
            <Badge variant="outline" className={`px-4 py-2 ${
              currentQuestion.subject === 'Physics' ? 'border-blue-500/50 text-blue-400' :
              currentQuestion.subject === 'Chemistry' ? 'border-green-500/50 text-green-400' :
              'border-yellow-500/50 text-yellow-400'
            }`}>
              {currentQuestion.subject}
            </Badge>
          </div>

          {/* Question */}
          <Card className="p-6 mb-6 border-2 border-border">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg font-bold text-red-500">Q{currentIndex + 1}.</span>
                {wasAttempted ? (
                  isCorrect ? (
                    <Badge className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" /> Correct</Badge>
                  ) : (
                    <Badge className="bg-red-600"><XCircle className="w-3 h-3 mr-1" /> Wrong</Badge>
                  )
                ) : (
                  <Badge variant="outline">Not Attempted</Badge>
                )}
              </div>
              <LatexRenderer content={currentQuestion.question_text} preserveParagraphs />
            </div>

            {/* Options */}
            {currentQuestion.option1 && (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((num) => {
                  const optionKey = `option${num}` as keyof Question;
                  const optionValue = currentQuestion[optionKey];
                  if (!optionValue || typeof optionValue !== 'string') return null;

                  const optionLabel = String.fromCharCode(64 + num);
                  const isUserAnswer = userAnswer === optionLabel;
                  const isCorrectAnswer = currentQuestion.correct_answer === optionLabel;

                  return (
                    <div
                      key={num}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        isCorrectAnswer
                          ? 'border-green-500 bg-green-500/10'
                          : isUserAnswer
                          ? 'border-red-500 bg-red-500/10'
                          : 'border-border bg-card'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                          isCorrectAnswer
                            ? 'bg-green-600 text-white'
                            : isUserAnswer
                            ? 'bg-red-600 text-white'
                            : 'bg-card-foreground/10'
                        }`}>
                          {optionLabel}
                        </div>
                        <div className="flex-1">
                          <LatexRenderer content={optionValue} />
                        </div>
                        {isCorrectAnswer && <CheckCircle className="w-5 h-5 text-green-500" />}
                        {isUserAnswer && !isCorrectAnswer && <XCircle className="w-5 h-5 text-red-500" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Integer Type Answer */}
            {!currentQuestion.option1 && (
              <div className="mt-4">
                <div className="flex gap-4">
                  <div className={`flex-1 p-4 rounded-xl border-2 ${
                    isCorrect ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10'
                  }`}>
                    <p className="text-sm text-muted-foreground mb-1">Your Answer:</p>
                    <p className="text-xl font-bold">{userAnswer || "Not Answered"}</p>
                  </div>
                  <div className="flex-1 p-4 rounded-xl border-2 border-green-500 bg-green-500/10">
                    <p className="text-sm text-muted-foreground mb-1">Correct Answer:</p>
                    <p className="text-xl font-bold text-green-400">{currentQuestion.correct_answer}</p>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Solution */}
          {currentQuestion.solution ? (
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="w-2 h-8 bg-gradient-to-b from-red-600 to-red-800 rounded" />
                Solution
              </h3>
              <LatexRenderer content={currentQuestion.solution} multilineSolution={true} />
            </div>
          ) : (
            <Card className="p-6 mb-6 border-yellow-500/30 bg-yellow-500/5">
              <p className="text-yellow-400">Solution will be added soon!</p>
            </Card>
          )}

          {/* Navigation */}
          <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border p-4 z-50">
            <div className="container mx-auto max-w-4xl flex items-center justify-between gap-4">
              <Button
                variant="outline"
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
                className="flex-1 sm:flex-none"
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                Previous
              </Button>

              <span className="text-sm text-muted-foreground hidden sm:block">
                {currentIndex + 1} / {questions.length}
              </span>

              {currentIndex < questions.length - 1 ? (
                <Button
                  onClick={() => setCurrentIndex(currentIndex + 1)}
                  className="flex-1 sm:flex-none bg-gradient-to-r from-red-600 to-red-700"
                >
                  Next
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={() => navigate("/mock-tests")}
                  className="flex-1 sm:flex-none bg-gradient-to-r from-green-600 to-emerald-600"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Back to Tests
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}