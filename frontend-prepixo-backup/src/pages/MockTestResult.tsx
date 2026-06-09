import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Trophy,
  Clock,
  CheckCircle2,
  XCircle,
  MinusCircle,
  RotateCcw,
  Eye,
  Home,
} from "lucide-react";

const MockTestResult = () => {
  const navigate = useNavigate();
  const { resultId } = useParams<{ resultId: string }>();
  const location = useLocation();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResult();
  }, [resultId]);

  const fetchResult = async () => {
    try {
      const { data, error } = await supabase
        .from("mock_test_results")
        .select("*")
        .eq("id", parseInt(resultId || "0"))
        .single();

      if (error) throw error;
      setResult(data);
    } catch (err) {
      console.error("Error fetching result:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  if (loading || !result) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading results...</p>
        </div>
      </div>
    );
  }

  const accuracy = result.total_questions_attempted > 0
    ? ((result.total_correct / result.total_questions_attempted) * 100).toFixed(1)
    : "0";

  const subjects = [
    { name: "Physics", score: result.physics_score, correct: result.physics_correct, wrong: result.physics_wrong, unattempted: result.physics_unattempted, color: "text-electric-blue", bg: "bg-electric-blue" },
    { name: "Chemistry", score: result.chemistry_score, correct: result.chemistry_correct, wrong: result.chemistry_wrong, unattempted: result.chemistry_unattempted, color: "text-success", bg: "bg-success" },
    { name: "Mathematics", score: result.maths_score, correct: result.maths_correct, wrong: result.maths_wrong, unattempted: result.maths_unattempted, color: "text-gold", bg: "bg-gold" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <Trophy className="w-16 h-16 text-gold mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-foreground mb-2">Test Completed!</h1>
            <p className="text-muted-foreground">Here's your performance summary</p>
          </motion.div>

          {/* Score Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 rounded-2xl border-2 border-red-500/50 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Score</p>
                <div className="text-5xl font-bold text-red-500">{result.total_score}</div>
                <p className="text-muted-foreground">out of 300</p>
              </div>
              <div className="flex gap-8">
                {result.percentile && (
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Percentile</p>
                    <p className="text-3xl font-bold text-success">{result.percentile.toFixed(2)}%</p>
                  </div>
                )}
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Accuracy</p>
                  <p className="text-3xl font-bold text-primary">{accuracy}%</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Subject Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {subjects.map((sub, idx) => (
              <motion.div key={sub.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + idx * 0.1 }} className="glass-card p-4 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className={`font-semibold ${sub.color}`}>{sub.name}</span>
                  <span className="font-bold text-foreground">{sub.score}/100</span>
                </div>
                <Progress value={(sub.correct / 25) * 100} className="h-2 mb-3" />
                <div className="flex justify-between text-xs">
                  <span className="text-success">✓ {sub.correct}</span>
                  <span className="text-destructive">✗ {sub.wrong}</span>
                  <span className="text-muted-foreground">- {sub.unattempted}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="glass-card p-4 rounded-xl text-center">
              <CheckCircle2 className="w-6 h-6 text-success mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{result.total_correct}</p>
              <p className="text-xs text-muted-foreground">Correct</p>
            </div>
            <div className="glass-card p-4 rounded-xl text-center">
              <XCircle className="w-6 h-6 text-destructive mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{result.total_wrong}</p>
              <p className="text-xs text-muted-foreground">Wrong</p>
            </div>
            <div className="glass-card p-4 rounded-xl text-center">
              <MinusCircle className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{result.total_unattempted}</p>
              <p className="text-xs text-muted-foreground">Unattempted</p>
            </div>
            <div className="glass-card p-4 rounded-xl text-center">
              <Clock className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-lg font-bold text-foreground">{formatTime(result.time_spent_seconds)}</p>
              <p className="text-xs text-muted-foreground">Time Spent</p>
            </div>
          </motion.div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={() => navigate(`/mock-test-solutions/${resultId}`)} 
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <Eye className="w-4 h-4 mr-2" /> View Solutions
            </Button>
            <Button onClick={() => navigate("/mock-tests")} variant="outline" className="flex-1">
              <RotateCcw className="w-4 h-4 mr-2" /> Retake Test
            </Button>
            <Button onClick={() => navigate("/")} className="flex-1 bg-gradient-to-r from-red-600 to-red-700">
              <Home className="w-4 h-4 mr-2" /> Go Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MockTestResult;
