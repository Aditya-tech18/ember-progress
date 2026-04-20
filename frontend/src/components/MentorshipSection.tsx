import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  ArrowRight,
  Users,
  Star,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

export const MentorshipSection = () => {
  const navigate = useNavigate();

  return (
    <section className="px-3 sm:px-4 py-10 sm:py-14">
      <div className="container mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-red-900/40 to-red-700/40 border border-red-500/50 mb-4 shadow-[0_0_20px_rgba(239,68,68,0.25)]">
            <Sparkles className="w-4 h-4 text-red-300" />
            <span className="text-sm font-semibold text-red-200">1-on-1 Mentorship</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-3 bg-gradient-to-r from-red-400 via-red-500 to-orange-500 bg-clip-text text-transparent">
            Learn From The Best
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
            Verified seniors from IITs, NITs &amp; AIIMS — booked in minutes, starting at just ₹99.
          </p>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="group"
        >
          <div className="relative overflow-hidden rounded-3xl bg-[radial-gradient(ellipse_at_top_left,rgba(239,68,68,0.18),transparent_60%),radial-gradient(ellipse_at_bottom_right,rgba(249,115,22,0.18),transparent_60%),linear-gradient(135deg,#1a0a0a_0%,#0a0a0a_60%,#1a0a0a_100%)] border-2 border-red-600/40 hover:border-red-500/70 transition-all duration-500 p-6 sm:p-10">
            {/* Animated Background Elements */}
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-red-600/25 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
            <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-orange-500/20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
              {/* Left Content */}
              <div className="flex-1 text-center lg:text-left">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center mx-auto lg:mx-0 mb-5 group-hover:scale-110 transition-transform duration-500 shadow-2xl shadow-red-500/50">
                  <GraduationCap className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                </div>

                <h3 className="text-3xl sm:text-4xl font-extrabold mb-3 text-white">
                  Connect With Seniors
                </h3>

                <p className="text-base sm:text-lg text-gray-300 mb-6 max-w-xl">
                  Get personalized 1-on-1 guidance from toppers. Clear doubts, learn winning
                  strategies, and accelerate your prep.
                </p>

                {/* Feature pills */}
                <div className="flex flex-wrap justify-center lg:justify-start gap-2 mb-6">
                  {[
                    { icon: ShieldCheck, label: "Verified Mentors" },
                    { icon: CheckCircle2, label: "Instant Booking" },
                    { icon: Star, label: "Top Rated" },
                  ].map((p) => (
                    <span
                      key={p.label}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-950/60 border border-red-700/50 text-xs font-medium text-red-200"
                    >
                      <p.icon className="w-3.5 h-3.5 text-red-300" />
                      {p.label}
                    </span>
                  ))}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-7 max-w-md mx-auto lg:mx-0">
                  <div className="rounded-xl bg-black/40 border border-red-700/30 p-3 text-center">
                    <div className="w-9 h-9 rounded-lg bg-yellow-500/20 flex items-center justify-center mx-auto mb-1.5 border border-yellow-500/40">
                      <Star className="w-5 h-5 text-yellow-400" />
                    </div>
                    <p className="text-xl font-extrabold text-white">100%</p>
                    <p className="text-[10px] text-gray-400">Verified</p>
                  </div>
                  <div className="rounded-xl bg-black/40 border border-red-700/30 p-3 text-center">
                    <div className="w-9 h-9 rounded-lg bg-red-500/20 flex items-center justify-center mx-auto mb-1.5 border border-red-500/40">
                      <Users className="w-5 h-5 text-red-300" />
                    </div>
                    <p className="text-xl font-extrabold text-white">500+</p>
                    <p className="text-[10px] text-gray-400">Mentors</p>
                  </div>
                  <div className="rounded-xl bg-black/40 border border-red-700/30 p-3 text-center">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center mx-auto mb-1.5 border border-emerald-500/40">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                    </div>
                    <p className="text-xl font-extrabold text-white">₹99</p>
                    <p className="text-[10px] text-gray-400">Starting</p>
                  </div>
                </div>

                {/* HIGHLIGHTED CTA Button */}
                <motion.button
                  onClick={() => navigate("/mentors")}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-red-500 via-red-600 to-orange-500 text-white font-extrabold text-base sm:text-lg shadow-[0_10px_40px_-5px_rgba(239,68,68,0.6)] ring-2 ring-red-400/40 hover:ring-red-300/70 transition-all"
                >
                  <span className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-400/0 via-white/20 to-red-400/0 opacity-0 hover:opacity-100 transition-opacity" />
                  <span className="relative">Connect With Seniors</span>
                  <ArrowRight className="relative w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </div>

              {/* Right Visual Element */}
              <div className="hidden lg:block">
                <div className="relative w-72 h-72">
                  {[
                    { label: "IIT", top: "0%", left: "10%", delay: "0s", from: "from-red-500", to: "to-red-700", size: "w-20 h-20" },
                    { label: "NIT", top: "25%", left: "70%", delay: "0.15s", from: "from-red-600", to: "to-orange-600", size: "w-24 h-24" },
                    { label: "AIIMS", top: "65%", left: "0%", delay: "0.3s", from: "from-rose-500", to: "to-red-700", size: "w-20 h-20" },
                    { label: "DU", top: "70%", left: "60%", delay: "0.45s", from: "from-orange-500", to: "to-red-600", size: "w-20 h-20" },
                  ].map((b) => (
                    <motion.div
                      key={b.label}
                      initial={{ opacity: 0, scale: 0.5 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: parseFloat(b.delay) }}
                      className={`absolute ${b.size} rounded-full bg-gradient-to-br ${b.from} ${b.to} flex items-center justify-center text-white text-base font-extrabold shadow-2xl ring-2 ring-white/10`}
                      style={{ top: b.top, left: b.left, animation: `float 4s ease-in-out ${b.delay} infinite` }}
                    >
                      {b.label}
                    </motion.div>
                  ))}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-red-500/40 blur-3xl" />
                </div>
                <style>{`@keyframes float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-10px) } }`}</style>
              </div>
            </div>

            {/* Subtle Pattern Overlay */}
            <div
              className="absolute inset-0 opacity-[0.07] pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 1px)`,
                backgroundSize: "22px 22px",
              }}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};
