import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Atom, FlaskConical, Calculator, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SubjectProgress {
  solved: number;
  total: number;
  chapters: number;
}

const subjectConfig = [
  {
    name: "Physics",
    dbName: "Physics", // matches questions.subject
    icon: Atom,
    color: "from-electric-blue to-cyan-500",
    bgColor: "bg-electric-blue/10",
    description: "Mechanics, Thermodynamics, Electromagnetism & more",
  },
  {
    name: "Chemistry",
    dbName: "Chemistry",
    icon: FlaskConical,
    color: "from-primary to-crimson",
    bgColor: "bg-primary/10",
    description: "Organic, Inorganic & Physical Chemistry",
  },
  {
    name: "Mathematics",
    dbName: "Mathematics",
    icon: Calculator,
    color: "from-gold to-amber-500",
    bgColor: "bg-gold/10",
    description: "Calculus, Algebra, Coordinate Geometry & more",
  },
];

export const SubjectsSection = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<Record<string, SubjectProgress>>({});

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Fetch total questions per subject
      const { data: questionsData, error: questionsError } = await supabase
        .from("questions")
        .select("subject");

      if (questionsError) throw questionsError;

      // Fetch chapters count per subject
      const { data: chaptersData, error: chaptersError } = await supabase
        .from("chapters")
        .select("subject");

      if (chaptersError) throw chaptersError;

      // Count totals per subject
      const totals: Record<string, number> = {};
      const chapterCounts: Record<string, number> = {};

      questionsData?.forEach((q) => {
        const subject = q.subject || "";
        totals[subject] = (totals[subject] || 0) + 1;
      });

      chaptersData?.forEach((c) => {
        // Map chapter subject (lowercase) to display name
        const subjectMap: Record<string, string> = {
          physics: "Physics",
          chemistry: "Chemistry",
          maths: "Mathematics",
        };
        const displayName = subjectMap[c.subject.toLowerCase()] || c.subject;
        chapterCounts[displayName] = (chapterCounts[displayName] || 0) + 1;
      });

      // Fetch user submissions if logged in
      let solved: Record<string, number> = {};
      if (user) {
        const { data: submissionsData, error: submissionsError } = await supabase
          .from("submissions")
          .select("question_id")
          .eq("user_id", user.id);

        if (!submissionsError && submissionsData) {
          // Get the question IDs that user has solved
          const solvedQuestionIds = submissionsData.map((s) => s.question_id).filter(Boolean);

          if (solvedQuestionIds.length > 0) {
            // Fetch subjects for these question IDs
            const { data: solvedQuestionsData } = await supabase
              .from("questions")
              .select("id, subject")
              .in("id", solvedQuestionIds);

            solvedQuestionsData?.forEach((q) => {
              const subject = q.subject || "";
              solved[subject] = (solved[subject] || 0) + 1;
            });
          }
        }
      }

      // Build progress object
      const progressData: Record<string, SubjectProgress> = {};
      subjectConfig.forEach((config) => {
        progressData[config.name] = {
          solved: solved[config.dbName] || 0,
          total: totals[config.dbName] || 0,
          chapters: chapterCounts[config.name] || 0,
        };
      });

      setProgress(progressData);
    } catch (error) {
      console.error("Error fetching progress:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectClick = (subjectName: string) => {
    navigate(`/chapters/${encodeURIComponent(subjectName)}`);
  };

  return (
    <section className="py-12 sm:py-20">
      <div className="container mx-auto px-3 sm:px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-4 border border-primary/20">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Practice by Subject</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Choose Your Subject
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Dive deep into each subject with chapter-wise practice
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {subjectConfig.map((subject, index) => {
            const subjectProgress = progress[subject.name] || { solved: 0, total: 0, chapters: 0 };
            const progressPercent = subjectProgress.total > 0 
              ? (subjectProgress.solved / subjectProgress.total) * 100 
              : 0;

            return (
              <motion.div
                key={subject.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="group"
              >
                <div className="glass-card rounded-2xl p-6 hover-lift h-full flex flex-col relative overflow-hidden border border-transparent hover:border-primary/30 transition-colors">
                  {/* Background glow effect */}
                  <div className={`absolute inset-0 ${subject.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  
                  {/* Content */}
                  <div className="relative z-10">
                    {/* Icon */}
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${subject.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <subject.icon className="w-8 h-8 text-white" />
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-2xl font-bold text-foreground mb-2">{subject.name}</h3>
                    <p className="text-muted-foreground text-sm mb-6">{subject.description}</p>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className="flex-1">
                        <div className="text-sm text-muted-foreground mb-1">Progress</div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          {loading ? (
                            <div className="h-full bg-muted-foreground/20 animate-pulse" />
                          ) : (
                            <motion.div
                              initial={{ width: 0 }}
                              whileInView={{ width: `${progressPercent}%` }}
                              viewport={{ once: true }}
                              transition={{ duration: 1, delay: 0.3 }}
                              className={`h-full bg-gradient-to-r ${subject.color} rounded-full`}
                            />
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        ) : (
                          <>
                            <div className="font-bold text-foreground">
                              {subjectProgress.solved}/{subjectProgress.total}
                            </div>
                            <div className="text-xs text-muted-foreground">solved</div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Chapters Badge */}
                    <div className="flex items-center gap-2 mb-6">
                      <span className="px-3 py-1 rounded-full bg-muted text-sm text-muted-foreground">
                        {loading ? "..." : `${subjectProgress.chapters} Chapters`}
                      </span>
                    </div>

                    {/* CTA */}
                    <div className="mt-auto">
                      <Button 
                        onClick={() => handleSubjectClick(subject.name)}
                        className={`w-full bg-gradient-to-r ${subject.color} text-white hover:opacity-90 font-semibold group/btn`}
                      >
                        Continue Learning
                        <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
