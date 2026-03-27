import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { ProgressSection } from "@/components/ProgressSection";
import { ContentCarousel } from "@/components/ContentCarousel";
import { SubjectsSection } from "@/components/SubjectsSection";
import { Footer } from "@/components/Footer";
import { GameCards } from "@/components/GameCards";
import { NoticeBanner } from "@/components/NoticeBanner";
import { CombatNameModal } from "@/components/CombatNameModal";
import { BecomeMentorBanner } from "@/components/BecomeMentorBanner";
import { MentorshipSection } from "@/components/MentorshipSection";

const trendingPYQs = [
  { id: "1", title: "JEE Main 2024", subtitle: "All Subjects PYQs", image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=600&fit=crop", duration: "2000+ Qs", trending: true, year: 2024, type: "pyq" as const },
  { id: "2", title: "JEE Main 2025", subtitle: "Latest PYQs", image: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&h=600&fit=crop", duration: "500+ Qs", trending: true, year: 2025, type: "pyq" as const },
  { id: "3", title: "JEE Main 2026", subtitle: "Newest PYQs", image: "https://images.unsplash.com/photo-1596496050827-8299e0220de1?w=400&h=600&fit=crop", duration: "150+ Qs", trending: true, year: 2026, type: "pyq" as const },
];

const mockTests = [
  { id: "1", title: "JEE Main 2025", subtitle: "Full Mock Test - 3 Hours", image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500&h=300&fit=crop", duration: "3 hrs", trending: true, type: "mock" as const },
  { id: "2", title: "JEE Main 2026", subtitle: "21 Jan Shift 1 - 3 Hours", image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500&h=300&fit=crop", duration: "3 hrs", trending: true, type: "mock" as const },
];

const Index = () => {
  return (
    <div className="min-h-[100dvh] relative w-full overflow-x-hidden pb-16">
      <div className="flex flex-col min-h-[100dvh]">
        <Navbar />
        <NoticeBanner />
        <CombatNameModal />
        <main className="flex-1">
          <HeroSection />
          <MentorshipSection />
          <GameCards />
          <ContentCarousel title="🔥 Trending PYQs" items={trendingPYQs} />
          <ContentCarousel title="📝 Mock Tests" items={mockTests} variant="large" />
          <SubjectsSection />
          <ProgressSection />
          <BecomeMentorBanner />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Index;
