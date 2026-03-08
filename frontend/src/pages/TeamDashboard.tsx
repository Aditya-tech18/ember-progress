import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSubscription } from "@/hooks/useSubscription";
import { 
  Users, Crown, Zap, Trophy, Plus, 
  UserPlus, Swords, Target, Calendar, CheckCircle,
  ChevronRight, Medal, Star, Flame, Eye, X,
  Bell, Shield, AlertCircle, Lock, LogOut
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, nextSunday, setHours, setMinutes } from "date-fns";

interface Team {
  team_id: string;
  team_name: string;
  created_by: string;
  short_id: string;
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
    combat_name: string | null;
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
  accepted: boolean;
  mock_test_id: string | null;
  challenger_score: number;
  opponent_score: number;
}

interface AllTeam {
  team_id: string;
  team_name: string;
  short_id: string;
  total_questions: number;
  member_count: number;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  challenge_id: string | null;
  created_at: string;
}

const TeamDashboard = () => {
  const navigate = useNavigate();
  const { teamId } = useParams();
  const { toast } = useToast();
  const { hasAccess, loading: subLoading } = useSubscription();
  
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userTeam, setUserTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [allTeams, setAllTeams] = useState<AllTeam[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [newTeamName, setNewTeamName] = useState("");
  const [joinTeamCode, setJoinTeamCode] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [showTeamsDialog, setShowTeamsDialog] = useState(false);
  const [showNotificationsDialog, setShowNotificationsDialog] = useState(false);
  const [selectedViewTeam, setSelectedViewTeam] = useState<AllTeam | null>(null);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<TeamMember[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [showNoTeamView, setShowNoTeamView] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (!subLoading && hasAccess) {
      checkAuthAndFetch();
    }
  }, [teamId, subLoading, hasAccess]);

  // Check subscription access - moved AFTER all hooks
  if (!subLoading && !hasAccess) {
    return (
      <div className="min-h-screen bg-background pt-14">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Lock className="w-20 h-20 text-primary mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">Premium Feature</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Friendly Prep (Team Battles) is a premium feature. Subscribe to create or join teams and compete with friends!
            </p>
            <Button 
              onClick={() => navigate("/subscription")}
              className="bg-gradient-to-r from-primary to-crimson text-white px-8 py-6 text-lg"
            >
              <Crown className="w-5 h-5 mr-2" />
              Subscribe Now
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  const checkAuthAndFetch = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      await fetchUserTeam(user.id);
      await fetchAllTeams();
      await fetchNotifications(user.id);
    } else {
      navigate("/auth");
    }
    setLoading(false);
  };

  const fetchUserTeam = async (uid: string) => {
    const { data: membership } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", uid)
      .maybeSingle();

    if (membership) {
      const { data: team } = await supabase
        .from("teams")
        .select("*")
        .eq("team_id", membership.team_id)
        .single();

      if (team) {
        setUserTeam(team as Team);
        await fetchTeamMembers(team.team_id);
        await fetchTeamChallenges(team.team_id);
      }
    } else {
      setShowNoTeamView(true);
    }
  };

  const fetchTeamMembers = async (tid: string) => {
    const { data } = await supabase
      .from("team_members")
      .select(`
        *,
        users:user_id (full_name, email, combat_name)
      `)
      .eq("team_id", tid)
      .order("total_questions_solved", { ascending: false });

    if (data) {
      // Also fetch actual solved counts from submissions
      const memberIds = data.map(m => m.user_id).filter(Boolean);
      const { data: submissions } = await supabase
        .from("submissions")
        .select("user_id")
        .in("user_id", memberIds);
      
      const solvedCounts: Record<string, number> = {};
      submissions?.forEach(s => {
        solvedCounts[s.user_id] = (solvedCounts[s.user_id] || 0) + 1;
      });

      const updatedData = data.map(m => ({
        ...m,
        total_questions_solved: solvedCounts[m.user_id || ""] || 0
      }));

      setTeamMembers(updatedData);
    }
  };

  const fetchTeamChallenges = async (tid: string) => {
    const { data } = await supabase
      .from("team_challenges")
      .select("*")
      .or(`challenger_team.eq.${tid},opponent_team.eq.${tid}`)
      .order("start_time", { ascending: false });

    if (data) {
      setChallenges(data as Challenge[]);
    }
  };

  const fetchAllTeams = async () => {
    const { data: teamsData } = await supabase
      .from("teams")
      .select("team_id, team_name, short_id");

    if (teamsData) {
      const teamsWithStats = await Promise.all(
        teamsData.map(async (team) => {
          const { data: members } = await supabase
            .from("team_members")
            .select("user_id")
            .eq("team_id", team.team_id);

          let totalQuestions = 0;
          if (members && members.length > 0) {
            const userIds = members.map(m => m.user_id).filter(Boolean);
            const { count } = await supabase
              .from("submissions")
              .select("*", { count: "exact", head: true })
              .in("user_id", userIds);
            totalQuestions = count || 0;
          }

          return {
            team_id: team.team_id,
            team_name: team.team_name,
            short_id: team.short_id || "",
            total_questions: totalQuestions,
            member_count: members?.length || 0
          };
        })
      );
      setAllTeams(teamsWithStats);
    }
  };

  const fetchNotifications = async (uid: string) => {
    const { data } = await supabase
      .from("team_notifications")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(20);

    if (data) {
      setNotifications(data as Notification[]);
    }
  };

  const fetchTeamMembersForView = async (tid: string) => {
    const { data } = await supabase
      .from("team_members")
      .select(`
        *,
        users:user_id (full_name, email, combat_name)
      `)
      .eq("team_id", tid)
      .order("total_questions_solved", { ascending: false });

    if (data) {
      const memberIds = data.map(m => m.user_id).filter(Boolean);
      const { data: submissions } = await supabase
        .from("submissions")
        .select("user_id")
        .in("user_id", memberIds);
      
      const solvedCounts: Record<string, number> = {};
      submissions?.forEach(s => {
        solvedCounts[s.user_id] = (solvedCounts[s.user_id] || 0) + 1;
      });

      const updatedData = data.map(m => ({
        ...m,
        total_questions_solved: solvedCounts[m.user_id || ""] || 0
      }));

      setSelectedTeamMembers(updatedData);
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim() || !userId) return;

    setIsCreating(true);
    try {
      const { data: team, error: teamError } = await supabase
        .from("teams")
        .insert({
          team_name: newTeamName.trim(),
          created_by: userId
        })
        .select()
        .single();

      if (teamError) throw teamError;

      const { error: memberError } = await supabase
        .from("team_members")
        .insert({
          team_id: team.team_id,
          user_id: userId,
          role: "leader"
        });

      if (memberError) throw memberError;

      setUserTeam(team as Team);
      setShowCreateDialog(false);
      setShowNoTeamView(false);
      toast({
        title: "Team created! 🎉",
        description: `Your Team ID is: ${team.short_id}`
      });
      
      await fetchTeamMembers(team.team_id);
      await fetchAllTeams();
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

  const handleJoinTeam = async () => {
    if (!joinTeamCode.trim() || !userId) return;

    setIsJoining(true);
    try {
      // Find team by short_id
      const { data: team, error: findError } = await supabase
        .from("teams")
        .select("*")
        .eq("short_id", joinTeamCode.trim())
        .maybeSingle();

      if (findError || !team) {
        toast({
          title: "Team not found",
          description: "Please check the team ID and try again",
          variant: "destructive"
        });
        return;
      }

      // Check team capacity
      const { data: members } = await supabase
        .from("team_members")
        .select("id")
        .eq("team_id", team.team_id);

      if (members && members.length >= 4) {
        toast({
          title: "Team is full",
          description: "Maximum 4 members allowed",
          variant: "destructive"
        });
        return;
      }

      // Check if already in a team
      const { data: existingMembership } = await supabase
        .from("team_members")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existingMembership) {
        toast({
          title: "Already in a team",
          description: "You need to leave your current team first",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from("team_members")
        .insert({
          team_id: team.team_id,
          user_id: userId,
          role: "member"
        });

      if (error) throw error;

      setUserTeam(team as Team);
      setShowJoinDialog(false);
      setShowNoTeamView(false);
      toast({
        title: "Joined team! 🎉",
        description: `Welcome to ${team.team_name}`
      });
      
      await fetchTeamMembers(team.team_id);
      await fetchAllTeams();
    } catch (error) {
      console.error("Error joining team:", error);
      toast({
        title: "Failed to join team",
        variant: "destructive"
      });
    } finally {
      setIsJoining(false);
    }
  };

  const handleChallengeTeam = async (opponentTeam: AllTeam) => {
    if (!userTeam || !userId) return;

    // Check if user is team lead or consistency king
    const leader = getLeader();
    const consistencyKing = getConsistencyKing();
    const canChallenge = leader?.user_id === userId || consistencyKing?.user_id === userId;

    if (!canChallenge) {
      toast({
        title: "Not authorized",
        description: "Only Team Lead or Consistency King can issue challenges",
        variant: "destructive"
      });
      return;
    }

    // Calculate next Sunday 10 PM
    const now = new Date();
    const sunday = nextSunday(now);
    const startTime = setMinutes(setHours(sunday, 22), 0);
    const endTime = new Date(startTime.getTime() + 3 * 60 * 60 * 1000); // 3 hours later

    try {
      const { data: challenge, error } = await supabase
        .from("team_challenges")
        .insert({
          challenger_team: userTeam.team_id,
          opponent_team: opponentTeam.team_id,
          challenge_type: "mock_test",
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          status: "pending",
          mock_test_id: "mock_test_1"
        })
        .select()
        .single();

      if (error) throw error;

      // Get opponent team members and send notifications
      const { data: opponentMembers } = await supabase
        .from("team_members")
        .select("user_id")
        .eq("team_id", opponentTeam.team_id);

      if (opponentMembers) {
        const notifications = opponentMembers.map(m => ({
          team_id: opponentTeam.team_id,
          user_id: m.user_id,
          title: "New Challenge!",
          message: `${userTeam.team_name} has challenged ${opponentTeam.team_name} for a 3-hour JEE Mains mock test on ${format(startTime, "EEEE 'at' h:mm a")}!`,
          type: "challenge",
          challenge_id: challenge.challenge_id
        }));

        await supabase.from("team_notifications").insert(notifications);
      }

      toast({
        title: "Challenge sent! ⚔️",
        description: `Challenge sent to ${opponentTeam.team_name} for ${format(startTime, "EEEE 'at' h:mm a")}`
      });

      await fetchTeamChallenges(userTeam.team_id);
      setShowTeamsDialog(false);
    } catch (error) {
      console.error("Error creating challenge:", error);
      toast({
        title: "Failed to send challenge",
        variant: "destructive"
      });
    }
  };

  const handleAcceptChallenge = async (challenge: Challenge) => {
    if (!userTeam || !userId) return;

    const leader = getLeader();
    if (leader?.user_id !== userId) {
      toast({
        title: "Not authorized",
        description: "Only the Team Lead can accept challenges",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("team_challenges")
        .update({
          accepted: true,
          accepted_at: new Date().toISOString(),
          status: "scheduled"
        })
        .eq("challenge_id", challenge.challenge_id);

      if (error) throw error;

      toast({
        title: "Challenge accepted! ⚔️",
        description: "Get ready for battle!"
      });

      await fetchTeamChallenges(userTeam.team_id);
    } catch (error) {
      console.error("Error accepting challenge:", error);
      toast({
        title: "Failed to accept challenge",
        variant: "destructive"
      });
    }
  };

  const handleLeaveTeam = async () => {
    if (!userId || !userTeam) return;

    setIsLeaving(true);
    try {
      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("user_id", userId)
        .eq("team_id", userTeam.team_id);

      if (error) throw error;

      toast({
        title: "Left team successfully",
        description: "You have left the team. You can join or create a new one.",
      });

      setUserTeam(null);
      setTeamMembers([]);
      setChallenges([]);
      setShowNoTeamView(true);
      setShowLeaveDialog(false);
      await fetchAllTeams();
    } catch (error) {
      console.error("Error leaving team:", error);
      toast({
        title: "Failed to leave team",
        variant: "destructive"
      });
    } finally {
      setIsLeaving(false);
    }
  };

  const getLeader = () => {
    if (teamMembers.length === 0) return null;
    return teamMembers.reduce((prev, current) => 
      (prev.total_questions_solved > current.total_questions_solved) ? prev : current
    , teamMembers[0]);
  };

  const getConsistencyKing = () => {
    return teamMembers.find(m => m.daily_questions_solved >= 5);
  };

  const getMemberName = (member: TeamMember) => {
    return member.users?.combat_name || member.users?.full_name || "Member";
  };

  const unreadNotifications = notifications.filter(n => !n.is_read).length;

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
          <Badge className="mb-4 bg-gradient-to-r from-blue-500 to-red-500 text-white border-0">
            <Users className="w-3 h-3 mr-1" />
            Friendly Preparation
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            {userTeam ? userTeam.team_name : "Team Preparation"}
          </h1>
          <p className="text-muted-foreground">
            {userTeam ? `Team ID: ${userTeam.short_id}` : "Create or join a team to get started"}
          </p>
        </motion.div>

        {showNoTeamView && !userTeam ? (
          /* No Team View - Two Buttons */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto"
          >
            <Card className="p-8 text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-bold mb-2">No Team Yet</h2>
              <p className="text-muted-foreground mb-6">
                Create a new team or join one with a Team ID
              </p>

              <div className="space-y-3">
                {/* Join Team Button */}
                <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-gradient-to-r from-blue-500 to-red-500">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Join Team
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Join a Team</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div>
                        <label className="text-sm text-muted-foreground mb-2 block">
                          Enter 6-digit Team ID
                        </label>
                        <Input
                          placeholder="Enter team ID (e.g., 123456)"
                          value={joinTeamCode}
                          onChange={(e) => setJoinTeamCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          maxLength={6}
                          className="text-center text-2xl tracking-widest"
                        />
                      </div>
                      <Button 
                        onClick={handleJoinTeam}
                        disabled={isJoining || joinTeamCode.length !== 6}
                        className="w-full"
                      >
                        {isJoining ? "Joining..." : "Join Team"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Create Team Button */}
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Team
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
                        className="w-full bg-gradient-to-r from-orange-500 to-red-500"
                      >
                        {isCreating ? "Creating..." : "Create Team"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </Card>
          </motion.div>
        ) : userTeam && (
          /* Team Dashboard */
          <>
            {/* Quick Actions Bar */}
            <div className="flex justify-center gap-3 mb-6 flex-wrap">
              <Button 
                variant="outline" 
                onClick={() => setShowTeamsDialog(true)}
                className="gap-2"
              >
                <Eye className="w-4 h-4" />
                View Teams
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowNotificationsDialog(true)}
                className="gap-2 relative"
              >
                <Bell className="w-4 h-4" />
                Notifications
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
              </Button>
              <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="gap-2 border-red-500/50 text-red-500 hover:bg-red-500/10"
                  >
                    <LogOut className="w-4 h-4" />
                    Leave Team
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Leave Team?</DialogTitle>
                  </DialogHeader>
                  <div className="pt-4 space-y-4">
                    <p className="text-muted-foreground">
                      Are you sure you want to leave <span className="font-bold text-foreground">{userTeam?.team_name}</span>? 
                      You'll lose access to team challenges and battle history.
                    </p>
                    <div className="flex gap-3">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowLeaveDialog(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleLeaveTeam}
                        disabled={isLeaving}
                        className="flex-1 bg-red-500 hover:bg-red-600"
                      >
                        {isLeaving ? "Leaving..." : "Leave Team"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Tabs defaultValue="team" className="space-y-6">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
                <TabsTrigger value="team">My Team</TabsTrigger>
                <TabsTrigger value="challenges">Challenges</TabsTrigger>
                <TabsTrigger value="results">Results</TabsTrigger>
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
                          const isLeader = getLeader()?.id === member.id;
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
                                  {getMemberName(member)[0]}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium">
                                      {getMemberName(member)}
                                    </p>
                                    {isLeader && (
                                      <Crown className="w-4 h-4 text-yellow-500" />
                                    )}
                                    {isConsistencyKing && (
                                      <Flame className="w-4 h-4 text-orange-500" />
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {isLeader && isConsistencyKing 
                                      ? "Team Lead & Consistency King" 
                                      : isLeader 
                                      ? "Team Lead" 
                                      : isConsistencyKing 
                                      ? "Consistency King" 
                                      : "Member"}
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
                        <div className="mt-4 p-3 bg-muted/50 rounded-lg text-center">
                          <p className="text-sm text-muted-foreground">
                            Share Team ID: <span className="font-bold text-primary">{userTeam.short_id}</span>
                          </p>
                        </div>
                      )}
                    </Card>
                  </motion.div>

                  {/* Team Stats */}
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
                            {teamMembers.length}
                          </p>
                          <p className="text-sm text-muted-foreground">Members</p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-6">
                      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Swords className="w-5 h-5 text-red-500" />
                        Challenge Other Teams
                      </h3>
                      
                      <Button
                        onClick={() => setShowTeamsDialog(true)}
                        className="w-full bg-gradient-to-r from-red-500 to-orange-500"
                      >
                        <Swords className="w-4 h-4 mr-2" />
                        Find Teams to Challenge
                      </Button>

                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        {getLeader()?.user_id === userId || getConsistencyKing()?.user_id === userId
                          ? "You can issue challenges as Team Lead / Consistency King"
                          : "Only Team Lead or Consistency King can issue challenges"}
                      </p>
                    </Card>
                  </motion.div>
                </div>
              </TabsContent>

              {/* Challenges Tab */}
              <TabsContent value="challenges">
                <Card className="p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Swords className="w-5 h-5 text-red-500" />
                    Team Challenges
                  </h3>

                  {challenges.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Swords className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No challenges yet. Challenge another team!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {challenges.map((challenge) => {
                        const isChallenger = challenge.challenger_team === userTeam?.team_id;
                        const challengerTeam = allTeams.find(t => t.team_id === challenge.challenger_team);
                        const opponentTeamData = allTeams.find(t => t.team_id === challenge.opponent_team);
                        const isPending = !challenge.accepted && challenge.status === "pending";
                        const needsAcceptance = !isChallenger && isPending && getLeader()?.user_id === userId;

                        return (
                          <motion.div
                            key={challenge.challenge_id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 bg-muted/50 rounded-lg border border-border"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Swords className="w-5 h-5 text-red-500" />
                                <span className="font-bold">
                                  {challengerTeam?.team_name} vs {opponentTeamData?.team_name}
                                </span>
                              </div>
                              <Badge variant={
                                challenge.status === "completed" ? "default" :
                                challenge.accepted ? "secondary" : "outline"
                              }>
                                {challenge.status === "completed" ? "Completed" :
                                 challenge.accepted ? "Scheduled" : "Pending"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              <Calendar className="w-4 h-4 inline mr-1" />
                              {format(new Date(challenge.start_time), "EEEE, MMMM d 'at' h:mm a")}
                            </p>
                            
                            {needsAcceptance && (
                              <Button
                                size="sm"
                                onClick={() => handleAcceptChallenge(challenge)}
                                className="bg-green-500 hover:bg-green-600"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Accept Challenge
                              </Button>
                            )}

                            {challenge.status === "completed" && (
                              <div className="mt-2 p-2 bg-background rounded text-center">
                                <p className="text-sm">
                                  Winner: <span className="font-bold text-green-500">
                                    {challenge.winner_team === challenge.challenger_team 
                                      ? challengerTeam?.team_name 
                                      : opponentTeamData?.team_name}
                                  </span>
                                </p>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </TabsContent>

              {/* Results Tab */}
              <TabsContent value="results">
                <Card className="p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    Battle Results
                  </h3>

                  <div className="text-center py-8 text-muted-foreground">
                    <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Results are announced between 5 PM - 10 PM on Sundays</p>
                    <p className="text-sm mt-2">Completed battles will appear here</p>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>

      {/* View Teams Dialog */}
      <Dialog open={showTeamsDialog} onOpenChange={setShowTeamsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              All Teams
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 pt-4">
            {allTeams.filter(t => t.team_id !== userTeam?.team_id).map((team) => (
              <motion.div
                key={team.team_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-muted/50 rounded-lg border border-border hover:border-primary/50 transition-all cursor-pointer"
                onClick={async () => {
                  setSelectedViewTeam(team);
                  await fetchTeamMembersForView(team.team_id);
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold">{team.team_name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {team.member_count}/4 members • {team.total_questions} questions solved
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleChallengeTeam(team);
                    }}
                    className="bg-red-500/10 border-red-500/50 text-red-500 hover:bg-red-500/20"
                  >
                    <Swords className="w-4 h-4 mr-1" />
                    Challenge
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Team Details Dialog */}
      <Dialog open={!!selectedViewTeam} onOpenChange={() => setSelectedViewTeam(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedViewTeam?.team_name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 pt-4">
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-2xl font-bold text-primary">{selectedViewTeam?.total_questions}</p>
              <p className="text-sm text-muted-foreground">Total Questions Solved</p>
            </div>

            <h4 className="font-bold mt-4">Team Members</h4>
            {selectedTeamMembers.map((member, index) => {
              const isLeader = index === 0;
              return (
                <div key={member.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-red-500 flex items-center justify-center text-white text-sm font-bold">
                      {getMemberName(member)[0]}
                    </div>
                    <div>
                      <p className="font-medium flex items-center gap-1">
                        {getMemberName(member)}
                        {isLeader && <Crown className="w-3 h-3 text-yellow-500" />}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isLeader ? "Team Lead" : "Member"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{member.total_questions_solved}</p>
                    <p className="text-xs text-muted-foreground">solved</p>
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Notifications Dialog */}
      <Dialog open={showNotificationsDialog} onOpenChange={setShowNotificationsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 pt-4 max-h-[60vh] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-lg border ${
                    notification.is_read 
                      ? "bg-muted/30 border-border" 
                      : "bg-primary/10 border-primary/30"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {notification.type === "challenge" ? (
                      <Swords className="w-5 h-5 text-red-500 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                    )}
                    <div>
                      <p className="font-bold">{notification.title}</p>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(notification.created_at), "MMM d, h:mm a")}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamDashboard;