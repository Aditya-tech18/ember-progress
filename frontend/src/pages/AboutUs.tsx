import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { ArrowLeft, Users, Target, Sparkles, BookOpen, Brain, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const AboutUs = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: BookOpen,
      title: "Comprehensive PYQ Bank",
      description: "Access 10,000+ Previous Year Questions from JEE Main with detailed solutions"
    },
    {
      icon: Brain,
      title: "AI-Powered Learning",
      description: "Get instant doubt resolution with our AI assistant trained on JEE patterns"
    },
    {
      icon: Trophy,
      title: "Mock Tests",
      description: "Practice with full-length mock tests that simulate the actual JEE Main exam"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mb-4 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-8 mb-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">About Us</h1>
            </div>

            <div className="space-y-6 text-muted-foreground leading-relaxed">
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">Who We Are</h2>
                <p>
                  Prepixo is an innovative educational platform dedicated to helping JEE aspirants achieve their dreams of getting into top engineering colleges in India. Founded by a team of educators and engineers who understand the challenges of competitive exam preparation, we've built a platform that makes quality JEE preparation accessible, effective, and affordable.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">Our Mission</h2>
                <div className="flex items-start gap-3 p-4 bg-primary/10 rounded-lg">
                  <Target className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <p className="text-foreground">
                    To democratize quality JEE preparation by providing every student access to comprehensive study materials, practice questions, and intelligent learning tools at an affordable price.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">Our Vision</h2>
                <div className="flex items-start gap-3 p-4 bg-secondary/10 rounded-lg">
                  <Sparkles className="w-6 h-6 text-secondary mt-1 flex-shrink-0" />
                  <p className="text-foreground">
                    To become the go-to platform for every JEE aspirant in India, helping millions of students unlock their potential and secure admissions to their dream colleges.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">What We Offer</h2>
                <div className="grid md:grid-cols-3 gap-4 mt-4">
                  {features.map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="p-4 bg-muted/30 rounded-xl text-center"
                    >
                      <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-3">
                        <feature.icon className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                      <p className="text-sm">{feature.description}</p>
                    </motion.div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">Why Choose Prepixo?</h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Curated Content:</strong> All questions are sourced from actual JEE Main papers</li>
                  <li><strong>Affordable Pricing:</strong> Premium features starting at just ₹9/month</li>
                  <li><strong>Smart Analytics:</strong> Track your progress and identify weak areas</li>
                  <li><strong>AI Support:</strong> Get instant help whenever you're stuck</li>
                  <li><strong>Mobile-Friendly:</strong> Study anywhere, anytime on any device</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">Our Team</h2>
                <p>
                  We are a passionate team of educators, engineers, and designers based in Delhi, India. Our team includes IIT alumni, experienced educators, and technology enthusiasts who share a common goal of transforming how students prepare for competitive exams.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">Contact Us</h2>
                <p>Have questions or feedback? We'd love to hear from you!</p>
                <div className="mt-3 p-4 bg-muted/30 rounded-lg">
                  <p><strong>Email:</strong> prepixo.official@gmail.com</p>
                  <p><strong>Location:</strong> Delhi, India</p>
                </div>
              </section>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AboutUs;
