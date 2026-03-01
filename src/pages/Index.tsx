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
import { useNavigate } from "react-router-dom";
import { Video } from "lucide-react";
import { motion } from "framer-motion";

const trendingPYQs = [
  { id: "1", title: "JEE Main 2024", subtitle: "All Subjects PYQs", image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=600&fit=crop", duration: "2000+ Qs", trending: true, year: 2024, type: "pyq" as const },
  { id: "2", title: "JEE Main 2025", subtitle: "Latest PYQs", image: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&h=600&fit=crop", duration: "500+ Qs", trending: true, year: 2025, type: "pyq" as const },
];

const mockTests = [
  { id: "1", title: "JEE Main 2025", subtitle: "Full Mock Test - 3 Hours", image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500&h=300&fit=crop", duration: "3 hrs", trending: true, type: "mock" as const },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative">
      <div className="pt-0">
        <DownloadAppBanner />
        <NoticeBanner />
        <Navbar />
        <CombatNameModal />
        <HeroSection />
        <ProgressSection />
        <CategoryPills />
        <GameCards />
        <ContentCarousel title="🔥 Trending PYQs" items={trendingPYQs} />
        <ContentCarousel title="📝 Mock Tests" items={mockTests} variant="large" />
        <SubjectsSection />
        <div id="rank-section">
          <RankSection />
        </div>
        <Footer />
      </div>

      {/* Floating Focus Room Button */}
      <motion.button
        onClick={() => navigate("/focus-room")}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{
          boxShadow: [
            "0 0 20px hsl(358 84% 50% / 0.3)",
            "0 0 40px hsl(358 84% 50% / 0.6)",
            "0 0 20px hsl(358 84% 50% / 0.3)",
          ],
        }}
        transition={{ boxShadow: { duration: 2, repeat: Infinity } }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center shadow-2xl"
        title="Join or Create Focus Room 🎥"
      >
        <Video className="h-6 w-6 text-primary-foreground" />
      </motion.button>
    </div>
  );
};

export default Index;
