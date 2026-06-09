import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { GraduationCap, BookOpenText, ArrowRight, ShieldCheck, FileText } from "lucide-react";
import { getCachedGoal } from "@/utils/examConfig";

interface FeatureCardProps {
  title: string;
  subtitle: string;
  badge: string;
  icon: any;
  gradient: string;
  glow: string;
  onClick: () => void;
  illo: React.ReactNode;
}

const FeatureCard = ({ title, subtitle, badge, icon: Icon, gradient, glow, onClick, illo }: FeatureCardProps) => (
  <motion.button
    onClick={onClick}
    whileHover={{ y: -4 }}
    whileTap={{ scale: 0.98 }}
    className={`group relative w-full overflow-hidden rounded-2xl border border-white/10 text-left ${gradient} shadow-lg ${glow}`}
  >
    <div className="relative aspect-[4/3] sm:aspect-video">
      {/* Decorative illo on right */}
      <div className="absolute inset-0 opacity-90">{illo}</div>
      {/* Overlay gradient for legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      <div className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-[10px] font-semibold text-white">
        <Icon className="w-3 h-3" />
        {badge}
      </div>
    </div>
    <div className="p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
      <h4 className="text-white font-bold text-sm sm:text-base line-clamp-1">{title}</h4>
      <p className="text-[11px] sm:text-xs text-gray-300 mt-0.5 line-clamp-2">{subtitle}</p>
      <div className="mt-2 inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-primary group-hover:gap-2 transition-all">
        Open <ArrowRight className="w-3 h-3" />
      </div>
    </div>
  </motion.button>
);

export const FeatureCardsRow = () => {
  const navigate = useNavigate();
  const goal = getCachedGoal();
  const isNEET = goal === "NEET";

  return (
    <section className="px-3 sm:px-4 py-6">
      <div className="container mx-auto">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <FeatureCard
            title="Connect With Seniors"
            subtitle="1-on-1 mentorship from IITs, NITs & AIIMS toppers · starts ₹99"
            badge="Mentorship"
            icon={ShieldCheck}
            gradient="bg-gradient-to-br from-red-900/40 via-red-800/30 to-orange-900/40"
            glow="hover:shadow-red-500/30"
            onClick={() => navigate("/mentors")}
            illo={
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="absolute right-3 top-3 w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-[10px] sm:text-xs font-extrabold shadow-lg">IIT</div>
                <div className="absolute right-12 sm:right-16 top-10 sm:top-14 w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white text-[10px] sm:text-xs font-extrabold shadow-lg">NIT</div>
                <div className="absolute right-2 bottom-3 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-rose-500 to-red-700 flex items-center justify-center text-white text-[9px] sm:text-[11px] font-extrabold shadow-lg">AIIMS</div>
                <div className="absolute left-3 bottom-3 w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-2xl shadow-red-500/40">
                  <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
              </div>
            }
          />

          <FeatureCard
            title={`${isNEET ? "NEET" : "JEE"} Notes`}
            subtitle="Premium PDF notes by subject · Physics, Chemistry & more"
            badge="Study Notes"
            icon={FileText}
            gradient="bg-gradient-to-br from-indigo-900/40 via-purple-800/30 to-blue-900/40"
            glow="hover:shadow-indigo-500/30"
            onClick={() => navigate("/notes")}
            illo={
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="absolute right-4 top-4 w-16 h-20 sm:w-20 sm:h-24 rounded-md bg-gradient-to-br from-indigo-400 to-purple-500 rotate-6 shadow-2xl" />
                <div className="absolute right-8 sm:right-10 top-8 sm:top-10 w-16 h-20 sm:w-20 sm:h-24 rounded-md bg-gradient-to-br from-blue-400 to-indigo-500 -rotate-3 shadow-2xl" />
                <div className="absolute left-3 bottom-3 w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-indigo-500/40">
                  <BookOpenText className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
              </div>
            }
          />
        </div>
      </div>
    </section>
  );
};

export default FeatureCardsRow;
