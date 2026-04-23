import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription, isChapterFree } from "@/hooks/useSubscription";
import { getCachedGoal, getQuestionsTable } from "@/utils/examConfig";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Search,
  Atom,
  FlaskConical,
  Calculator,
  Loader2,
  Lock,
  Crown,
  Ruler,
  MoveRight,
  Split,
  RefreshCw,
  Zap,
  RotateCw,
  Globe,
  Box,
  Waves,
  Thermometer,
  Flame,
  CircleDot,
  AudioWaveform,
  Volume2,
  Bolt,
  Battery,
  FlashlightOff,
  Compass,
  Cable,
  Wifi,
  Eye,
  Hand,
  Cpu,
  Radio,
  Microscope,
  Sparkles,
  Beaker,
  Layers,
  Table2,
  Link2,
  Cloud,
  Droplets,
  Scale,
  Repeat,
  Gauge,
  Factory,
  Leaf,
  Hexagon,
  Flame as FlameIcon,
  Wine,
  FlaskRound,
  HeartPulse,
  Shapes,
  Home,
  TestTube,
  Grid3X3,
  TrendingUp,
  FunctionSquare,
  Sigma,
  Shuffle,
  Brain,
  Expand,
  Triangle,
  GitBranch,
  Circle,
  BarChart2,
  Minus,
  LineChart,
  AreaChart,
  ArrowRight,
  View,
  SquareStack,
  Dice5,
  Mountain,
  Lightbulb,
  Target,
} from "lucide-react";

// Define chapter data structure
interface ChapterData {
  name: string;
  icon: React.ElementType;
  iconColor: string;
}

// Complete chapter data from Flutter app
const allChaptersData: Record<string, ChapterData[]> = {
  // ==================== PHYSICS - 30 CHAPTERS ====================
  physics: [
    { name: "Units & Dimensions", icon: Ruler, iconColor: "text-green-400" },
    { name: "Motion in 1D", icon: MoveRight, iconColor: "text-blue-400" },
    { name: "Motion in 2D", icon: Split, iconColor: "text-red-400" },
    { name: "Laws of Motion", icon: RefreshCw, iconColor: "text-orange-400" },
    { name: "Work Power Energy", icon: Zap, iconColor: "text-yellow-500" },
    { name: "Rotational Motion", icon: RotateCw, iconColor: "text-red-500" },
    { name: "Gravitation", icon: Globe, iconColor: "text-orange-500" },
    { name: "Properties of Solids", icon: Box, iconColor: "text-green-600" },
    { name: "Properties of Fluids", icon: Waves, iconColor: "text-blue-600" },
    { name: "Thermal Properties", icon: Thermometer, iconColor: "text-red-600" },
    { name: "Thermodynamics", icon: Flame, iconColor: "text-orange-700" },
    { name: "KTG", icon: CircleDot, iconColor: "text-lime-400" },
    { name: "Oscillations", icon: AudioWaveform, iconColor: "text-slate-400" },
    { name: "Waves & Sound", icon: Volume2, iconColor: "text-red-400" },
    { name: "Electrostatics", icon: Bolt, iconColor: "text-indigo-400" },
    { name: "Capacitance", icon: Battery, iconColor: "text-teal-400" },
    { name: "Current Electricity", icon: FlashlightOff, iconColor: "text-red-700" },
    { name: "Magnetic Properties", icon: Compass, iconColor: "text-cyan-700" },
    { name: "Magnetism & Current", icon: Cable, iconColor: "text-orange-600" },
    { name: "EMI", icon: Bolt, iconColor: "text-blue-600" },
    { name: "AC Circuits", icon: Wifi, iconColor: "text-sky-400" },
    { name: "EM Waves", icon: Wifi, iconColor: "text-red-600" },
    { name: "Ray Optics", icon: Eye, iconColor: "text-cyan-400" },
    { name: "Wave Optics", icon: Hand, iconColor: "text-green-500" },
    { name: "Dual Nature", icon: Layers, iconColor: "text-indigo-300" },
    { name: "Atomic Physics", icon: Atom, iconColor: "text-red-400" },
    { name: "Nuclear Physics", icon: Atom, iconColor: "text-orange-700" },
    { name: "Semiconductors", icon: Cpu, iconColor: "text-teal-700" },
    { name: "Communication System", icon: Radio, iconColor: "text-slate-700" },
    { name: "Experimental Physics", icon: Microscope, iconColor: "text-violet-700" },
  ],

  // ==================== CHEMISTRY - 33 CHAPTERS ====================
  chemistry: [
    { name: "Mole Concept", icon: Beaker, iconColor: "text-orange-400" },
    { name: "Atomic Structure", icon: Atom, iconColor: "text-blue-400" },
    { name: "Periodic Table", icon: Table2, iconColor: "text-teal-400" },
    { name: "Chemical Bonding", icon: Link2, iconColor: "text-red-400" },
    { name: "States of Matter", icon: Cloud, iconColor: "text-cyan-400" },
    { name: "Solid State", icon: Box, iconColor: "text-amber-700" },
    { name: "Solutions", icon: Droplets, iconColor: "text-sky-400" },
    { name: "Thermodynamics", icon: Flame, iconColor: "text-red-500" },
    { name: "Chemical Equilibrium", icon: Scale, iconColor: "text-lime-500" },
    { name: "Ionic Equilibrium", icon: Droplets, iconColor: "text-red-500" },
    { name: "Redox Reactions", icon: Repeat, iconColor: "text-slate-500" },
    { name: "Electrochemistry", icon: Battery, iconColor: "text-yellow-500" },
    { name: "Chemical Kinetics", icon: Gauge, iconColor: "text-orange-600" },
    { name: "Surface Chemistry", icon: Layers, iconColor: "text-gray-500" },
    { name: "Hydrogen", icon: Cloud, iconColor: "text-sky-300" },
    { name: "s Block", icon: Grid3X3, iconColor: "text-lime-400" },
    { name: "p Block", icon: Grid3X3, iconColor: "text-indigo-500" },
    { name: "d & f Block", icon: Grid3X3, iconColor: "text-violet-600" },
    { name: "Coordination Compounds", icon: Shapes, iconColor: "text-green-500" },
    { name: "Metallurgy", icon: Factory, iconColor: "text-amber-700" },
    { name: "Environmental Chemistry", icon: Leaf, iconColor: "text-green-500" },
    { name: "General Organic Chemistry", icon: Hexagon, iconColor: "text-amber-500" },
    { name: "Hydrocarbons", icon: FlameIcon, iconColor: "text-orange-500" },
    { name: "Haloalkanes & Haloarenes", icon: Droplets, iconColor: "text-cyan-500" },
    { name: "Alcohols, Phenols & Ethers", icon: Wine, iconColor: "text-fuchsia-400" },
    { name: "Aldehydes & Ketones", icon: FlaskRound, iconColor: "text-orange-600" },
    { name: "Carboxylic Acids", icon: Droplets, iconColor: "text-blue-500" },
    { name: "Amines", icon: CircleDot, iconColor: "text-red-500" },
    { name: "Biomolecules", icon: HeartPulse, iconColor: "text-lime-500" },
    { name: "Polymers", icon: Link2, iconColor: "text-amber-700" },
    { name: "Everyday Chemistry", icon: Home, iconColor: "text-red-400" },
    { name: "Practical Chemistry", icon: TestTube, iconColor: "text-orange-500" },
    { name: "Chemistry in Everyday Life", icon: HeartPulse, iconColor: "text-red-400" },
  ],

  // ==================== MATHS - 34 CHAPTERS ====================
  maths: [
    { name: "Sets & Relations", icon: Grid3X3, iconColor: "text-red-500" },
    { name: "Functions", icon: FunctionSquare, iconColor: "text-orange-600" },
    { name: "Quadratic Equations", icon: FunctionSquare, iconColor: "text-blue-500" },
    { name: "Complex Numbers", icon: Grid3X3, iconColor: "text-orange-600" },
    { name: "Permutations & Combinations", icon: Shuffle, iconColor: "text-lime-500" },
    { name: "Sequences & Series", icon: TrendingUp, iconColor: "text-orange-500" },
    { name: "Mathematical Induction", icon: Brain, iconColor: "text-violet-600" },
    { name: "Binomial Theorem", icon: Expand, iconColor: "text-cyan-500" },
    { name: "Trigonometry", icon: Triangle, iconColor: "text-red-500" },
    { name: "Trigonometric Equations", icon: FunctionSquare, iconColor: "text-red-400" },
    { name: "Inverse Trigonometric Functions", icon: GitBranch, iconColor: "text-red-500" },
    { name: "Straight Lines", icon: TrendingUp, iconColor: "text-green-500" },
    { name: "Circle", icon: Circle, iconColor: "text-indigo-500" },
    { name: "Parabola", icon: BarChart2, iconColor: "text-orange-500" },
    { name: "Ellipse", icon: Circle, iconColor: "text-green-400" },
    { name: "Hyperbola", icon: Waves, iconColor: "text-blue-500" },
    { name: "Limits", icon: Minus, iconColor: "text-red-500" },
    { name: "Continuity & Differentiability", icon: LineChart, iconColor: "text-indigo-500" },
    { name: "Differentiation", icon: TrendingUp, iconColor: "text-teal-500" },
    { name: "Application of Derivatives", icon: BarChart2, iconColor: "text-green-500" },
    { name: "Indefinite Integration", icon: FunctionSquare, iconColor: "text-orange-500" },
    { name: "Definite Integration", icon: Sigma, iconColor: "text-red-500" },
    { name: "Area Under Curves", icon: AreaChart, iconColor: "text-blue-500" },
    { name: "Differential Equations", icon: FunctionSquare, iconColor: "text-red-500" },
    { name: "Vector Algebra", icon: ArrowRight, iconColor: "text-blue-400" },
    { name: "3D Geometry", icon: View, iconColor: "text-blue-600" },
    { name: "Matrices", icon: Grid3X3, iconColor: "text-teal-500" },
    { name: "Determinants", icon: SquareStack, iconColor: "text-indigo-500" },
    { name: "Statistics", icon: BarChart2, iconColor: "text-amber-500" },
    { name: "Probability", icon: Dice5, iconColor: "text-red-500" },
    { name: "Heights & Distances", icon: Mountain, iconColor: "text-green-500" },
    { name: "Properties of Triangles", icon: Triangle, iconColor: "text-red-500" },
    { name: "Mathematical Reasoning", icon: Lightbulb, iconColor: "text-violet-600" },
    { name: "Linear Programming", icon: Target, iconColor: "text-amber-700" },
  ],
};

// ==================== NEET BOTANY CHAPTERS ====================
const neetBotanyChapters: ChapterData[] = [
  { name: "Living World | REDUCED", icon: Leaf, iconColor: "text-green-400" },
  { name: "Bio Classification", icon: Layers, iconColor: "text-teal-400" },
  { name: "Plant Kingdom | REDUCED", icon: Leaf, iconColor: "text-lime-400" },
  { name: "Animal Kingdom", icon: HeartPulse, iconColor: "text-red-400" },
  { name: "Morphology of Plants | REDUCED", icon: Leaf, iconColor: "text-green-500" },
  { name: "Anatomy of Plants | REDUCED", icon: Microscope, iconColor: "text-emerald-400" },
  { name: "Cell Cycle & Division", icon: RefreshCw, iconColor: "text-cyan-400" },
  { name: "Cell - Unit of Life", icon: CircleDot, iconColor: "text-blue-400" },
  { name: "Plant Growth & Dev | REDUCED", icon: TrendingUp, iconColor: "text-lime-500" },
  { name: "Plant Transport | REMOVED", icon: TrendingUp, iconColor: "text-green-600" },
  { name: "Plant Respiration", icon: Flame, iconColor: "text-orange-500" },
  { name: "Mineral Nutrition | REMOVED", icon: Droplets, iconColor: "text-amber-400" },
  { name: "Photosynthesis", icon: Sparkles, iconColor: "text-yellow-400" },
  { name: "Reproduction in Plants", icon: Leaf, iconColor: "text-green-400" },
  { name: "Reproduction | REMOVED", icon: RefreshCw, iconColor: "text-rose-400" },
  { name: "Biomolecules (B) | REDUCED", icon: HeartPulse, iconColor: "text-pink-400" },
  { name: "Environmental Issues | REMOVED", icon: Cloud, iconColor: "text-gray-500" },
  { name: "Biodiversity", icon: Globe, iconColor: "text-teal-600" },
  { name: "Ecosystem | REDUCED", icon: Leaf, iconColor: "text-emerald-500" },
];

// ==================== NEET ZOOLOGY CHAPTERS ====================
const neetZoologyChapters: ChapterData[] = [
  { name: "Structural Org in Animals | REDUCED", icon: Shapes, iconColor: "text-orange-400" },
  { name: "Chemical Coordination", icon: FlaskConical, iconColor: "text-pink-500" },
  { name: "Digestion & Absorption | REMOVED", icon: Beaker, iconColor: "text-orange-400" },
  { name: "Body Fluids & Circulation", icon: HeartPulse, iconColor: "text-red-500" },
  { name: "Neural Control | REDUCED", icon: Brain, iconColor: "text-purple-400" },
  { name: "Excretion", icon: Droplets, iconColor: "text-amber-500" },
  { name: "Breathing & Exchange", icon: Cloud, iconColor: "text-sky-400" },
  { name: "Locomotion & Movement", icon: MoveRight, iconColor: "text-blue-500" },
  { name: "Reproductive Health", icon: HeartPulse, iconColor: "text-pink-400" },
  { name: "Human Reproduction", icon: HeartPulse, iconColor: "text-red-400" },
  { name: "Molecular Inheritance", icon: Atom, iconColor: "text-violet-400" },
  { name: "Inheritance & Variation", icon: GitBranch, iconColor: "text-indigo-400" },
  { name: "Evolution", icon: TrendingUp, iconColor: "text-amber-600" },
  { name: "Health & Diseases", icon: HeartPulse, iconColor: "text-red-600" },
  { name: "Microbes & Welfare", icon: Microscope, iconColor: "text-teal-500" },
  { name: "Food Production Strategies | REMOVED", icon: Factory, iconColor: "text-green-600" },
  { name: "Biotech Applications", icon: Lightbulb, iconColor: "text-yellow-500" },
  { name: "Biotech Principles", icon: Cpu, iconColor: "text-blue-600" },
  { name: "Organisms & Populations", icon: Globe, iconColor: "text-green-500" },
];

// NEET-specific chapter data
const neetChaptersData: Record<string, ChapterData[]> = {
  physics: allChaptersData.physics,
  chemistry: allChaptersData.chemistry,
  botany: neetBotanyChapters,
  zoology: neetZoologyChapters,
};

const subjectConfig = {
  Physics: {
    icon: Atom,
    gradient: "from-electric-blue to-cyan-500",
    bgGradient: "from-electric-blue/20 to-cyan-500/10",
    dbSubject: "physics",
    questionsSubject: "Physics",
  },
  Chemistry: {
    icon: FlaskConical,
    gradient: "from-primary to-crimson",
    bgGradient: "from-primary/20 to-crimson/10",
    dbSubject: "chemistry",
    questionsSubject: "Chemistry",
  },
  Mathematics: {
    icon: Calculator,
    gradient: "from-gold to-amber-500",
    bgGradient: "from-gold/20 to-amber-500/10",
    dbSubject: "maths",
    questionsSubject: "Mathematics",
  },
  Maths: {
    icon: Calculator,
    gradient: "from-gold to-amber-500",
    bgGradient: "from-gold/20 to-amber-500/10",
    dbSubject: "maths",
    questionsSubject: "Mathematics",
  },
  Biology: {
    icon: HeartPulse,
    gradient: "from-emerald to-green-500",
    bgGradient: "from-emerald/20 to-green-500/10",
    dbSubject: "biology",
    questionsSubject: "Biology",
  },
  Botany: {
    icon: Leaf,
    gradient: "from-emerald to-green-500",
    bgGradient: "from-emerald/20 to-green-500/10",
    dbSubject: "botany",
    questionsSubject: "Botany",
  },
  Zoology: {
    icon: HeartPulse,
    gradient: "from-emerald to-teal-500",
    bgGradient: "from-emerald/20 to-teal-500/10",
    dbSubject: "zoology",
    questionsSubject: "Zoology",
  },
};

const availableYears = ["ALL", "2026", ...Array.from({ length: 11 }, (_, i) => (2025 - i).toString())];

const ChapterSelect = () => {
  const { subject } = useParams<{ subject: string }>();
  const navigate = useNavigate();
  const { hasAccess, loading: subLoading } = useSubscription();
  const userGoal = getCachedGoal();
  const questionsTable = getQuestionsTable(userGoal);
  
  const [chapterStats, setChapterStats] = useState<Record<string, { solved: number; total: number }>>({});
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("ALL");

  const decodedSubject = decodeURIComponent(subject || "");
  const config = subjectConfig[decodedSubject as keyof typeof subjectConfig] || subjectConfig.Physics;
  const SubjectIcon = config.icon;

  // Get chapters for this subject - use NEET chapters if goal is NEET
  const chapters = useMemo(() => {
    const chaptersSource = userGoal === 'NEET' ? neetChaptersData : allChaptersData;
    const key = config.dbSubject as keyof typeof chaptersSource;
    return chaptersSource[key] || [];
  }, [config.dbSubject, userGoal]);

  useEffect(() => {
    fetchChapterStats();
  }, [config.questionsSubject]);

  const fetchChapterStats = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Fetch all questions for this subject to get totals
      const { data: questionData } = await supabase
        .from(questionsTable)
        .select("id, chapter")
        .eq("subject", config.questionsSubject);

      const totals: Record<string, number> = {};
      const questionIds: Record<string, number[]> = {};
      
      questionData?.forEach((q) => {
        if (q.chapter) {
          totals[q.chapter] = (totals[q.chapter] || 0) + 1;
          if (!questionIds[q.chapter]) questionIds[q.chapter] = [];
          questionIds[q.chapter].push(q.id);
        }
      });

      // If user is logged in, fetch their submissions
      const stats: Record<string, { solved: number; total: number }> = {};
      
      if (user) {
        const { data: submissions } = await supabase
          .from("submissions")
          .select("question_id")
          .eq("user_id", user.id);

        const solvedSet = new Set(submissions?.map(s => s.question_id) || []);

        chapters.forEach((chapter) => {
          const chapterQuestionIds = questionIds[chapter.name] || [];
          const solvedCount = chapterQuestionIds.filter(id => solvedSet.has(id)).length;
          stats[chapter.name] = {
            solved: solvedCount,
            total: totals[chapter.name] || 0,
          };
        });
      } else {
        chapters.forEach((chapter) => {
          stats[chapter.name] = {
            solved: 0,
            total: totals[chapter.name] || 0,
          };
        });
      }

      setChapterStats(stats);
    } catch (err) {
      console.error("Error fetching chapter stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredChapters = useMemo(() => {
    return chapters.filter((chapter) =>
      chapter.name.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [chapters, searchText]);

  const totalQuestions = useMemo(() => {
    return Object.values(chapterStats).reduce((acc, s) => acc + s.total, 0);
  }, [chapterStats]);

  const handleChapterClick = (chapterName: string, index: number) => {
    const isFree = isChapterFree(index);
    
    if (!hasAccess && !isFree) {
      navigate("/subscription");
      return;
    }
    
    navigate(`/questions/${encodeURIComponent(chapterName)}?subject=${encodeURIComponent(decodedSubject)}`);
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
            className="mb-6"
          >
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="mb-4 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg`}>
                  <SubjectIcon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">Prepixo PYQ Bank</h1>
                  <p className="text-muted-foreground text-sm">
                    {filteredChapters.length} Chapters • {totalQuestions} Questions
                  </p>
                </div>
              </div>
            </div>

            {/* Subject Tabs */}
            <div className="flex gap-2 mb-6">
              {(userGoal === 'NEET'
                ? ["Physics", "Chemistry", "Botany", "Zoology"]
                : ["Physics", "Chemistry", "Mathematics"]
              ).map((sub) => {
                const isSelected = decodedSubject === sub || (decodedSubject === "Maths" && sub === "Mathematics");
                return (
                  <Button
                    key={sub}
                    variant={isSelected ? "default" : "outline"}
                    onClick={() => navigate(`/chapters/${encodeURIComponent(sub)}`)}
                    className={`flex-1 ${isSelected ? "bg-primary text-primary-foreground" : "bg-card border-border"}`}
                  >
                    {sub === "Mathematics" ? "Maths" : sub}
                  </Button>
                );
              })}
            </div>

            {/* Search and Year Filter */}
            <div className="flex gap-3 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                <Input
                  placeholder="Search chapter..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="pl-10 bg-card border-border"
                />
              </div>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-28 bg-card border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          {/* Free chapters info */}
          {!hasAccess && !subLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-xl bg-gold/10 border border-gold/20 flex items-center gap-3"
            >
              <Crown className="w-5 h-5 text-gold shrink-0" />
              <p className="text-sm text-gold">
                First 2 chapters are <strong>free</strong>! Subscribe to unlock all.
              </p>
            </motion.div>
          )}

          {/* Chapters List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground">Loading chapters...</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              {filteredChapters.map((chapter, index) => {
                const isFree = isChapterFree(index);
                const isLocked = !hasAccess && !isFree;
                const stats = chapterStats[chapter.name] || { solved: 0, total: 0 };
                const ChapterIcon = chapter.icon;

                return (
                  <motion.div
                    key={chapter.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    onClick={() => handleChapterClick(chapter.name, index)}
                    className={`bg-card rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-primary/10 border border-border/50 ${
                      isLocked ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
                        <ChapterIcon className="w-6 h-6 text-primary-foreground" />
                      </div>

                      {/* Chapter Name */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground text-base truncate">
                          {chapter.name}
                        </h3>
                        {isFree && !hasAccess && (
                          <span className="text-xs text-success font-medium">Free</span>
                        )}
                      </div>

                      {/* Stats or Lock */}
                      {isLocked ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Lock className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className="text-right shrink-0">
                          <p className="text-success font-bold text-sm">
                            {stats.solved}/{stats.total} Qs
                          </p>
                          <p className="text-xs text-muted-foreground">Total Solved</p>
                        </div>
                      )}
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
