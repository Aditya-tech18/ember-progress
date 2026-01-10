import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription, isChapterFree } from "@/hooks/useSubscription";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Search,
  BookOpen,
  Atom,
  FlaskConical,
  Calculator,
  ChevronRight,
  Loader2,
  FileQuestion,
  Sparkles,
  Lock,
  Crown,
} from "lucide-react";

interface Chapter {
  id: string;
  name: string;
  subject: string;
  jee_year: number;
  is_mains_level: boolean | null;
  questionCount?: number;
}

const subjectConfig = {
  Physics: {
    icon: Atom,
    gradient: "from-electric-blue to-cyan-500",
    bgGradient: "from-electric-blue/20 to-cyan-500/10",
  },
  Chemistry: {
    icon: FlaskConical,
    gradient: "from-primary to-crimson",
    bgGradient: "from-primary/20 to-crimson/10",
  },
  Mathematics: {
    icon: Calculator,
    gradient: "from-gold to-amber-500",
    bgGradient: "from-gold/20 to-amber-500/10",
  },
  Maths: {
    icon: Calculator,
    gradient: "from-gold to-amber-500",
    bgGradient: "from-gold/20 to-amber-500/10",
  },
};

const ChapterSelect = () => {
  const { subject } = useParams<{ subject: string }>();
  const navigate = useNavigate();
  const { hasAccess, loading: subLoading } = useSubscription();
  
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  const decodedSubject = decodeURIComponent(subject || "");
  const config = subjectConfig[decodedSubject as keyof typeof subjectConfig] || subjectConfig.Physics;
  const SubjectIcon = config.icon;

  useEffect(() => {
    fetchChapters();
  }, [decodedSubject]);

  const fetchChapters = async () => {
    setLoading(true);

    try {
      // Fetch chapters
      const { data: chapterData, error: chapterError } = await supabase
        .from("chapters")
        .select("*")
        .eq("subject", decodedSubject)
        .order("name", { ascending: true });

      if (chapterError) throw chapterError;

      // Fetch question counts per chapter
      const { data: questionData, error: questionError } = await supabase
        .from("questions")
        .select("chapter")
        .eq("subject", decodedSubject);

      if (questionError) throw questionError;

      // Count questions per chapter
      const questionCounts: Record<string, number> = {};
      questionData?.forEach((q) => {
        if (q.chapter) {
          questionCounts[q.chapter] = (questionCounts[q.chapter] || 0) + 1;
        }
      });

      // Merge counts with chapters
      const chaptersWithCounts = (chapterData || []).map((chapter) => ({
        ...chapter,
        questionCount: questionCounts[chapter.name] || 0,
      }));

      setChapters(chaptersWithCounts);
    } catch (err) {
      console.error("Error fetching chapters:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredChapters = chapters.filter((chapter) =>
    chapter.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleChapterClick = (chapter: Chapter, index: number) => {
    // Check if user has access (old user or subscribed) or if chapter is free
    const isFree = isChapterFree(index);
    
    if (!hasAccess && !isFree) {
      navigate("/subscription");
      return;
    }
    
    navigate(`/questions/${encodeURIComponent(chapter.name)}?subject=${encodeURIComponent(decodedSubject)}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-20 pb-8">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Header */}
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

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg`}>
                  <SubjectIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">{decodedSubject}</h1>
                  <p className="text-muted-foreground">
                    {filteredChapters.length} Chapters • {filteredChapters.reduce((acc, c) => acc + (c.questionCount || 0), 0)} Questions
                  </p>
                </div>
              </div>

              {/* Search */}
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search chapters..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="pl-10 bg-card border-border"
                />
              </div>
            </div>
          </motion.div>

          {/* Free chapters info */}
          {!hasAccess && !subLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-gold/10 border border-gold/20 flex items-center gap-3"
            >
              <Crown className="w-5 h-5 text-gold shrink-0" />
              <p className="text-sm text-gold">
                First 2 chapters of each subject are <strong>free</strong>! Subscribe to unlock all chapters.
              </p>
            </motion.div>
          )}

          {/* Chapters Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground">Loading chapters...</p>
            </div>
          ) : filteredChapters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <BookOpen className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-lg">No chapters found</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {filteredChapters.map((chapter, index) => {
                const isFree = isChapterFree(index);
                const isLocked = !hasAccess && !isFree;
                
                return (
                  <motion.div
                    key={chapter.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => handleChapterClick(chapter, index)}
                    className={`glass-card-hover p-5 cursor-pointer group relative overflow-hidden ${
                      isLocked ? "opacity-75" : ""
                    }`}
                  >
                    {/* Background gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${config.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                    {/* Lock overlay for locked chapters */}
                    {isLocked && (
                      <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                        <div className="bg-muted/90 rounded-lg px-3 py-1.5 flex items-center gap-2">
                          <Lock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground font-medium">Premium</span>
                        </div>
                      </div>
                    )}

                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
                          <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex items-center gap-2">
                          {isFree && !hasAccess && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-success/20 text-success text-xs font-medium">
                              Free
                            </span>
                          )}
                          {chapter.is_mains_level && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gold/20 text-gold text-xs font-medium">
                              <Sparkles className="w-3 h-3 mr-1" />
                              Mains
                            </span>
                          )}
                        </div>
                      </div>

                      <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {chapter.name}
                      </h3>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <FileQuestion className="w-4 h-4" />
                          <span>{chapter.questionCount} Questions</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <ChevronRight className="w-4 h-4 text-primary group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChapterSelect;
