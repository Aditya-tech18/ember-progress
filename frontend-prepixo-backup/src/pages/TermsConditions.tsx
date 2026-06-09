import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const TermsConditions = () => {
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
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">Terms & Conditions</h1>
            </div>

            <p className="text-muted-foreground mb-6">
              <strong>Last Updated:</strong> January 12, 2026
            </p>

            <div className="space-y-6 text-muted-foreground leading-relaxed">
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
                <p>
                  By accessing and using Prepixo ("the Platform"), you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, please do not use our services.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">2. Description of Services</h2>
                <p className="mb-3">Prepixo provides the following educational services for JEE preparation:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Previous Year Questions (PYQs) practice with detailed solutions</li>
                  <li>Mock Tests simulating actual JEE Main examination pattern</li>
                  <li>AI-powered doubt solving assistance</li>
                  <li>Performance analytics and progress tracking</li>
                  <li>Chapter-wise practice modules</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">3. User Registration</h2>
                <p className="mb-3">To access our services, you must:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Create an account with accurate and complete information</li>
                  <li>Be at least 13 years of age (users under 18 should have parental consent)</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Notify us immediately of any unauthorized access</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">4. Subscription Plans</h2>
                <p className="mb-3">We offer the following subscription plans:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>1 Month Plan:</strong> ₹9 - 30 days access</li>
                  <li><strong>3 Month Plan:</strong> ₹27 - 90 days access</li>
                  <li><strong>6 Month Plan:</strong> ₹54 - 180 days access</li>
                  <li><strong>12 Month Plan:</strong> ₹108 - 365 days access</li>
                </ul>
                <p className="mt-3">
                  Subscriptions provide access to all premium features including unlimited PYQ practice, mock tests, and AI doubt solver.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">5. Payment Terms</h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>All payments are processed securely through Razorpay</li>
                  <li>Prices are in Indian Rupees (INR) and inclusive of applicable taxes</li>
                  <li>Payment must be made in full before accessing premium features</li>
                  <li>We accept UPI, Credit/Debit Cards, Net Banking, and Wallets</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">6. Intellectual Property</h2>
                <p>
                  All content on the Platform, including questions, solutions, mock tests, graphics, and software, is owned by Prepixo or its licensors. You may not reproduce, distribute, modify, or create derivative works without our written permission.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">7. Acceptable Use</h2>
                <p className="mb-3">You agree NOT to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Share your account credentials with others</li>
                  <li>Use automated systems to access the Platform</li>
                  <li>Copy, screenshot, or redistribute our content</li>
                  <li>Attempt to reverse engineer our software</li>
                  <li>Use the Platform for any unlawful purpose</li>
                  <li>Interfere with the proper functioning of the Platform</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">8. Account Termination</h2>
                <p>
                  We reserve the right to suspend or terminate your account if you violate these terms, engage in fraudulent activity, or abuse our services. Upon termination, you will lose access to all premium features.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">9. Disclaimer of Warranties</h2>
                <p>
                  The Platform is provided "as is" without warranties of any kind. While we strive for accuracy, we do not guarantee that our content is error-free or that it will guarantee success in examinations. Educational outcomes depend on individual effort and preparation.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">10. Limitation of Liability</h2>
                <p>
                  Prepixo shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Platform. Our total liability shall not exceed the amount paid by you for our services.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">11. Governing Law</h2>
                <p>
                  These Terms shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Delhi, India.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">12. Changes to Terms</h2>
                <p>
                  We may update these Terms from time to time. Continued use of the Platform after changes constitutes acceptance of the new terms.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">13. Contact Information</h2>
                <p>For questions about these Terms, contact us at:</p>
                <div className="mt-3 p-4 bg-muted/30 rounded-lg">
                  <p><strong>Email:</strong> prepixo.official@gmail.com</p>
                  <p><strong>Address:</strong> Delhi, India</p>
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

export default TermsConditions;
