import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
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
} from "lucide-react";

const API_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;

interface MockTest {
  id: string;
  title: string;
  exam_shift: string;
  exam_year: number;
  date: string;
  duration: string;
  questions: number;
  pattern: string;
  status: string;
  physics_count: number;
  chemistry_count: number;
  maths_count: number;
}

const MockTestList = () => {
  const navigate = useNavigate();
  const { hasAccess, loading: subLoading } = useSubscription();
  const [mockTests, setMockTests] = useState<MockTest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMockTests();
  }, []);

  const fetchMockTests = async () => {
    try {
      const response = await fetch(`${API_URL}/api/mock-tests/available`);
      const data = await response.json();
      
      if (data.success) {
        setMockTests(data.mock_tests || []);
      } else {
        toast.error("Failed to load mock tests");
      }
    } catch (error) {
      console.error("Error fetching mock tests:", error);
      toast.error("Failed to load mock tests");
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

            <h1 className="text-3xl font-bold text-foreground mb-2">Mock Tests</h1>
            <p className="text-muted-foreground">
              Practice with real JEE Main exam patterns
            </p>
          </motion.div>

          <div className="space-y-6">
            {mockTests.map((test, index) => (
              <motion.div
                key={test.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-6 rounded-2xl border border-primary/30"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h2 className="text-xl font-bold text-foreground">{test.title}</h2>
                      <span className="px-2 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-bold">
                        {test.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <span>{test.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        <span>{test.duration}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <FileQuestion className="w-4 h-4" />
                        <span>{test.questions} Questions</span>
                      </div>
                    </div>

                    <div className="glass-card p-4 rounded-xl">
                      <h3 className="text-sm font-semibold text-primary mb-2">📝 Test Pattern</h3>
                      <p className="text-sm text-muted-foreground">{test.pattern}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs">
                        <span className="px-2 py-1 rounded bg-success/20 text-success">+4 Correct</span>
                        <span className="px-2 py-1 rounded bg-destructive/20 text-destructive">-1 Wrong</span>
                        <span className="px-2 py-1 rounded bg-muted text-muted-foreground">0 Unattempted</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button
                      onClick={() => handleStartTest(test.id)}
                      className="bg-gradient-to-r from-red-600 to-primary text-white font-semibold px-8"
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
                        <Crown className="w-3 h-3 text-gold" />
                        Premium required
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MockTestList;
