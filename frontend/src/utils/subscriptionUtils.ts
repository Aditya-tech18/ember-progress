import { supabase } from "@/integrations/supabase/client";

/**
 * Check if user has an active subscription
 * Returns true if subscription is active and not expired
 */
export const checkSubscriptionStatus = async (userId: string): Promise<{
  isActive: boolean;
  subscription: any | null;
  daysRemaining: number;
}> => {
  try {
    const now = new Date();

    // Fetch user's subscription
    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching subscription:", error);
      return { isActive: false, subscription: null, daysRemaining: 0 };
    }

    if (!subscription) {
      return { isActive: false, subscription: null, daysRemaining: 0 };
    }

    // Check if subscription is expired
    const validUntil = new Date(subscription.valid_until);
    const isActive = validUntil > now;

    // Calculate days remaining
    const timeDiff = validUntil.getTime() - now.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    return {
      isActive,
      subscription,
      daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
    };
  } catch (error) {
    console.error("Error checking subscription:", error);
    return { isActive: false, subscription: null, daysRemaining: 0 };
  }
};

/**
 * Deactivate expired subscriptions
 * This function can be called on app startup or periodically
 */
export const deactivateExpiredSubscription = async (userId: string): Promise<boolean> => {
  try {
    const { isActive, subscription } = await checkSubscriptionStatus(userId);

    // If subscription exists but is expired, mark it as inactive
    if (!isActive && subscription) {
      console.log(`🔄 Subscription expired for user ${userId}. Deactivating...`);

      // Optionally: Add an "is_active" field to track status
      // For now, the expiry logic is based on valid_until comparison
      // No need to update database as valid_until already indicates expiry

      return true; // Subscription was expired
    }

    return false; // Subscription is still active or doesn't exist
  } catch (error) {
    console.error("Error deactivating subscription:", error);
    return false;
  }
};

/**
 * Get subscription details for display
 */
export const getSubscriptionDetails = async (userId: string) => {
  const { isActive, subscription, daysRemaining } = await checkSubscriptionStatus(userId);

  if (!isActive || !subscription) {
    return {
      hasSubscription: false,
      status: "inactive",
      planName: null,
      daysRemaining: 0,
      validUntil: null,
      message: "No active subscription",
    };
  }

  return {
    hasSubscription: true,
    status: "active",
    planName: subscription.plan_name,
    daysRemaining,
    validUntil: subscription.valid_until,
    paidOn: subscription.paid_on,
    paymentId: subscription.payment_id,
    message: daysRemaining > 7 
      ? `${daysRemaining} days remaining` 
      : `⚠️ Expiring soon: ${daysRemaining} days left`,
  };
};

/**
 * Require subscription for protected features
 * Redirects to subscription page if not subscribed
 */
export const requireActiveSubscription = async (
  userId: string,
  navigate: (path: string) => void
): Promise<boolean> => {
  const { isActive } = await checkSubscriptionStatus(userId);

  if (!isActive) {
    // Redirect to subscription page
    navigate("/subscription");
    return false;
  }

  return true;
};

/**
 * Format subscription expiry date
 */
export const formatExpiryDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/**
 * Calculate subscription duration in a readable format
 */
export const getSubscriptionDuration = (paidOn: string, validUntil: string): string => {
  const start = new Date(paidOn);
  const end = new Date(validUntil);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return "1 day";
  if (diffDays <= 30) return `${diffDays} days`;
  if (diffDays <= 90) return `${Math.floor(diffDays / 30)} months`;
  if (diffDays <= 180) return `${Math.floor(diffDays / 30)} months`;
  if (diffDays <= 365) return `${Math.floor(diffDays / 30)} months`;
  return `${Math.floor(diffDays / 365)} year`;
};
