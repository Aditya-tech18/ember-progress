import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Atom, FlaskConical, Calculator, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const subjects = [
  {
    name: "Physics",
    icon: Atom,
    color: "from-electric-blue to-cyan-500",
    bgColor: "bg-electric-blue/10",
    solved: 340,
    total: 500,
    chapters: 15,
    description: "Mechanics, Thermodynamics, Electromagnetism & more",
  },
  {
    name: "Chemistry",
    icon: FlaskConical,
    color: "from-primary to-crimson",
    bgColor: "bg-primary/10",
    solved: 260,
    total: 500,
    chapters: 18,
    description: "Organic, Inorganic & Physical Chemistry",
  },
  {
    name: "Mathematics",
    icon: Calculator,
    color: "from-gold to-amber-500",
    bgColor: "bg-gold/10",
    solved: 375,
    total: 500,
    chapters: 20,
    description: "Calculus, Algebra, Coordinate Geometry & more",
  },
];

export const SubjectsSection = () => {
  const navigate = useNavigate();

  const handleSubjectClick = (subjectName: string) => {
    navigate(`/chapters/${encodeURIComponent(subjectName)}`);
  };

  return (
    <section className="py-20">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-4 border border-primary/20">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Practice by Subject</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Choose Your Subject
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Dive deep into each subject with chapter-wise practice
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {subjects.map((subject, index) => (
            <motion.div
              key={subject.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="group"
            >
              <div className="glass-card rounded-2xl p-6 hover-lift h-full flex flex-col relative overflow-hidden border border-transparent hover:border-primary/30 transition-colors">
                {/* Background glow effect */}
                <div className={`absolute inset-0 ${subject.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                {/* Content */}
                <div className="relative z-10">
                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${subject.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <subject.icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-2xl font-bold text-foreground mb-2">{subject.name}</h3>
                  <p className="text-muted-foreground text-sm mb-6">{subject.description}</p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex-1">
                      <div className="text-sm text-muted-foreground mb-1">Progress</div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${(subject.solved / subject.total) * 100}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: 0.3 }}
                          className={`h-full bg-gradient-to-r ${subject.color} rounded-full`}
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-foreground">{subject.solved}/{subject.total}</div>
                      <div className="text-xs text-muted-foreground">solved</div>
                    </div>
                  </div>

                  {/* Chapters Badge */}
                  <div className="flex items-center gap-2 mb-6">
                    <span className="px-3 py-1 rounded-full bg-muted text-sm text-muted-foreground">
                      {subject.chapters} Chapters
                    </span>
                  </div>

                  {/* CTA */}
                  <div className="mt-auto">
                    <Button 
                      onClick={() => handleSubjectClick(subject.name)}
                      className={`w-full bg-gradient-to-r ${subject.color} text-white hover:opacity-90 font-semibold group/btn`}
                    >
                      Continue Learning
                      <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};