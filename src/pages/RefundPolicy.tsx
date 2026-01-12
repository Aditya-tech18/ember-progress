import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const RefundPolicy = () => {
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
                <RotateCcw className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">Refund & Cancellation Policy</h1>
            </div>

            <p className="text-muted-foreground mb-6">
              <strong>Last Updated:</strong> January 12, 2026
            </p>

            <div className="space-y-6 text-muted-foreground leading-relaxed">
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">1. No Refund Policy</h2>
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg mb-4">
                  <p className="text-foreground font-semibold">
                    ⚠️ Important: All purchases on Prepixo are final and non-refundable.
                  </p>
                </div>
                <p>
                  Once a subscription plan is purchased and payment is successfully processed, no refunds will be issued under any circumstances. This policy applies to all subscription plans including 1 month, 3 months, 6 months, and 12 months plans.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">2. Why We Have a No Refund Policy</h2>
                <p className="mb-3">Our no-refund policy exists because:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Digital educational content is immediately accessible upon purchase</li>
                  <li>You get full access to all premium features instantly after payment</li>
                  <li>Our content (PYQs, solutions, mock tests) can be consumed immediately</li>
                  <li>This prevents abuse of the platform through temporary subscriptions</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">3. Before You Subscribe</h2>
                <p className="mb-3">We encourage you to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Explore the free features available on the platform</li>
                  <li>Review the subscription plan details carefully</li>
                  <li>Understand what features are included in each plan</li>
                  <li>Contact us if you have any questions before purchasing</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">4. Subscription Cancellation</h2>
                <p className="mb-3">While we do not offer refunds:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>You may choose not to renew your subscription</li>
                  <li>Your access will continue until the subscription period ends</li>
                  <li>We do not have auto-renewal; each subscription is a one-time purchase for the selected duration</li>
                  <li>You can continue using all features until the validity expires</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">5. Payment Failures</h2>
                <p>
                  If a payment fails but money is deducted from your account, the amount will be automatically refunded by your bank or Razorpay within 5-7 business days. Please contact your bank or payment provider for such cases.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">6. Duplicate Payments</h2>
                <p>
                  In the rare case of duplicate payments for the same subscription, please contact us immediately with your payment details. We will verify and process a refund for the duplicate payment within 7-10 business days.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">7. Technical Issues</h2>
                <p>
                  If you experience technical issues accessing our platform after payment, please contact our support team. We will work to resolve any technical problems but this does not entitle you to a refund.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">8. Exceptional Circumstances</h2>
                <p>
                  In extremely rare cases (such as duplicate billing errors on our part), we may consider exceptions at our sole discretion. Any such decisions are final and not subject to appeal.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">9. Contact for Queries</h2>
                <p>For any questions regarding this policy or payment-related issues:</p>
                <div className="mt-3 p-4 bg-muted/30 rounded-lg">
                  <p><strong>Email:</strong> prepixo.official@gmail.com</p>
                  <p><strong>Address:</strong> Delhi, India</p>
                  <p className="mt-2 text-sm">Please include your registered email and transaction ID when contacting us.</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">10. Agreement</h2>
                <p>
                  By making a purchase on Prepixo, you acknowledge that you have read, understood, and agree to this Refund & Cancellation Policy.
                </p>
              </section>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default RefundPolicy;
