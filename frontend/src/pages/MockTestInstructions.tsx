import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { getCachedGoal, getExamLabel } from "@/utils/examConfig";
import {
  ArrowLeft,
  Rocket,
  BookOpen,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

const MockTestInstructions = () => {
  const navigate = useNavigate();
  const { testId } = useParams<{ testId: string }>();
  const goal = getCachedGoal();
  const isNEET = goal === "NEET";
  const examLabel = getExamLabel(goal);

  // Parse year from testId (e.g. "neet_2025" or "2025_Main")
  const testYear = testId?.match(/\d{4}/)?.[0] || "";

  const handleStartTest = () => {
    navigate(`/mock-test/${testId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Button
              variant="ghost"
              onClick={() => navigate("/mock-tests")}
              className="mb-4 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Mock Tests
            </Button>

            <h1 className="text-3xl font-bold text-foreground mb-2">
              {isNEET ? `NEET ${testYear}` : `JEE Main ${testYear}`}
            </h1>
            <p className="text-muted-foreground">Read all instructions carefully before starting</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 md:p-8 rounded-2xl border border-primary/30"
          >
            {/* General Instructions */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                📋 General Instructions
              </h2>

              <div className="space-y-4">
                <div className="glass-card p-4 rounded-xl">
                  <h3 className="font-semibold text-primary mb-2">Subject Coverage</h3>
                  <ul className="space-y-2 text-muted-foreground text-sm">
                    <li className="flex items-center gap-2">
                      <span className="text-primary">•</span> Physics - Full Syllabus
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">•</span> Chemistry - Full Syllabus
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-primary">•</span> {isNEET ? "Biology (Botany + Zoology)" : "Mathematics"} - Full Syllabus
                    </li>
                  </ul>
                </div>

                <div className="glass-card p-4 rounded-xl">
                  <h3 className="font-semibold text-primary mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    📝 Test Structure
                  </h3>
                  <div className="space-y-2 text-muted-foreground text-sm">
                    {isNEET ? (
                      <>
                        <p className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                          <span><strong>Section A:</strong> 35 MCQs per subject - Attempt all</span>
                        </p>
                        <p className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                          <span><strong>Section B:</strong> 15 MCQs per subject - Attempt any 10</span>
                        </p>
                        <p className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                          <span><strong>Duration:</strong> 3 hours 20 minutes (200 minutes)</span>
                        </p>
                        <p className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                          <span><strong>Total Questions:</strong> 200 (attempt 180)</span>
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                          <span><strong>Section A:</strong> 20 Multiple Choice Questions (MCQs) - Attempt all</span>
                        </p>
                        <p className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                          <span><strong>Section B:</strong> 10 Integer Type Questions - Attempt any 5</span>
                        </p>
                        <p className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                          <span><strong>Duration:</strong> 3 hours (180 minutes)</span>
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Marking Scheme */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-foreground mb-4">⭐ Marking Scheme</h2>
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex-1 min-w-[100px] p-4 rounded-xl bg-success/10 border border-success/30 text-center">
                  <div className="text-2xl font-bold text-success">+4</div>
                  <div className="text-sm text-muted-foreground">Correct</div>
                </div>
                <div className="flex-1 min-w-[100px] p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-center">
                  <div className="text-2xl font-bold text-destructive">-1</div>
                  <div className="text-sm text-muted-foreground">Wrong</div>
                </div>
                <div className="flex-1 min-w-[100px] p-4 rounded-xl bg-muted border border-border text-center">
                  <div className="text-2xl font-bold text-muted-foreground">0</div>
                  <div className="text-sm text-muted-foreground">Unattempted</div>
                </div>
              </div>
              <p className="text-gold font-semibold text-sm">
                Maximum Score: {isNEET ? "720 marks (180 questions × 4 marks)" : "300 marks (75 questions × 4 marks)"}
              </p>
            </div>

            {/* Important Notes */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-gold" />
                ⚠️ Important Notes
              </h2>
              <div className="glass-card p-4 rounded-xl bg-gold/5 border border-gold/20">
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    Timer starts immediately and cannot be paused
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    {isNEET
                      ? "In Section B, you can attempt only 10 out of 15 questions per subject"
                      : "You can select only 5 integer type questions to attempt per subject"}
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    Once submitted, answers cannot be changed
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    Test will auto-submit when time runs out
                  </li>
                </ul>
              </div>
            </div>

            {/* Start Button */}
            <Button
              onClick={handleStartTest}
              className="w-full bg-gradient-to-r from-red-600 to-primary text-white font-bold text-lg py-6"
              size="lg"
            >
              <Rocket className="w-5 h-5 mr-2" />
              🚀 Start Test Now
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default MockTestInstructions;
