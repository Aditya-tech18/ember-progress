/**
 * Navigate user based on their selected goal
 */
export const navigateByGoal = (goal: string | null): string => {
  if (goal === "JEE") {
    return "/";
  }
  return "/planner";
};

/**
 * Check if user needs subscription for their goal
 */
export const needsSubscription = (goal: string | null): boolean => {
  // JEE users don't need subscription
  if (goal === "JEE") {
    return false;
  }
  // All other goals need subscription for planner access
  return true;
};
