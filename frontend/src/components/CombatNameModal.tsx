import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Swords, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const CombatNameModal = () => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [combatName, setCombatName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    checkCombatName();
  }, []);

  const checkCombatName = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("users")
      .select("combat_name")
      .eq("id", user.id)
      .maybeSingle();

    if (data && !data.combat_name) {
      setOpen(true);
    }
  };

  const handleSubmit = async () => {
    if (!combatName.trim()) {
      toast({
        title: "Combat name required",
        description: "Please enter a unique combat name",
        variant: "destructive"
      });
      return;
    }

    if (combatName.length < 3 || combatName.length > 20) {
      toast({
        title: "Invalid name length",
        description: "Combat name must be 3-20 characters",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("users")
        .update({ combat_name: combatName.trim() })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Combat name set! ⚔️",
        description: `You are now known as "${combatName}"`
      });
      setOpen(false);
    } catch (error) {
      console.error("Error setting combat name:", error);
      toast({
        title: "Failed to set combat name",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <span>Choose Your Combat Name</span>
            </motion.div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <p className="text-center text-muted-foreground">
            This name will represent you in team battles and contests. Choose wisely, warrior!
          </p>

          <div className="relative">
            <Swords className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Enter your combat name"
              value={combatName}
              onChange={(e) => setCombatName(e.target.value)}
              className="pl-10 text-lg h-12"
              maxLength={20}
            />
          </div>

          <div className="flex gap-2 text-xs text-muted-foreground justify-center">
            <Zap className="w-4 h-4" />
            <span>3-20 characters • This will be visible to other warriors</span>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !combatName.trim()}
            className="w-full h-12 text-lg bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
          >
            {isSubmitting ? (
              "Setting name..."
            ) : (
              <>
                <Shield className="w-5 h-5 mr-2" />
                Confirm Combat Name
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};