import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { GraduationCap, ArrowRight, Users, Star, TrendingUp, Sparkles } from "lucide-react";

export const MentorshipSection = () => {
  const navigate = useNavigate();

  return (
    <section className="px-3 sm:px-4 py-8 sm:py-12">
      <div className="container mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-red-900/30 to-red-700/30 border border-red-600/40 mb-4">
            <Sparkles className="w-4 h-4 text-red-400" />
            <span className="text-sm font-semibold text-red-400">Premium Feature</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 bg-gradient-to-r from-red-500 via-red-600 to-red-700 bg-clip-text text-transparent">
            Learn From The Best
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Connect with verified seniors from IITs, NITs, and top colleges for personalized guidance
          </p>
        </motion.div>

        {/* Main Mentorship Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          onClick={() => navigate("/mentors")}
          className="cursor-pointer group"
        >
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-950/60 via-black to-red-950/40 border-2 border-red-600/40 hover:border-red-600/70 transition-all duration-500 p-8 sm:p-12">
            {/* Animated Background Elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-red-600/30 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:scale-110 transition-transform duration-700" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-red-800/30 to-transparent rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl group-hover:scale-110 transition-transform duration-700" />
            
            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
              {/* Left Content */}
              <div className="flex-1 text-center lg:text-left">
                {/* Icon */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center mx-auto lg:mx-0 mb-6 group-hover:scale-110 transition-transform duration-500 shadow-2xl shadow-red-500/50">
                  <GraduationCap className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                </div>

                {/* Title */}
                <h3 className="text-3xl sm:text-4xl font-bold mb-4 text-white group-hover:text-red-300 transition-colors">
                  Connect With Seniors
                </h3>

                {/* Description */}
                <p className="text-lg text-gray-300 mb-8 max-w-xl">
                  Get 1-on-1 mentorship from verified seniors studying in top colleges. Clear doubts, learn strategies, and boost your preparation.
                </p>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-xl bg-red-900/40 backdrop-blur-sm flex items-center justify-center mx-auto mb-2 border border-red-600/30">
                      <Star className="w-6 h-6 text-yellow-400" />
                    </div>
                    <p className="text-2xl font-bold text-white">100%</p>
                    <p className="text-xs text-gray-400">Verified</p>
                  </div>

                  <div className="text-center">
                    <div className="w-12 h-12 rounded-xl bg-red-900/40 backdrop-blur-sm flex items-center justify-center mx-auto mb-2 border border-red-600/30">
                      <Users className="w-6 h-6 text-red-400" />
                    </div>
                    <p className="text-2xl font-bold text-white">500+</p>
                    <p className="text-xs text-gray-400">Mentors</p>
                  </div>

                  <div className="text-center">
                    <div className="w-12 h-12 rounded-xl bg-red-900/40 backdrop-blur-sm flex items-center justify-center mx-auto mb-2 border border-red-600/30">
                      <TrendingUp className="w-6 h-6 text-green-400" />
                    </div>
                    <p className="text-2xl font-bold text-white">₹99</p>
                    <p className="text-xs text-gray-400">Starting</p>
                  </div>
                </div>

                {/* CTA Button */}
                <button className="group/btn inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-red-600 via-red-700 to-red-600 hover:from-red-500 hover:via-red-600 hover:to-red-500 text-white font-bold text-lg shadow-2xl hover:shadow-red-500/50 transition-all duration-300 hover:scale-105">
                  <span>Explore Mentors</span>
                  <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Right Visual Element */}
              <div className="hidden lg:block">
                <div className="relative w-64 h-64">
                  {/* Floating mentor avatars */}
                  <div className="absolute top-0 left-0 w-16 h-16 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white text-xl font-bold shadow-xl animate-bounce">
                    IIT
                  </div>
                  <div className="absolute top-12 right-0 w-20 h-20 rounded-full bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center text-white text-xl font-bold shadow-xl animate-bounce" style={{ animationDelay: "0.2s" }}>
                    NIT
                  </div>
                  <div className="absolute bottom-0 left-8 w-18 h-18 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-lg font-bold shadow-xl animate-bounce" style={{ animationDelay: "0.4s" }}>
                    AIIMS
                  </div>
                  <div className="absolute bottom-12 right-8 w-16 h-16 rounded-full bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center text-white text-xl font-bold shadow-xl animate-bounce" style={{ animationDelay: "0.6s" }}>
                    DU
                  </div>
                  
                  {/* Center glow */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-gradient-to-br from-red-600/50 to-red-800/50 blur-2xl" />
                </div>
              </div>
            </div>

            {/* Subtle Pattern Overlay */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 1px)`,
              backgroundSize: '24px 24px'
            }} />
          </div>
        </motion.div>
      </div>
    </section>
  );
};
