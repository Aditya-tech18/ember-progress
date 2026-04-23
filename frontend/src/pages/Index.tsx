import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { ContentCarousel } from "@/components/ContentCarousel";
import { SubjectsSection } from "@/components/SubjectsSection";
import { Footer } from "@/components/Footer";
import { GameCards } from "@/components/GameCards";
import { NoticeBanner } from "@/components/NoticeBanner";
import { CombatNameModal } from "@/components/CombatNameModal";
import { BecomeMentorBanner } from "@/components/BecomeMentorBanner";
import { MentorshipSection } from "@/components/MentorshipSection";
import { HomeStatsDashboard } from "@/components/HomeStatsDashboard";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import { getCachedGoal } from "@/utils/examConfig";

const jeeTrendingPYQs = [
  { id: "1", title: "JEE Main 2024", subtitle: "All Subjects PYQs", image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=600&fit=crop", duration: "2000+ Qs", trending: true, year: 2024, type: "pyq" as const },
  { id: "2", title: "JEE Main 2025", subtitle: "Latest PYQs", image: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&h=600&fit=crop", duration: "500+ Qs", trending: true, year: 2025, type: "pyq" as const },
  { id: "3", title: "JEE Main 2026", subtitle: "Newest PYQs", image: "https://images.unsplash.com/photo-1596496050827-8299e0220de1?w=400&h=600&fit=crop", duration: "150+ Qs", trending: true, year: 2026, type: "pyq" as const },
];

const jeeMockTests = [
  { id: "1", title: "JEE Main 2025", subtitle: "Full Mock Test - 3 Hours", image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500&h=300&fit=crop", duration: "3 hrs", trending: true, type: "mock" as const },
  { id: "2", title: "JEE Main 2026", subtitle: "21 Jan Shift 1 - 3 Hours", image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500&h=300&fit=crop", duration: "3 hrs", trending: true, type: "mock" as const },
];

const neetTrendingPYQs = [
  { id: "1", title: "NEET 2024", subtitle: "All Subjects PYQs", image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&h=600&fit=crop", duration: "200+ Qs", trending: true, year: 2024, type: "pyq" as const },
  { id: "2", title: "NEET 2025", subtitle: "Latest PYQs", image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=600&fit=crop", duration: "180+ Qs", trending: true, year: 2025, type: "pyq" as const },
  { id: "3", title: "NEET 2023", subtitle: "Practice Set", image: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400&h=600&fit=crop", duration: "200+ Qs", trending: true, year: 2023, type: "pyq" as const },
];

const neetMockTests = [
  { id: "neet_2025", title: "NEET 2025", subtitle: "Full Mock Test - 3 hrs 20 min", image: "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=500&h=300&fit=crop", duration: "3 hrs 20 min", trending: true, type: "mock" as const },
  { id: "neet_2024", title: "NEET 2024", subtitle: "Full Mock Test - 3 hrs 20 min", image: "https://images.unsplash.com/photo-1581595220892-b0739db3ba8c?w=500&h=300&fit=crop", duration: "3 hrs 20 min", trending: true, type: "mock" as const },
  { id: "neet_2023", title: "NEET 2023", subtitle: "Full Mock Test - 3 hrs 20 min", image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=500&h=300&fit=crop", duration: "3 hrs 20 min", trending: true, type: "mock" as const },
  { id: "neet_2022", title: "NEET 2022", subtitle: "Full Mock Test - 3 hrs 20 min", image: "https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=500&h=300&fit=crop", duration: "3 hrs 20 min", trending: true, type: "mock" as const },
];

const Index = () => {
  const goal = getCachedGoal();
  const isNEET = goal === "NEET";
  const trendingPYQs = isNEET ? neetTrendingPYQs : jeeTrendingPYQs;
  const mockTests = isNEET ? neetMockTests : jeeMockTests;
  const pyqTitle = isNEET ? "🔥 Trending NEET PYQs" : "🔥 Trending PYQs";

  return (
    <div className="min-h-[100dvh] relative w-full overflow-x-hidden pb-16">
      <div className="flex flex-col min-h-[100dvh]">
        <Navbar />
        <NoticeBanner />
        {/* Spacer for fixed navbar - accounts for navbar height (~64px) + NoticeBanner */}
        <div className="h-16" />
        <AnnouncementBanner />
        <CombatNameModal />
        <main className="flex-1">
          <HeroSection />
          {/* Stats dashboard sits directly under the 3 CTA buttons (Success Planner / Practice PYQs / Progress) */}
          <HomeStatsDashboard />
          <MentorshipSection />
          <GameCards />
          <ContentCarousel title={pyqTitle} items={trendingPYQs} />
          <ContentCarousel title="📝 Mock Tests" items={mockTests} variant="large" />
          <SubjectsSection />
          <BecomeMentorBanner />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Index;
