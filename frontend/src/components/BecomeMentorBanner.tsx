import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, ArrowRight, Star, Users, TrendingUp } from "lucide-react";

export const BecomeMentorBanner = () => {
  const navigate = useNavigate();

  return (
    <section className="px-3 sm:px-4 py-8 sm:py-12 mb-8">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600/20 via-pink-600/10 to-orange-600/20 border border-red-500/30 p-6 sm:p-10"
        >
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-red-500/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-orange-500/20 to-transparent rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Left Content */}
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-red-600/20 to-orange-600/20 border border-red-500/30 mb-4">
                <GraduationCap className="w-4 h-4 text-red-400" />
                <span className="text-sm font-semibold text-red-400">Mentorship Program</span>
              </div>
              
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 bg-gradient-to-r from-red-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                Become a Mentor
              </h2>
              
              <p className="text-base sm:text-lg text-muted-foreground mb-6 max-w-2xl">
                Share your experience and help students succeed. Earn while making a difference in someone's JEE/NEET journey.
              </p>

              {/* Stats */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center">
                    <Star className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Verified Mentors</p>
                    <p className="text-lg font-bold">100% Trusted</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Students</p>
                    <p className="text-lg font-bold">10,000+</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Earn Upto</p>
                    <p className="text-lg font-bold">₹50,000/mo</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => navigate("/become-mentor")}
                size="lg"
                className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all group"
              >
                Apply Now
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            {/* Right Image/Icon */}
            <div className="hidden lg:block">
              <div className="w-48 h-48 rounded-2xl bg-gradient-to-br from-red-600/30 to-orange-600/30 backdrop-blur-sm border border-red-500/30 flex items-center justify-center">
                <GraduationCap className="w-24 h-24 text-red-400/50" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
