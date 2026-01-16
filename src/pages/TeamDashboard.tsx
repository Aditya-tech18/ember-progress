import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, Crown, Zap, Trophy, Plus, Copy, 
  UserPlus, Swords, Target, Calendar, CheckCircle,
  ChevronRight, Medal, Star, Flame
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Team {
  team_id: string;
  team_name: string;
  created_by: string;
}

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  total_questions_solved: number;
  daily_questions_solved: number;
  users?: {
    full_name: string;
    email: string;
  };
}

interface Challenge {
  challenge_id: string;
  challenger_team: string;
  opponent_team: string;
  challenge_type: string;
  start_time: string;
  end_time: string;
  winner_team: string | null;
  status: string;
}

interface LeaderboardEntry {
  team_id: string;
  team_name: string;
  total_questions: number;
  rank: number;
}

const TeamDashboard = () => {
  const navigate = useNavigate();
  const { teamId } = useParams();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userTeam, setUserTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [newTeamName, setNewTeamName] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    checkAuthAndFetch();
  }, [teamId]);

  const checkAuthAndFetch = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      await fetchUserTeam(user.id);
      await fetchLeaderboard();
    }
    setLoading(false);
  };

  const fetchUserTeam = async (uid: string) => {
    // Check if user is in a team
    const { data: membership } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", uid)
      .maybeSingle();

    if (membership) {
      // Fetch team details
      const { data: team } = await supabase
        .from("teams")
        .select("*")
        .eq("team_id", membership.team_id)
        .single();

      if (team) {
        setUserTeam(team);
        await fetchTeamMembers(team.team_id);
        await fetchTeamChallenges(team.team_id);
      }
    } else if (teamId) {
      // User is trying to join via invite link
      handleJoinTeam(teamId, uid);
    }
  };

  const fetchTeamMembers = async (tid: string) => {
    const { data } = await supabase
      .from("team_members")
      .select(`
        *,
        users:user_id (full_name, email)
      `)
      .eq("team_id", tid)
      .order("total_questions_solved", { ascending: false });

    if (data) {
      setTeamMembers(data);
    }
  };

  const fetchTeamChallenges = async (tid: string) => {
    const { data } = await supabase
      .from("team_challenges")
      .select("*")
      .or(`challenger_team.eq.${tid},opponent_team.eq.${tid}`)
      .order("start_time", { ascending: false });

    if (data) {
      setChallenges(data);
    }
  };

  const fetchLeaderboard = async () => {
    const { data } = await supabase
      .from("team_leaderboard")
      .select(`
        *,
        teams:team_id (team_name)
      `)
      .eq("period", "weekly")
      .order("rank", { ascending: true })
      .limit(10);

    if (data) {
      const formatted = data.map(entry => ({
        team_id: entry.team_id || "",
        team_name: (entry.teams as any)?.team_name || "Unknown",
        total_questions: entry.total_questions || 0,
        rank: entry.rank || 0
      }));
      setLeaderboard(formatted);
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim() || !userId) return;

    setIsCreating(true);
    try {
      // Create team
      const { data: team, error: teamError } = await supabase
        .from("teams")
        .insert({
          team_name: newTeamName.trim(),
          created_by: userId
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // Add creator as leader
      const { error: memberError } = await supabase
        .from("team_members")
        .insert({
          team_id: team.team_id,
          user_id: userId,
          role: "leader"
        });

      if (memberError) throw memberError;

      setUserTeam(team);
      setShowCreateDialog(false);
      toast({
        title: "Team created! 🎉",
        description: "Share the invite link with friends"
      });
      
      await fetchTeamMembers(team.team_id);
    } catch (error) {
      console.error("Error creating team:", error);
      toast({
        title: "Failed to create team",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinTeam = async (tid: string, uid: string) => {
    try {
      // Check team capacity
      const { data: members } = await supabase
        .from("team_members")
        .select("id")
        .eq("team_id", tid);

      if (members && members.length >= 4) {
        toast({
          title: "Team is full",
          description: "Maximum 4 members allowed",
          variant: "destructive"
        });
        navigate("/team");
        return;
      }

      // Join team
      const { error } = await supabase
        .from("team_members")
        .insert({
          team_id: tid,
          user_id: uid,
          role: "member"
        });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Already a member",
            description: "You're already in this team"
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Joined team! 🎉",
          description: "Welcome to the team"
        });
      }

      await fetchUserTeam(uid);
    } catch (error) {
      console.error("Error joining team:", error);
      toast({
        title: "Failed to join team",
        variant: "destructive"
      });
    }
  };

  const copyInviteLink = () => {
    if (userTeam) {
      const link = `${window.location.origin}/team/${userTeam.team_id}`;
      navigator.clipboard.writeText(link);
      toast({
        title: "Link copied!",
        description: "Share with friends to invite them"
      });
    }
  };

  const getLeaderRole = () => {
    const leader = teamMembers.reduce((prev, current) => 
      (prev.total_questions_solved > current.total_questions_solved) ? prev : current
    , teamMembers[0]);
    return leader;
  };

  const getConsistencyKing = () => {
    return teamMembers.find(m => m.daily_questions_solved >= 5);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-14">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Badge className="mb-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
            <Users className="w-3 h-3 mr-1" />
            Friendly Preparation
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            {userTeam ? userTeam.team_name : "Team Preparation"}
          </h1>
          <p className="text-muted-foreground">
            {userTeam ? "Prepare together, succeed together" : "Create or join a team to get started"}
          </p>
        </motion.div>

        {!userTeam ? (
          /* No Team View */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto"
          >
            <Card className="p-8 text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-bold mb-2">No Team Yet</h2>
              <p className="text-muted-foreground mb-6">
                Create a new team or join one with an invite link
              </p>

              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button className="w-full mb-3 bg-gradient-to-r from-orange-500 to-red-500">
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Team
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Your Team</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <Input
                      placeholder="Enter team name"
                      value={newTeamName}
                      onChange={(e) => setNewTeamName(e.target.value)}
                    />
                    <Button 
                      onClick={handleCreateTeam}
                      disabled={isCreating || !newTeamName.trim()}
                      className="w-full"
                    >
                      {isCreating ? "Creating..." : "Create Team"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <p className="text-sm text-muted-foreground">
                Or ask a friend to share their team invite link
              </p>
            </Card>
          </motion.div>
        ) : (
          /* Team Dashboard */
          <Tabs defaultValue="team" className="space-y-6">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
              <TabsTrigger value="team">My Team</TabsTrigger>
              <TabsTrigger value="challenges">Challenges</TabsTrigger>
              <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            </TabsList>

            {/* Team Tab */}
            <TabsContent value="team">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Team Members */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-500" />
                        Team Members
                      </h3>
                      <Badge variant="outline">{teamMembers.length}/4</Badge>
                    </div>

                    <div className="space-y-3">
                      {teamMembers.map((member, index) => {
                        const isLeader = getLeaderRole()?.id === member.id;
                        const isConsistencyKing = getConsistencyKing()?.id === member.id;
                        
                        return (
                          <motion.div
                            key={member.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * index }}
                            className={`flex items-center justify-between p-3 rounded-lg ${
                              member.user_id === userId 
                                ? "bg-orange-500/20 border border-orange-500/50" 
                                : "bg-muted/50"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold">
                                {member.users?.full_name?.[0] || "?"}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">
                                    {member.users?.full_name || "Member"}
                                  </p>
                                  {isLeader && (
                                    <Crown className="w-4 h-4 text-yellow-500" />
                                  )}
                                  {isConsistencyKing && (
                                    <Flame className="w-4 h-4 text-orange-500" />
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {isLeader ? "Team Lead" : isConsistencyKing ? "Consistency King" : "Member"}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">{member.total_questions_solved}</p>
                              <p className="text-xs text-muted-foreground">solved</p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    {teamMembers.length < 4 && (
                      <Button
                        variant="outline"
                        className="w-full mt-4"
                        onClick={copyInviteLink}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Invite Link
                      </Button>
                    )}
                  </Card>
                </motion.div>

                {/* Quick Stats */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <Card className="p-6">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Target className="w-5 h-5 text-green-500" />
                      Team Stats
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-muted/50 rounded-lg text-center">
                        <p className="text-3xl font-bold text-primary">
                          {teamMembers.reduce((sum, m) => sum + m.total_questions_solved, 0)}
                        </p>
                        <p className="text-sm text-muted-foreground">Total Solved</p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg text-center">
                        <p className="text-3xl font-bold text-green-500">
                          {teamMembers.reduce((sum, m) => sum + m.daily_questions_solved, 0)}
                        </p>
                        <p className="text-sm text-muted-foreground">Today</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Swords className="w-5 h-5 text-red-500" />
                      Issue Challenge
                    </h3>
                    
                    <div className="space-y-2">
                      {["day", "week", "month"].map((type) => (
                        <Button
                          key={type}
                          variant="outline"
                          className="w-full justify-between"
                          disabled={!getConsistencyKing() || getConsistencyKing()?.user_id !== userId}
                        >
                          <span>Most solved this {type}</span>
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      ))}
                    </div>

                    {(!getConsistencyKing() || getConsistencyKing()?.user_id !== userId) && (
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        Only Consistency King (5+ questions/day) can issue challenges
                      </p>
                    )}
                  </Card>
                </motion.div>
              </div>
            </TabsContent>

            {/* Challenges Tab */}
            <TabsContent value="challenges">
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4">Active & Past Challenges</h3>
                
                {challenges.length > 0 ? (
                  <div className="space-y-3">
                    {challenges.map((challenge) => (
                      <div 
                        key={challenge.challenge_id}
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium capitalize">{challenge.challenge_type} Challenge</p>
                          <p className="text-sm text-muted-foreground">
                            {challenge.status === "active" ? "In Progress" : "Completed"}
                          </p>
                        </div>
                        <Badge variant={challenge.status === "active" ? "default" : "secondary"}>
                          {challenge.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No challenges yet. Issue one to compete with other teams!
                  </p>
                )}
              </Card>
            </TabsContent>

            {/* Leaderboard Tab */}
            <TabsContent value="leaderboard">
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Top 10 Teams (Weekly)
                </h3>
                
                {leaderboard.length > 0 ? (
                  <div className="space-y-2">
                    {leaderboard.map((team, index) => (
                      <motion.div
                        key={team.team_id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * index }}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          team.team_id === userTeam?.team_id 
                            ? "bg-orange-500/20 border border-orange-500/50" 
                            : "bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                            index === 0 ? "bg-yellow-500 text-black" :
                            index === 1 ? "bg-gray-300 text-black" :
                            index === 2 ? "bg-amber-700 text-white" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {team.rank}
                          </div>
                          <p className="font-medium">{team.team_name}</p>
                        </div>
                        <p className="font-bold">{team.total_questions} solved</p>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No teams on the leaderboard yet
                  </p>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default TeamDashboard;
