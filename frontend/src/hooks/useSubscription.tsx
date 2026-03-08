import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Subscription {
  id: string;
  user_id: string;
  email: string;
  plan_name: string;
  paid_on: string;
  valid_until: string;
  payment_id: string | null;
}

// Initial users (those created before subscription system) are exempt
const SUBSCRIPTION_CUTOFF_DATE = new Date("2026-01-09T00:00:00Z");

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOldUser, setIsOldUser] = useState(false);

  const checkSubscription = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setSubscription(null);
        setIsOldUser(false);
        setLoading(false);
        return;
      }

      // Check if old user (created before subscription system)
      const { data: userData } = await supabase
        .from("users")
        .select("created_at")
        .eq("id", user.id)
        .single();

      if (userData?.created_at) {
        const createdAt = new Date(userData.created_at);
        if (createdAt < SUBSCRIPTION_CUTOFF_DATE) {
          setIsOldUser(true);
          setLoading(false);
          return;
        }
      }

      // Check active subscription
      const { data: subData } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (subData) {
        const validUntil = new Date(subData.valid_until);
        if (validUntil > new Date()) {
          setSubscription(subData as Subscription);
        } else {
          setSubscription(null);
        }
      } else {
        setSubscription(null);
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSubscription();
    
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(() => {
      checkSubscription();
    });

    return () => authSub.unsubscribe();
  }, [checkSubscription]);

  const hasAccess = isOldUser || !!subscription;
  const isPremium = !!subscription;

  return {
    subscription,
    loading,
    hasAccess,
    isPremium,
    isOldUser,
    refreshSubscription: checkSubscription,
  };
}

// Check if a chapter is free (first 2 chapters per subject are free)
export function isChapterFree(chapterIndex: number): boolean {
  return chapterIndex < 2;
}
