import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { ProgressSection } from "@/components/ProgressSection";
import { CategoryPills } from "@/components/CategoryPills";
import { ContentCarousel } from "@/components/ContentCarousel";
import { SubjectsSection } from "@/components/SubjectsSection";
import { RankSection } from "@/components/RankSection";
import { Footer } from "@/components/Footer";
import { DownloadAppBanner } from "@/components/DownloadAppBanner";
import { GameCards } from "@/components/GameCards";
import { NoticeBanner } from "@/components/NoticeBanner";
import { CombatNameModal } from "@/components/CombatNameModal";
import { SocialFeedButton } from "@/components/social/SocialFeedButton";

const trendingPYQs = [
  { id: "1", title: "JEE Main 2024", subtitle: "All Subjects PYQs", image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=600&fit=crop", duration: "2000+ Qs", trending: true, year: 2024, type: "pyq" as const },
  { id: "2", title: "JEE Main 2025", subtitle: "Latest PYQs", image: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&h=600&fit=crop", duration: "500+ Qs", trending: true, year: 2025, type: "pyq" as const },
];

const mockTests = [
  { id: "1", title: "JEE Main 2025", subtitle: "Full Mock Test - 3 Hours", image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500&h=300&fit=crop", duration: "3 hrs", trending: true, type: "mock" as const },
];

const Index = () => {
  return (
    <div className="min-h-screen pt-14">
      <DownloadAppBanner />
      <NoticeBanner />
      <Navbar />
      <CombatNameModal />
      <SocialFeedButton />
      <HeroSection />
      <ProgressSection />
      <CategoryPills />
      <GameCards />
      <ContentCarousel title="🔥 Trending PYQs" items={trendingPYQs} />
      <ContentCarousel title="📝 Mock Tests" items={mockTests} variant="large" />
      <SubjectsSection />
      <RankSection />
      <Footer />
    </div>
  );
};

export default Index;