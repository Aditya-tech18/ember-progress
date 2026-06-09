import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SubjectProgress {
  total: number;
  solved: number;
}

interface UserProgress {
  physics: SubjectProgress;
  chemistry: SubjectProgress;
  mathematics: SubjectProgress;
  totalSolved: number;
  totalQuestions: number;
}

const RANKS = [
  { name: "Recruit", minQuestions: 0, icon: "🔰" },
  { name: "Cadet", minQuestions: 50, icon: "⭐" },
  { name: "Sergeant", minQuestions: 200, icon: "🌟" },
  { name: "Commander", minQuestions: 500, icon: "🎖️" },
  { name: "Major", minQuestions: 1000, icon: "🏅" },
  { name: "Marshal", minQuestions: 2000, icon: "👑" },
];

export function useUserProgress() {
  const [progress, setProgress] = useState<UserProgress>({
    physics: { total: 0, solved: 0 },
    chemistry: { total: 0, solved: 0 },
    mathematics: { total: 0, solved: 0 },
    totalSolved: 0,
    totalQuestions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [currentRank, setCurrentRank] = useState(RANKS[0]);
  const [nextRank, setNextRank] = useState<typeof RANKS[0] | null>(RANKS[1]);
  const [questionsToNextRank, setQuestionsToNextRank] = useState(50);

  const fetchProgress = useCallback(async () => {
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Get total questions per subject
      const { data: questionsData } = await supabase
        .from("questions")
        .select("subject");

      const subjectTotals: Record<string, number> = {
        Physics: 0,
        Chemistry: 0,
        Mathematics: 0,
      };

      questionsData?.forEach((q) => {
        const subject = q.subject || "";
        if (subjectTotals.hasOwnProperty(subject)) {
          subjectTotals[subject]++;
        }
      });

      if (!user) {
        setProgress({
          physics: { total: subjectTotals.Physics, solved: 0 },
          chemistry: { total: subjectTotals.Chemistry, solved: 0 },
          mathematics: { total: subjectTotals.Mathematics, solved: 0 },
          totalSolved: 0,
          totalQuestions: Object.values(subjectTotals).reduce((a, b) => a + b, 0),
        });
        setLoading(false);
        return;
      }

      // Get unique solved questions per subject
      const { data: submissionsData } = await supabase
        .from("submissions")
        .select("question_id")
        .eq("user_id", user.id);

      const solvedQuestionIds = [...new Set(submissionsData?.map((s) => s.question_id).filter(Boolean) || [])];

      const subjectSolved: Record<string, number> = {
        Physics: 0,
        Chemistry: 0,
        Mathematics: 0,
      };

      if (solvedQuestionIds.length > 0) {
        const { data: solvedQuestionsData } = await supabase
          .from("questions")
          .select("id, subject")
          .in("id", solvedQuestionIds);

        solvedQuestionsData?.forEach((q) => {
          const subject = q.subject || "";
          if (subjectSolved.hasOwnProperty(subject)) {
            subjectSolved[subject]++;
          }
        });
      }

      const totalSolved = Object.values(subjectSolved).reduce((a, b) => a + b, 0);

      // Calculate rank
      let current = RANKS[0];
      let next: typeof RANKS[0] | null = null;
      
      for (let i = RANKS.length - 1; i >= 0; i--) {
        if (totalSolved >= RANKS[i].minQuestions) {
          current = RANKS[i];
          next = RANKS[i + 1] || null;
          break;
        }
      }

      setCurrentRank(current);
      setNextRank(next);
      setQuestionsToNextRank(next ? next.minQuestions - totalSolved : 0);

      setProgress({
        physics: { total: subjectTotals.Physics, solved: subjectSolved.Physics },
        chemistry: { total: subjectTotals.Chemistry, solved: subjectSolved.Chemistry },
        mathematics: { total: subjectTotals.Mathematics, solved: subjectSolved.Mathematics },
        totalSolved,
        totalQuestions: Object.values(subjectTotals).reduce((a, b) => a + b, 0),
      });
    } catch (error) {
      console.error("Error fetching progress:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProgress();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchProgress();
    });

    return () => subscription.unsubscribe();
  }, [fetchProgress]);

  return {
    progress,
    loading,
    currentRank,
    nextRank,
    questionsToNextRank,
    refreshProgress: fetchProgress,
  };
}
