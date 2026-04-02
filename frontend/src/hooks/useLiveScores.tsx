import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface LiveScore {
  team_id: string;
  team_name: string;
  total_score: number;
  members_submitted: number;
  total_members: number;
  avg_score: number;
}

interface ChallengeData {
  challenger_team: string | null;
  opponent_team: string | null;
  challenger_score: number;
  opponent_score: number;
  status: string;
}

export const useLiveScores = (challengeId: string | undefined) => {
  const [liveScores, setLiveScores] = useState<LiveScore[]>([]);
  const [challengeData, setChallengeData] = useState<ChallengeData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLiveScores = useCallback(async () => {
    if (!challengeId) return;

    try {
      // Fetch challenge data
      const { data: challenge, error: challengeError } = await supabase
        .from("team_challenges")
        .select("challenger_team, opponent_team, challenger_score, opponent_score, status")
        .eq("challenge_id", challengeId)
        .single();

      if (challengeError) throw challengeError;
      setChallengeData(challenge);

      const teamIds = [challenge.challenger_team, challenge.opponent_team].filter(Boolean) as string[];
      const scores: LiveScore[] = [];

      for (const teamId of teamIds) {
        // Get team name
        const { data: team } = await supabase
          .from("teams")
          .select("team_name")
          .eq("team_id", teamId)
          .single();

        // Get team member count
        const { data: members } = await supabase
          .from("team_members")
          .select("id")
          .eq("team_id", teamId);

        // Get submitted results for this challenge
        const { data: results } = await supabase
          .from("team_challenge_results")
          .select("score")
          .eq("challenge_id", challengeId)
          .eq("team_id", teamId);

        const totalScore = results?.reduce((sum, r) => sum + (r.score || 0), 0) || 0;
        const membersSubmitted = results?.length || 0;
        const totalMembers = members?.length || 0;
        const avgScore = membersSubmitted > 0 ? Math.round(totalScore / membersSubmitted) : 0;

        scores.push({
          team_id: teamId,
          team_name: team?.team_name || "Unknown",
          total_score: totalScore,
          members_submitted: membersSubmitted,
          total_members: totalMembers,
          avg_score: avgScore,
        });
      }

      setLiveScores(scores);
    } catch (error) {
      console.error("Error fetching live scores:", error);
    } finally {
      setLoading(false);
    }
  }, [challengeId]);

  // Initial fetch and real-time subscription
  useEffect(() => {
    if (!challengeId) return;

    fetchLiveScores();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`live-scores-${challengeId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "team_challenge_results",
          filter: `challenge_id=eq.${challengeId}`,
        },
        () => {
          fetchLiveScores();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "team_challenges",
          filter: `challenge_id=eq.${challengeId}`,
        },
        () => {
          fetchLiveScores();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [challengeId, fetchLiveScores]);

  return {
    liveScores,
    challengeData,
    loading,
    refetch: fetchLiveScores,
  };
};
