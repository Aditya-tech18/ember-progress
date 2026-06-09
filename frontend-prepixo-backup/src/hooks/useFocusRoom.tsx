import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface FocusRoom {
  id: string;
  room_name: string;
  room_type: string;
  created_by: string;
  is_public: boolean;
  duration_minutes: number;
  started_at: string;
  ends_at: string | null;
  active: boolean;
  max_participants: number;
  created_at: string;
  participant_count?: number;
  creator_name?: string;
}

export interface FocusParticipant {
  id: string;
  room_id: string;
  user_id: string;
  is_leader: boolean;
  joined_at: string;
  left_at: string | null;
  combat_name?: string;
  avatar_url?: string;
}

export interface FocusMessage {
  id: string;
  room_id: string;
  sender_id: string;
  message: string;
  created_at: string;
  sender_name?: string;
}

export const useFocusRoom = () => {
  const [rooms, setRooms] = useState<FocusRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<FocusRoom | null>(null);
  const [participants, setParticipants] = useState<FocusParticipant[]>([]);
  const [messages, setMessages] = useState<FocusMessage[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLeader, setIsLeader] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
      setLoading(false);
    };
    init();
  }, []);

  const fetchRooms = useCallback(async () => {
    const { data: roomsData, error } = await supabase
      .from("focus_rooms")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching rooms:", error);
      return;
    }

    if (roomsData) {
      // Get participant counts
      const roomsWithCounts = await Promise.all(
        roomsData.map(async (room: any) => {
          const { count } = await supabase
            .from("focus_participants")
            .select("*", { count: "exact", head: true })
            .eq("room_id", room.id)
            .is("left_at", null);

          const { data: creator } = await supabase
            .from("users")
            .select("combat_name")
            .eq("id", room.created_by)
            .single();

          return {
            ...room,
            participant_count: count || 0,
            creator_name: creator?.combat_name || "Anonymous",
          };
        })
      );
      setRooms(roomsWithCounts);
    }
  }, []);

  const createRoom = useCallback(async (
    roomName: string,
    roomType: string,
    durationMinutes: number,
    isPublic: boolean
  ) => {
    if (!userId) {
      toast.error("Please login to create a room");
      return null;
    }

    const endsAt = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("focus_rooms")
      .insert({
        room_name: roomName,
        room_type: roomType,
        created_by: userId,
        duration_minutes: durationMinutes,
        is_public: isPublic,
        ends_at: endsAt,
        active: true,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create room: " + error.message);
      return null;
    }

    // Auto-join as leader
    if (data) {
      await supabase.from("focus_participants").insert({
        room_id: data.id,
        user_id: userId,
        is_leader: true,
      });
      toast.success("Room created! You're the leader.");
      return data.id;
    }
    return null;
  }, [userId]);

  const joinRoom = useCallback(async (roomId: string) => {
    if (!userId) {
      toast.error("Please login to join a room");
      return false;
    }

    // Check if already in this room
    const { data: existing } = await supabase
      .from("focus_participants")
      .select("id")
      .eq("room_id", roomId)
      .eq("user_id", userId)
      .is("left_at", null)
      .single();

    if (existing) {
      return true; // Already in room
    }

    const { error } = await supabase
      .from("focus_participants")
      .insert({
        room_id: roomId,
        user_id: userId,
        is_leader: false,
      });

    if (error) {
      toast.error("Failed to join room");
      return false;
    }

    toast.success("Joined the focus room!");
    return true;
  }, [userId]);

  const leaveRoom = useCallback(async (roomId: string) => {
    if (!userId) return;

    await supabase
      .from("focus_participants")
      .update({ left_at: new Date().toISOString() })
      .eq("room_id", roomId)
      .eq("user_id", userId);

    setCurrentRoom(null);
    setParticipants([]);
    setMessages([]);
    setIsLeader(false);
  }, [userId]);

  const endRoom = useCallback(async (roomId: string) => {
    if (!userId) return;

    await supabase
      .from("focus_rooms")
      .update({ active: false })
      .eq("id", roomId)
      .eq("created_by", userId);

    // Mark all participants as left
    await supabase
      .from("focus_participants")
      .update({ left_at: new Date().toISOString() })
      .eq("room_id", roomId)
      .is("left_at", null);

    setCurrentRoom(null);
    setParticipants([]);
    setMessages([]);
    setIsLeader(false);
    toast.success("Room ended");
  }, [userId]);

  const fetchRoomDetails = useCallback(async (roomId: string) => {
    const { data: room } = await supabase
      .from("focus_rooms")
      .select("*")
      .eq("id", roomId)
      .single();

    if (room) {
      setCurrentRoom(room as FocusRoom);

      // Check if user is leader
      const { data: participant } = await supabase
        .from("focus_participants")
        .select("is_leader")
        .eq("room_id", roomId)
        .eq("user_id", userId!)
        .is("left_at", null)
        .single();

      setIsLeader(participant?.is_leader || false);
    }
  }, [userId]);

  const fetchParticipants = useCallback(async (roomId: string) => {
    const { data } = await supabase
      .from("focus_participants")
      .select("*")
      .eq("room_id", roomId)
      .is("left_at", null);

    if (data) {
      // Fetch user info
      const enriched = await Promise.all(
        data.map(async (p: any) => {
          const { data: user } = await supabase
            .from("users")
            .select("combat_name, avatar_url")
            .eq("id", p.user_id)
            .single();
          return {
            ...p,
            combat_name: user?.combat_name || "Warrior",
            avatar_url: user?.avatar_url,
          };
        })
      );
      setParticipants(enriched);
    }
  }, []);

  const fetchMessages = useCallback(async (roomId: string) => {
    const { data } = await supabase
      .from("focus_messages")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true })
      .limit(100);

    if (data) {
      const enriched = await Promise.all(
        data.map(async (m: any) => {
          const { data: user } = await supabase
            .from("users")
            .select("combat_name")
            .eq("id", m.sender_id)
            .single();
          return { ...m, sender_name: user?.combat_name || "Leader" };
        })
      );
      setMessages(enriched);
    }
  }, []);

  const sendMessage = useCallback(async (roomId: string, message: string) => {
    if (!userId || !isLeader) return;

    const { error } = await supabase
      .from("focus_messages")
      .insert({
        room_id: roomId,
        sender_id: userId,
        message,
      });

    if (error) {
      toast.error("Failed to send message");
    }
  }, [userId, isLeader]);

  // Subscribe to realtime updates for a room
  const subscribeToRoom = useCallback((roomId: string) => {
    const participantsChannel = supabase
      .channel(`focus_participants_${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "focus_participants", filter: `room_id=eq.${roomId}` },
        () => fetchParticipants(roomId)
      )
      .subscribe();

    const messagesChannel = supabase
      .channel(`focus_messages_${roomId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "focus_messages", filter: `room_id=eq.${roomId}` },
        () => fetchMessages(roomId)
      )
      .subscribe();

    const roomChannel = supabase
      .channel(`focus_room_${roomId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "focus_rooms", filter: `id=eq.${roomId}` },
        (payload) => {
          if (!(payload.new as any).active) {
            toast.info("Room has ended");
            setCurrentRoom(null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(participantsChannel);
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(roomChannel);
    };
  }, [fetchParticipants, fetchMessages]);

  return {
    rooms,
    currentRoom,
    participants,
    messages,
    userId,
    loading,
    isLeader,
    fetchRooms,
    createRoom,
    joinRoom,
    leaveRoom,
    endRoom,
    fetchRoomDetails,
    fetchParticipants,
    fetchMessages,
    sendMessage,
    subscribeToRoom,
  };
};
