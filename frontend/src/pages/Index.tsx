import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { ContentCarousel } from "@/components/ContentCarousel";
import { Footer } from "@/components/Footer";
import { GameCards } from "@/components/GameCards";
import { NoticeBanner } from "@/components/NoticeBanner";
import { CombatNameModal } from "@/components/CombatNameModal";
import { FeatureCardsRow } from "@/components/FeatureCardsRow";
import { HomeStatsDashboard } from "@/components/HomeStatsDashboard";
import { BecomeMentorBanner } from "@/components/BecomeMentorBanner";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import { getCachedGoal } from "@/utils/examConfig";
import { supabase } from "@/integrations/supabase/client";

type CarouselItem = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  duration: string;
  trending?: boolean;
  year?: number;
  type: "pyq" | "mock";
};

// Royalty-free Unsplash gradients used as fallback hero artwork per card
const cardImages = [
  "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1596496050827-8299e0220de1?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&h=400&fit=crop",
];

const pickImage = (key: string) => {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return cardImages[h % cardImages.length];
};

const Index = () => {
  const navigate = useNavigate();
  const goal = getCachedGoal();
  const isNEET = goal === "NEET";
  const pyqTitle = isNEET ? "🔥 Trending NEET PYQs" : "🔥 Trending PYQs";

  const [pyqCards, setPyqCards] = useState<CarouselItem[]>([]);
  const [mockCards, setMockCards] = useState<CarouselItem[]>([]);

  useEffect(() => {
    loadDynamicCards();
  }, [isNEET]);

  const loadDynamicCards = async () => {
    try {
      if (isNEET) {
        // PYQ years — only years with questions actually uploaded
        const { data: pyq } = await supabase
          .from("neet_questions")
          .select("exam_year")
          .not("exam_year", "is", null);
        const yearCount: Record<number, number> = {};
        (pyq || []).forEach((r: any) => {
          if (r.exam_year) yearCount[r.exam_year] = (yearCount[r.exam_year] || 0) + 1;
        });
        const pyqList: CarouselItem[] = Object.entries(yearCount)
          .map(([year, count]) => ({
            id: `pyq_neet_${year}`,
            title: `NEET ${year}`,
            subtitle: `${count}+ Questions`,
            image: pickImage(`neet_${year}`),
            duration: `${count}+ Qs`,
            trending: true,
            year: Number(year),
            type: "pyq" as const,
          }))
          .sort((a, b) => (b.year || 0) - (a.year || 0));
        setPyqCards(pyqList);

        // Mock tests — only auto-created entries in neet_mock_tests
        const { data: mocks } = await supabase
          .from("neet_mock_tests")
          .select("test_id, title, exam_shift, exam_year")
          .eq("is_active", true)
          .eq("is_published", true)
          .order("exam_year", { ascending: false });
        const mockList: CarouselItem[] = (mocks || []).map((m: any) => ({
          id: m.test_id,
          title: `NEET ${m.exam_year}`,
          subtitle: `${(m.exam_shift || "").replace(/^NEET \d{4}\s*/, "") || "Full Paper"} · 180 Qs · 200 min`,
          image: pickImage(m.test_id),
          duration: "3 hrs 20 min",
          trending: true,
          type: "mock" as const,
        }));
        setMockCards(mockList);
      } else {
        // JEE
        const { data: q } = await supabase
          .from("questions")
          .select("exam_year, exam_shift, subject, options_list");

        const yearCount: Record<number, number> = {};
        (q || []).forEach((r: any) => {
          if (r.exam_year) yearCount[r.exam_year] = (yearCount[r.exam_year] || 0) + 1;
        });
        const pyqList: CarouselItem[] = Object.entries(yearCount)
          .map(([year, count]) => ({
            id: `pyq_jee_${year}`,
            title: `JEE Main ${year}`,
            subtitle: `${count}+ Questions`,
            image: pickImage(`jee_${year}`),
            duration: `${count}+ Qs`,
            trending: true,
            year: Number(year),
            type: "pyq" as const,
          }))
          .sort((a, b) => (b.year || 0) - (a.year || 0));
        setPyqCards(pyqList);

        // JEE mocks: shift with ≥25 of each Physics/Chemistry/Mathematics
        type Agg = { shift: string; year: number; subjects: Record<string, number> };
        const groups: Record<string, Agg> = {};
        (q || []).forEach((r: any) => {
          const s = r.exam_shift;
          if (!s) return;
          if (!groups[s]) groups[s] = { shift: s, year: r.exam_year, subjects: {} };
          if (r.subject) groups[s].subjects[r.subject] = (groups[s].subjects[r.subject] || 0) + 1;
        });
        const mockList: CarouselItem[] = Object.values(groups)
          .filter(
            (g) =>
              (g.subjects["Physics"] || 0) >= 25 &&
              (g.subjects["Chemistry"] || 0) >= 25 &&
              (g.subjects["Mathematics"] || 0) >= 25,
          )
          .map((g) => ({
            id: encodeURIComponent(g.shift),
            title: `JEE ${g.year || ""}`.trim(),
            subtitle: `${g.shift} · 90 Qs · 3 hrs`,
            image: pickImage(g.shift),
            duration: "3 hrs",
            trending: true,
            type: "mock" as const,
          }))
          .sort((a, b) => b.title.localeCompare(a.title));
        setMockCards(mockList);
      }
    } catch (e) {
      console.warn("Index: failed to load dynamic cards", e);
    }
  };

  return (
    <div className="min-h-[100dvh] relative w-full overflow-x-hidden pb-16">
      <div className="flex flex-col min-h-[100dvh]">
        <Navbar />
        <NoticeBanner />
        {/* Spacer for fixed navbar - accounts for navbar height (~64px) + NoticeBanner */}
        <div className="h-16" />
        <AnnouncementBanner />
        <CombatNameModal />

        {/* Floating Explore Plans cloud — bottom-right, sits above the bottom nav */}
        <motion.button
          initial={{ opacity: 0, scale: 0.7, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => navigate("/subscription")}
          aria-label="Explore Plans"
          style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 64px)" }}
          className="fixed right-3 z-40 flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-gradient-to-r from-primary via-orange-500 to-amber-400 text-white text-xs font-bold shadow-lg shadow-primary/50 ring-1 ring-white/20 backdrop-blur-md"
        >
          <span className="absolute inset-0 rounded-full bg-primary/40 blur-md -z-10 animate-pulse" />
          <Sparkles className="w-3.5 h-3.5" />
          <span className="whitespace-nowrap">Explore Plans</span>
        </motion.button>

        <main className="flex-1">
          <HeroSection />
          {/* Stats dashboard sits directly under the 3 CTA buttons (Success Planner / Practice PYQs / Progress) */}
          <HomeStatsDashboard />
          <FeatureCardsRow />
          <GameCards />
          {pyqCards.length > 0 && <ContentCarousel title={pyqTitle} items={pyqCards} />}
          {mockCards.length > 0 && (
            <ContentCarousel title="📝 Test Series" items={mockCards} variant="large" />
          )}
          <BecomeMentorBanner />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Index;
