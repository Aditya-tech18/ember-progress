import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  GraduationCap, CheckCircle, FileCheck, 
  Video, Award, ArrowRight, Users, TrendingUp, Star 
} from "lucide-react";

export default function BecomeMentor() {
  const navigate = useNavigate();

  const selectionSteps = [
    {
      icon: FileCheck,
      title: "Submit Application",
      description: "Fill out the application form with your academic details, achievements, and upload verification documents (College ID & Exam Results).",
      color: "from-blue-600 to-cyan-600"
    },
    {
      icon: CheckCircle,
      title: "Document Verification",
      description: "Our team reviews your documents to ensure authenticity. This process typically takes 2-3 business days.",
      color: "from-purple-600 to-pink-600"
    },
    {
      icon: Video,
      title: "Interview Call",
      description: "Selected candidates will have a brief interview with our team to understand your mentoring approach and expertise.",
      color: "from-orange-600 to-red-600"
    },
    {
      icon: Award,
      title: "Approval & Activation",
      description: "Once approved, your profile goes live on Prepixo. You can start creating services and connecting with students!",
      color: "from-green-600 to-emerald-600"
    }
  ];

  const benefits = [
    { icon: TrendingUp, title: "Earn Upto ₹50k/month", desc: "Set your own prices and earn" },
    { icon: Users, title: "Help 1000s of Students", desc: "Make a real impact" },
    { icon: Star, title: "Build Your Brand", desc: "Establish yourself as an expert" },
    { icon: GraduationCap, title: "Flexible Schedule", desc: "Mentor on your own time" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4 bg-gradient-to-b from-purple-600/10 to-background">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-600/20 to-red-600/20 border border-purple-500/30 mb-6">
              <GraduationCap className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-semibold text-purple-400">Become a Prepixo Mentor</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
              Share Your Journey,<br />Guide Future Achievers
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Become a verified mentor on Prepixo and help students crack competitive exams while earning money
            </p>

            {/* Benefits Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8">
              {benefits.map((benefit, idx) => (
                <Card key={idx} className="p-4 border-purple-500/30">
                  <benefit.icon className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <h4 className="font-bold text-sm mb-1">{benefit.title}</h4>
                  <p className="text-xs text-muted-foreground">{benefit.desc}</p>
                </Card>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Selection Process */}
      <section className="px-4 py-12">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Mentor Selection Process</h2>
            <p className="text-muted-foreground">
              We maintain strict quality standards to ensure students get the best guidance
            </p>
          </div>

          <div className="space-y-8">
            {selectionSteps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="p-6 hover:border-purple-500/50 transition-all">
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white font-bold text-xl`}>
                        {idx + 1}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <step.icon className="w-6 h-6 text-purple-400" />
                        <h3 className="text-xl font-bold">{step.title}</h3>
                      </div>
                      <p className="text-muted-foreground">{step.description}</p>
                    </div>

                    {idx < selectionSteps.length - 1 && (
                      <div className="hidden lg:block">
                        <ArrowRight className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Important Note */}
          <div className="mt-12 p-6 rounded-xl bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-500/30">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-yellow-600/30 flex items-center justify-center flex-shrink-0">
                <Star className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Quality Assurance</h3>
                <p className="text-muted-foreground">
                  Only verified mentors are allowed on Prepixo to ensure quality guidance. 
                  We manually review all applications to maintain trust and authenticity.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <Button
              size="lg"
              onClick={() => navigate("/mentor-application")}
              className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:from-purple-500 hover:via-pink-500 hover:to-red-500 text-white font-bold text-lg px-12 py-6 shadow-2xl hover:shadow-purple-500/50 transition-all group"
            >
              Apply Now
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              Application takes ~10 minutes • Review within 48 hours
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}