import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, ArrowRight } from "lucide-react";
import mentorCard from "@/assets/mentor-card.jpg";

export const BecomeMentorBanner = () => {
  const navigate = useNavigate();

  return (
    <section className="px-3 sm:px-4 py-6">
      <div className="container mx-auto max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600/15 via-red-600/5 to-orange-600/15 border border-red-500/30 p-4"
        >
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-500/20 rounded-full blur-2xl" />

          <div className="relative z-10 flex items-center gap-3">
            <img
              src={mentorCard}
              alt="Become a mentor"
              loading="lazy"
              width={1024}
              height={1024}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover border border-red-500/30 shadow-lg flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-600/20 border border-red-500/30 mb-1">
                <GraduationCap className="w-3 h-3 text-red-400" />
                <span className="text-[10px] font-semibold text-red-400">Mentorship</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent leading-tight">
                Become a Mentor
              </h3>
              <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 mb-2">
                Share experience. Earn ₹50K/mo helping JEE/NEET aspirants.
              </p>
              <Button
                onClick={() => navigate("/become-mentor")}
                size="sm"
                className="h-8 px-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white text-xs font-semibold group"
              >
                Apply Now
                <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
