import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const PrivacyPolicy = () => {
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
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
            </div>

            <p className="text-muted-foreground mb-6">
              <strong>Last Updated:</strong> January 12, 2026
            </p>

            <div className="space-y-6 text-muted-foreground leading-relaxed">
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">1. Introduction</h2>
                <p>
                  Welcome to Prepixo ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">2. Information We Collect</h2>
                <p className="mb-3">We collect information that you provide directly to us, including:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Account Information:</strong> Name, email address, phone number when you register</li>
                  <li><strong>Payment Information:</strong> Payment details processed securely through Razorpay</li>
                  <li><strong>Usage Data:</strong> Information about how you use our platform, including questions attempted, test scores, and progress</li>
                  <li><strong>Device Information:</strong> Browser type, IP address, device identifiers for security and authentication</li>
                  <li><strong>Communication Data:</strong> Messages you send to us for support or inquiries</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">3. How We Use Your Information</h2>
                <p className="mb-3">We use the collected information for:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Providing and maintaining our educational services</li>
                  <li>Processing your subscription and payments</li>
                  <li>Tracking your learning progress and performance analytics</li>
                  <li>Personalizing your learning experience</li>
                  <li>Communicating with you about updates, features, and support</li>
                  <li>Ensuring security and preventing fraud</li>
                  <li>Complying with legal obligations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">4. Payment Processing</h2>
                <p>
                  We use <strong>Razorpay</strong> as our payment gateway partner to process all transactions securely. Your payment information (credit/debit card details, UPI, net banking) is directly handled by Razorpay and is never stored on our servers. Razorpay is PCI-DSS compliant and follows industry-standard security measures. For more information, please refer to{" "}
                  <a href="https://razorpay.com/privacy/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    Razorpay's Privacy Policy
                  </a>.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">5. Data Storage and Security</h2>
                <p>
                  We use Supabase for secure data storage with encryption at rest and in transit. We implement appropriate technical and organizational security measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">6. Third-Party Services</h2>
                <p className="mb-3">We may share your information with trusted third-party services:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Razorpay:</strong> Payment processing</li>
                  <li><strong>Supabase:</strong> Database and authentication services</li>
                  <li><strong>Google Gemini AI:</strong> AI-powered doubt solving (anonymized queries)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">7. Cookies and Tracking</h2>
                <p>
                  We use cookies and similar tracking technologies to enhance your experience, remember your preferences, and analyze usage patterns. You can control cookie settings through your browser preferences.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">8. Your Rights</h2>
                <p className="mb-3">You have the right to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Access your personal data</li>
                  <li>Correct inaccurate information</li>
                  <li>Request deletion of your account and data</li>
                  <li>Opt-out of marketing communications</li>
                  <li>Data portability where applicable</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">9. Children's Privacy</h2>
                <p>
                  Our services are intended for students preparing for competitive exams. If you are under 18, please use our services with parental/guardian supervision. We do not knowingly collect personal information from children under 13 without parental consent.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">10. Changes to This Policy</h2>
                <p>
                  We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">11. Contact Us</h2>
                <p>
                  If you have any questions about this Privacy Policy or our data practices, please contact us:
                </p>
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

export default PrivacyPolicy;
