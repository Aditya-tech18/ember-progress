import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, MapPin, Clock, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Contact = () => {
  const navigate = useNavigate();

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
            className="glass-card rounded-2xl p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">Contact Us</h1>
            </div>

            <p className="text-muted-foreground mb-8">
              Have questions, feedback, or need support? We're here to help! Reach out to us through any of the following channels.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Email */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="p-6 bg-muted/30 rounded-xl"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Email Us</h3>
                <p className="text-muted-foreground text-sm mb-3">
                  For general inquiries, support, or feedback
                </p>
                <a 
                  href="mailto:prepixo.official@gmail.com"
                  className="text-primary hover:underline font-medium"
                >
                  prepixo.official@gmail.com
                </a>
              </motion.div>

              {/* Location */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="p-6 bg-muted/30 rounded-xl"
              >
                <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center mb-4">
                  <MapPin className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Our Location</h3>
                <p className="text-muted-foreground text-sm mb-3">
                  We are based in India's capital
                </p>
                <p className="text-foreground font-medium">
                  Delhi, India
                </p>
              </motion.div>

              {/* Response Time */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="p-6 bg-muted/30 rounded-xl md:col-span-2"
              >
                <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-success" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Response Time</h3>
                <p className="text-muted-foreground">
                  We typically respond to all inquiries within <strong className="text-foreground">24-48 hours</strong>. 
                  For urgent issues related to payments or account access, please mention "URGENT" in your email subject line.
                </p>
              </motion.div>
            </div>

            {/* Additional Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-8 p-6 bg-primary/10 rounded-xl"
            >
              <h3 className="text-lg font-semibold text-foreground mb-3">Before You Contact Us</h3>
              <p className="text-muted-foreground mb-4">
                Please check if your query is answered in the following pages:
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" size="sm" onClick={() => navigate("/privacy")}>
                  Privacy Policy
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate("/terms")}>
                  Terms & Conditions
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate("/refund")}>
                  Refund Policy
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate("/about")}>
                  About Us
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Contact;
