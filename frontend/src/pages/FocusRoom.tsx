import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useFocusRoom, FocusRoom as FocusRoomType } from "@/hooks/useFocusRoom";
import { LiveKitVideo } from "@/components/LiveKitVideo";
import { useNavigate } from "react-router-dom";
import {
  Video, Users, Plus, Clock, Globe, Lock, Send, LogOut, Crown, MessageSquare,
  Atom, Stethoscope, Shield, GraduationCap, Sparkles, Timer, X, Copy, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

const ROOM_TYPES = [
  { value: "JEE", label: "JEE", icon: Atom, color: "from-blue-500 to-cyan-500" },
  { value: "NEET", label: "NEET", icon: Stethoscope, color: "from-emerald-500 to-green-500" },
  { value: "NDA", label: "NDA", icon: Shield, color: "from-amber-500 to-orange-500" },
  { value: "CUET", label: "CUET", icon: GraduationCap, color: "from-red-500 to-violet-500" },
  { value: "Custom", label: "Custom", icon: Sparkles, color: "from-red-500 to-rose-500" },
];

const getRoomTypeConfig = (type: string) =>
  ROOM_TYPES.find((t) => t.value === type) || ROOM_TYPES[4];

const FocusRoom = () => {
  const navigate = useNavigate();
  const {
    rooms, currentRoom, participants, messages, userId, loading, isLeader,
    fetchRooms, createRoom, joinRoom, leaveRoom, endRoom,
    fetchRoomDetails, fetchParticipants, fetchMessages, sendMessage, subscribeToRoom,
  } = useFocusRoom();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(true);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Create room form
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("JEE");
  const [formDuration, setFormDuration] = useState(120);
  const [formPublic, setFormPublic] = useState(true);

  useEffect(() => {
    if (!loading && !userId) {
      navigate("/auth");
    }
  }, [loading, userId, navigate]);

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 15000);
    return () => clearInterval(interval);
  }, [fetchRooms]);

  // When in a room, subscribe to realtime
  useEffect(() => {
    if (!activeRoomId) return;
    fetchRoomDetails(activeRoomId);
    fetchParticipants(activeRoomId);
    fetchMessages(activeRoomId);
    const unsubscribe = subscribeToRoom(activeRoomId);
    return unsubscribe;
  }, [activeRoomId, fetchRoomDetails, fetchParticipants, fetchMessages, subscribeToRoom]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleCreateRoom = async () => {
    if (!formName.trim()) {
      toast.error("Enter a room name");
      return;
    }
    const roomId = await createRoom(formName.trim(), formType, formDuration, formPublic);
    if (roomId) {
      setShowCreateModal(false);
      setActiveRoomId(roomId);
      setFormName("");
    }
  };

  const handleJoinRoom = async (roomId: string) => {
    const success = await joinRoom(roomId);
    if (success) setActiveRoomId(roomId);
  };

  const handleLeaveRoom = async () => {
    if (activeRoomId) {
      await leaveRoom(activeRoomId);
      setActiveRoomId(null);
      fetchRooms();
    }
  };

  const handleEndRoom = async () => {
    if (activeRoomId) {
      await endRoom(activeRoomId);
      setActiveRoomId(null);
      fetchRooms();
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeRoomId) return;
    await sendMessage(activeRoomId, newMessage.trim());
    setNewMessage("");
  };

  const copyRoomLink = () => {
    const link = `${window.location.origin}/focus-room?join=${activeRoomId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Room link copied!");
  };

  // Calculate remaining time
  const getRemainingTime = (endsAt: string | null) => {
    if (!endsAt) return "∞";
    const remaining = new Date(endsAt).getTime() - Date.now();
    if (remaining <= 0) return "Ended";
    const hours = Math.floor(remaining / 3600000);
    const mins = Math.floor((remaining % 3600000) / 60000);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
          <Timer className="h-10 w-10 text-primary" />
        </motion.div>
      </div>
    );
  }

  // ─── ACTIVE ROOM VIEW ───
  if (activeRoomId && currentRoom) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-gradient-to-r ${getRoomTypeConfig(currentRoom.room_type).color}`}>
              <Video className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">{currentRoom.room_name}</h2>
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <Users className="h-3 w-3" /> {participants.length} online
                <span>•</span>
                <Clock className="h-3 w-3" /> {getRemainingTime(currentRoom.ends_at)} left
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={copyRoomLink} className="gap-1.5">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Share"}
            </Button>
            {isLeader ? (
              <Button variant="destructive" size="sm" onClick={handleEndRoom} className="gap-1.5">
                <X className="h-3.5 w-3.5" /> End Room
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={handleLeaveRoom} className="gap-1.5 text-destructive border-destructive/30">
                <LogOut className="h-3.5 w-3.5" /> Leave
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Main Area - LiveKit Video */}
          <LiveKitVideo
            roomId={activeRoomId}
            roomName={currentRoom.room_name}
            userId={userId!}
            userName={participants.find(p => p.user_id === userId)?.combat_name || "Warrior"}
            isLeader={isLeader}
            onDisconnect={handleLeaveRoom}
          />

          {/* Right Sidebar - Chat (leaders only can send) */}
          <div className="w-80 border-l border-border bg-card/40 flex flex-col hidden lg:flex">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> Room Chat
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {isLeader ? "Send messages to participants" : "Only leaders can send messages"}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <p className="text-center text-muted-foreground/50 text-sm mt-8">No messages yet</p>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                    {msg.sender_name?.[0]?.toUpperCase() || "L"}
                  </div>
                  <div>
                    <p className="text-xs text-accent font-medium">{msg.sender_name}</p>
                    <p className="text-sm text-foreground/90">{msg.message}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {isLeader && (
              <div className="p-3 border-t border-border">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Message participants..."
                    className="bg-background/80 h-9 text-sm"
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  />
                  <Button size="sm" onClick={handleSendMessage} className="h-9 w-9 p-0">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── LOBBY VIEW ───
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/10 mb-6"
            >
              <Video className="h-12 w-12 text-primary" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3">
              Study Together, Stay <span className="gradient-text">Accountable</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Join Focus Rooms with aspirants across India — distraction-free, goal-driven sessions.
            </p>
            <p className="text-muted-foreground/60 text-sm mt-2 italic">
              No distractions. Just focus.
            </p>
          </motion.div>

          {/* Create Room Button */}
          <div className="flex justify-center mb-10">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-shadow"
            >
              <Plus className="h-6 w-6" />
              Create My Own Room
            </motion.button>
          </div>

          {/* Room Type Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
            {ROOM_TYPES.filter((t) => t.value !== "Custom").map((type, i) => {
              const typeRooms = rooms.filter((r) => r.room_type === type.value);
              const totalOnline = typeRooms.reduce((acc, r) => acc + (r.participant_count || 0), 0);
              return (
                <motion.div
                  key={type.value}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ scale: 1.03, y: -4 }}
                  className="glass-card-hover p-5 rounded-2xl cursor-pointer"
                  onClick={() => {
                    // Filter rooms or create
                  }}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${type.color} flex items-center justify-center mb-3`}>
                    <type.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-bold text-foreground">{type.label} Rooms</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {typeRooms.length} active • {totalOnline} online
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Active Rooms */}
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Active Focus Rooms
          </h2>

          {rooms.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 glass-card rounded-2xl"
            >
              <Video className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">No active rooms right now</p>
              <p className="text-muted-foreground/60 text-sm mt-1">Be the first to create one!</p>
            </motion.div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room, i) => {
                const config = getRoomTypeConfig(room.room_type);
                return (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ y: -4 }}
                    className="glass-card-hover rounded-2xl overflow-hidden"
                  >
                    {/* Color strip */}
                    <div className={`h-1.5 bg-gradient-to-r ${config.color}`} />

                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg bg-gradient-to-r ${config.color}`}>
                            <config.icon className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{room.room_name}</h3>
                            <p className="text-xs text-muted-foreground">by {room.creator_name}</p>
                          </div>
                        </div>
                        {room.is_public ? (
                          <Globe className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" /> {room.participant_count} online
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" /> {getRemainingTime(room.ends_at)}
                        </span>
                      </div>

                      <Button
                        className="w-full gap-2"
                        onClick={() => handleJoinRoom(room.id)}
                      >
                        <Video className="h-4 w-4" />
                        Join Room
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Bottom Quote */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center text-muted-foreground/40 mt-16 text-sm italic"
          >
            "Every minute of focus counts toward your dream college."
          </motion.p>
        </div>
      </main>

      <Footer />

      {/* Coming Soon Modal */}
      <Dialog open={showComingSoon} onOpenChange={setShowComingSoon}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-[#111111] to-[#000000] border border-[#E50914]/30">
          <DialogHeader>
            <div className="flex flex-col items-center text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-[#E50914] to-red-600 flex items-center justify-center mb-4"
              >
                <Timer className="w-10 h-10 text-white" />
              </motion.div>
              <DialogTitle className="text-2xl font-bold text-white mb-2">
                Feature Coming Soon! 🚀
              </DialogTitle>
              <p className="text-gray-400 text-sm">
                Focus Rooms will be available soon. Stay tuned for collaborative study sessions!
              </p>
            </div>
          </DialogHeader>
          <Button
            onClick={() => {
              setShowComingSoon(false);
              navigate("/");
            }}
            className="w-full bg-[#E50914] hover:bg-[#E50914]/90 text-white font-bold mt-4"
          >
            Go Back to Home
          </Button>
        </DialogContent>
      </Dialog>

      {/* Create Room Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">Create Focus Room</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Room Name</label>
              <Input
                placeholder="e.g., JEE Physics Marathon"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="bg-background/80"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Room Type</label>
              <Select value={formType} onValueChange={setFormType}>
                <SelectTrigger className="bg-background/80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROOM_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Duration (minutes)</label>
              <Select value={String(formDuration)} onValueChange={(v) => setFormDuration(Number(v))}>
                <SelectTrigger className="bg-background/80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[30, 60, 90, 120, 180, 240].map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      {d >= 60 ? `${d / 60}h` : `${d}m`} session
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Visibility</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setFormPublic(true)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${
                    formPublic
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  <Globe className="h-4 w-4" /> Public
                </button>
                <button
                  onClick={() => setFormPublic(false)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${
                    !formPublic
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  <Lock className="h-4 w-4" /> Private
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleCreateRoom}
                className="flex-1 gap-2 bg-gradient-to-r from-primary to-secondary text-primary-foreground"
              >
                <Plus className="h-4 w-4" />
                Create Room
              </Button>
              <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FocusRoom;
