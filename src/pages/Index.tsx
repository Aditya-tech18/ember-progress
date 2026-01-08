import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { ProgressSection } from "@/components/ProgressSection";
import { CategoryPills } from "@/components/CategoryPills";
import { ContentCarousel } from "@/components/ContentCarousel";
import { SubjectsSection } from "@/components/SubjectsSection";
import { RankSection } from "@/components/RankSection";
import { Footer } from "@/components/Footer";

const trendingPYQs = [
  { id: "1", title: "JEE Main 2024", subtitle: "Physics - Mechanics", image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=600&fit=crop", rating: 4.8, duration: "45 Qs", trending: true },
  { id: "2", title: "JEE Advanced 2023", subtitle: "Chemistry - Organic", image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=600&fit=crop", rating: 4.9, duration: "30 Qs" },
  { id: "3", title: "NEET 2024", subtitle: "Biology - Botany", image: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=400&h=600&fit=crop", rating: 4.7, duration: "50 Qs" },
  { id: "4", title: "JEE Main 2023", subtitle: "Maths - Calculus", image: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&h=600&fit=crop", rating: 4.6, duration: "35 Qs", trending: true },
  { id: "5", title: "JEE Advanced 2024", subtitle: "Physics - Electro", image: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=400&h=600&fit=crop", rating: 4.8, duration: "40 Qs" },
  { id: "6", title: "NEET 2023", subtitle: "Chemistry - Physical", image: "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=400&h=600&fit=crop", rating: 4.5, duration: "55 Qs" },
];

const mockTests = [
  { id: "1", title: "Full Mock Test #1", subtitle: "Physics + Chemistry + Math", image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500&h=300&fit=crop", rating: 4.9, duration: "3 hrs" },
  { id: "2", title: "Chemistry Sprint", subtitle: "Complete Organic Chemistry", image: "https://images.unsplash.com/photo-1628595351029-c2bf17511435?w=500&h=300&fit=crop", rating: 4.7, duration: "90 min" },
  { id: "3", title: "Physics Master", subtitle: "Mechanics & Thermodynamics", image: "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=500&h=300&fit=crop", rating: 4.8, duration: "2 hrs", trending: true },
  { id: "4", title: "Math Challenge", subtitle: "Calculus & Algebra", image: "https://images.unsplash.com/photo-1596495577886-d920f1fb7238?w=500&h=300&fit=crop", rating: 4.6, duration: "2 hrs" },
  { id: "5", title: "NEET Biology", subtitle: "Complete Zoology", image: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=500&h=300&fit=crop", rating: 4.9, duration: "90 min" },
];

const chapters = [
  { id: "1", title: "Kinematics", subtitle: "Physics - Chapter 1", image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=600&fit=crop", rating: 4.5, duration: "25 Qs" },
  { id: "2", title: "Atomic Structure", subtitle: "Chemistry - Chapter 3", image: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=400&h=600&fit=crop", rating: 4.8, duration: "30 Qs" },
  { id: "3", title: "Differential Calc", subtitle: "Math - Chapter 5", image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=600&fit=crop", rating: 4.7, duration: "40 Qs", trending: true },
  { id: "4", title: "Thermodynamics", subtitle: "Physics - Chapter 8", image: "https://images.unsplash.com/photo-1581093458791-9f3c3250a8b0?w=400&h=600&fit=crop", rating: 4.6, duration: "35 Qs" },
  { id: "5", title: "Organic Reactions", subtitle: "Chemistry - Chapter 12", image: "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=400&h=600&fit=crop", rating: 4.9, duration: "45 Qs" },
  { id: "6", title: "Integration", subtitle: "Math - Chapter 7", image: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&h=600&fit=crop", rating: 4.4, duration: "50 Qs" },
];

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <ProgressSection />
      <CategoryPills />
      <ContentCarousel title="🔥 Trending PYQs" items={trendingPYQs} />
      <ContentCarousel title="📝 Mock Tests" items={mockTests} variant="large" />
      <SubjectsSection />
      <ContentCarousel title="📚 Recommended Chapters" items={chapters} />
      <RankSection />
      <Footer />
    </div>
  );
};

export default Index;
