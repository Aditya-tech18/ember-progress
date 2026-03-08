import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { RankSection } from "@/components/RankSection";

const RankJourney = () => {
  return (
    <div className="min-h-[100dvh] bg-background pb-20">
      <Navbar />
      <main className="pt-16">
        <RankSection />
      </main>
      <Footer />
    </div>
  );
};

export default RankJourney;
