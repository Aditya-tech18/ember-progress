import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { LatexRenderer } from "@/components/LatexRenderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  ArrowLeft, 
  Search, 
  BookOpen, 
  Calendar, 
  Clock, 
  ChevronRight,
  Loader2,
  AlertCircle
} from "lucide-react";

interface Question {
  id: number;
  chapter: string;
  subject: string;
  exam_year: number;
  exam_shift: string;
  question_text: string;
}

const QuestionList = () => {
  const { chapterName } = useParams<{ chapterName: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const decodedChapterName = decodeURIComponent(chapterName || "");
  const subjectFromParams = searchParams.get("subject");

  useEffect(() => {
    fetchQuestions();
  }, [decodedChapterName]);

  const fetchQuestions = async () => {
    if (!decodedChapterName) return;
    
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("questions")
        .select("id, chapter, subject, exam_year, exam_shift, question_text")
        .eq("chapter", decodedChapterName)
        .order("exam_year", { ascending: false });

      if (fetchError) throw fetchError;

      if (data && data.length > 0) {
        setQuestions(data);
        
        // Extract unique years and sort descending
        const uniqueYears = [...new Set(data.map((q) => q.exam_year))].sort((a, b) => b - a);
        setYears(uniqueYears);
        
        // Set default year to latest
        const latestYear = uniqueYears[0]?.toString() || null;
        setSelectedYear(latestYear);
      } else {
        setQuestions([]);
        setYears([]);
      }
    } catch (err: any) {
      console.error("Error fetching questions:", err);
      setError(err.message || "Failed to load questions");
    } finally {
      setLoading(false);
    }
  };

  // Filter questions based on year and search
  useEffect(() => {
    let filtered = questions;

    if (selectedYear) {
      filtered = filtered.filter((q) => q.exam_year === parseInt(selectedYear));
    }

    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(
        (q) =>
          q.question_text?.toLowerCase().includes(search) ||
          q.exam_shift?.toLowerCase().includes(search)
      );
    }

    setFilteredQuestions(filtered);
  }, [questions, selectedYear, searchText]);

  const handleQuestionClick = (question: Question) => {
    navigate(`/question/${question.id}`, {
      state: {
        chapterName: question.chapter,
        subject: question.subject,
        year: question.exam_year,
      },
    });
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
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
              onClick={() => navigate(-1)}
              className="mb-4 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {decodedChapterName}
                </h1>
                <p className="text-muted-foreground">
                  {subjectFromParams && (
                    <span className="text-primary">{subjectFromParams} • </span>
                  )}
                  {filteredQuestions.length} Questions Available
                </p>
              </div>

              {/* Year Selector & Search */}
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <Select value={selectedYear || ""} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-full sm:w-40 bg-card border-border">
                    <Calendar className="w-4 h-4 mr-2 text-primary" />
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search questions..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="pl-10 bg-card border-border"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground">Loading questions...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20">
              <AlertCircle className="w-12 h-12 text-destructive mb-4" />
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={fetchQuestions} variant="outline">
                Try Again
              </Button>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <BookOpen className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-lg">No questions found</p>
              <p className="text-muted-foreground/70 text-sm mt-2">
                Try adjusting your filters
              </p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                {filteredQuestions.map((question, index) => (
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleQuestionClick(question)}
                    className="glass-card-hover p-5 cursor-pointer group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="text-foreground/90 leading-relaxed mb-3 overflow-x-auto question-scroll">
                          <LatexRenderer 
                            content={truncateText(question.question_text)} 
                          />
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                            <Calendar className="w-3 h-3 mr-1.5" />
                            {question.exam_year}
                          </span>
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm">
                            <Clock className="w-3 h-3 mr-1.5" />
                            {question.exam_shift}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-end sm:justify-center">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <ChevronRight className="w-5 h-5 text-primary group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionList;