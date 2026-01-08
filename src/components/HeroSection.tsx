import { motion } from "framer-motion";
import { Target, BarChart3, Sparkles, BookOpen, Atom, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      </div>

      {/* Floating Icons */}
      <motion.div
        animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-32 left-[15%] hidden lg:block"
      >
        <div className="w-16 h-16 glass-card flex items-center justify-center rounded-2xl">
          <BookOpen className="w-8 h-8 text-primary" />
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, 15, 0], rotate: [0, -5, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-48 right-[10%] hidden lg:block"
      >
        <div className="w-20 h-20 glass-card flex items-center justify-center rounded-2xl">
          <Atom className="w-10 h-10 text-secondary" />
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, -10, 0], rotate: [0, 3, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-32 left-[10%] hidden lg:block"
      >
        <div className="w-14 h-14 glass-card flex items-center justify-center rounded-2xl">
          <Calculator className="w-7 h-7 text-accent" />
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Rank Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">
              Current Rank:
            </span>
            <span className="text-sm font-bold text-primary">Major</span>
            <span className="text-xs text-muted-foreground">• 847 Questions Solved</span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl sm:text-5xl lg:text-7xl font-bold text-foreground mb-6 leading-tight"
          >
            Discipline Today,
            <br />
            <span className="gradient-text">Rank Tomorrow</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
          >
            Track your progress, test your skills, and rise through ranks.
            Master Physics, Chemistry, and Mathematics with our gamified learning platform.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              size="lg"
              className="w-full sm:w-auto bg-gradient-to-r from-primary to-orange hover:opacity-90 text-primary-foreground font-semibold px-8 py-6 text-lg rounded-xl animate-glow-pulse"
            >
              <Target className="w-5 h-5 mr-2" />
              Start Practicing
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto border-border/50 hover:bg-muted/50 text-foreground font-semibold px-8 py-6 text-lg rounded-xl"
            >
              <BarChart3 className="w-5 h-5 mr-2" />
              View Progress
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="grid grid-cols-3 gap-4 sm:gap-8 mt-16 max-w-2xl mx-auto"
          >
            {[
              { value: "50K+", label: "Questions" },
              { value: "12", label: "Ranks" },
              { value: "10K+", label: "Students" },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};
