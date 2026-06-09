/**
 * Navigate user based on their selected goal
 */
export const navigateByGoal = (goal: string | null): string => {
  if (goal === "JEE" || goal === "NEET") {
    return "/";
  }
  return "/planner";
};

/**
 * Check if user needs subscription for their goal
 */
export const needsSubscription = (goal: string | null): boolean => {
  // JEE and NEET users don't need subscription
  if (goal === "JEE" || goal === "NEET") {
    return false;
  }
  // All other goals need subscription for planner access
  return true;
};
