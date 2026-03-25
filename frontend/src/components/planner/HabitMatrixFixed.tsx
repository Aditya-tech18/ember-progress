// Add to the beginning of the handleAddHabit function in HabitMatrix.tsx

const handleAddHabit = async () => {
  if (!newHabitName.trim()) {
    toast.error("Please enter a habit name");
    return;
  }
  
  // Check subscription status
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    toast.error("Please login first");
    return;
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .gte("valid_until", new Date().toISOString())
    .maybeSingle();

  if (!subscription) {
    toast.error("Subscription required to add habits", {
      description: "Get premium access to unlock unlimited habits",
      action: {
        label: "Subscribe Now",
        onClick: () => window.location.href = "/subscription"
      },
    });
    return;
  }

  if (currentHabitCount >= maxHabits) {
    toast.error(`Maximum ${maxHabits} habits allowed. Delete some to add new ones.`);
    return;
  }
  
  onAddHabit(newHabitName.trim(), newHabitSubject, newHabitGoal);
  setNewHabitName("");
  setShowAddHabit(false);
};

