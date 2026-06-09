import { useState, useEffect, useCallback } from "react";
import {
  LiveKitRoom,
  VideoTrack,
  useTracks,
  useParticipants,
  useLocalParticipant,
  TrackToggle,
  ConnectionState,
  useConnectionState,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track, RoomEvent } from "livekit-client";
import { motion } from "framer-motion";
import { Video, VideoOff, Mic, MicOff, PhoneOff, Crown, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LiveKitVideoProps {
  roomId: string;
  roomName: string;
  userId: string;
  userName: string;
  isLeader: boolean;
  onDisconnect: () => void;
}

const LIVEKIT_URL = "wss://prepixo-j6v5hjub.livekit.cloud";

export const LiveKitVideo = ({
  roomId,
  roomName,
  userId,
  userName,
  isLeader,
  onDisconnect,
}: LiveKitVideoProps) => {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchToken = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fnError } = await supabase.functions.invoke("livekit-token", {
        body: {
          roomName: `focus-room-${roomId}`,
          participantName: userName || "Warrior",
          participantIdentity: userId,
        },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      if (!data?.token) throw new Error("No token received");

      setToken(data.token);
    } catch (err: any) {
      console.error("Failed to get LiveKit token:", err);
      setError(err.message || "Failed to connect to video");
      toast.error("Failed to connect to video room");
    } finally {
      setLoading(false);
    }
  }, [roomId, userId, userName]);

  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="flex flex-col items-center gap-3"
        >
          <Video className="h-10 w-10 text-primary" />
          <p className="text-muted-foreground text-sm">Connecting to video...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !token) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <VideoOff className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-muted-foreground">Could not connect to video</p>
          <p className="text-xs text-muted-foreground/60">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchToken}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <LiveKitRoom
      serverUrl={LIVEKIT_URL}
      token={token}
      connect={true}
      video={true}
      audio={true}
      onDisconnected={onDisconnect}
      className="flex-1 flex flex-col"
      data-lk-theme="default"
    >
      <RoomContent isLeader={isLeader} onDisconnect={onDisconnect} />
    </LiveKitRoom>
  );
};

const RoomContent = ({
  isLeader,
  onDisconnect,
}: {
  isLeader: boolean;
  onDisconnect: () => void;
}) => {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const connectionState = useConnectionState();

  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);

  const toggleVideo = async () => {
    try {
      await localParticipant.setCameraEnabled(!videoEnabled);
      setVideoEnabled(!videoEnabled);
    } catch (err) {
      console.error("Failed to toggle video:", err);
    }
  };

  const toggleAudio = async () => {
    try {
      await localParticipant.setMicrophoneEnabled(!audioEnabled);
      setAudioEnabled(!audioEnabled);
    } catch (err) {
      console.error("Failed to toggle audio:", err);
    }
  };

  const toggleScreenShare = async () => {
    try {
      const isSharing = localParticipant.isScreenShareEnabled;
      await localParticipant.setScreenShareEnabled(!isSharing);
    } catch (err) {
      console.error("Failed to toggle screen share:", err);
    }
  };

  if (connectionState === "disconnected") {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Disconnected from video</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Video Grid */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div
          className={`grid gap-3 h-full ${
            tracks.length <= 1
              ? "grid-cols-1"
              : tracks.length <= 4
              ? "grid-cols-2"
              : tracks.length <= 9
              ? "grid-cols-3"
              : "grid-cols-4"
          }`}
        >
          {tracks.map((trackRef, i) => (
            <motion.div
              key={trackRef.participant.identity + (trackRef.source || i)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`relative rounded-xl overflow-hidden bg-card/60 border min-h-[160px] ${
                trackRef.participant.identity === localParticipant.identity
                  ? "border-primary/40"
                  : "border-border"
              }`}
            >
              {trackRef.publication?.track && 'publication' in trackRef && trackRef.publication ? (
                <VideoTrack
                  trackRef={trackRef as any}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center text-2xl font-bold text-foreground border-2 border-border">
                    {(trackRef.participant.name || "W")[0]?.toUpperCase()}
                  </div>
                  <VideoOff className="h-4 w-4 text-muted-foreground/50" />
                </div>
              )}

              {/* Name overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                <div className="flex items-center gap-1.5">
                  {isLeader && trackRef.participant.identity === localParticipant.identity && (
                    <Crown className="h-3 w-3 text-yellow-400" />
                  )}
                  <span className="text-xs text-white font-medium truncate">
                    {trackRef.participant.name || "Warrior"}
                    {trackRef.participant.identity === localParticipant.identity && " (You)"}
                  </span>
                  {trackRef.participant.isMicrophoneEnabled === false && (
                    <MicOff className="h-3 w-3 text-red-400 ml-auto" />
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {/* Empty state if alone */}
          {tracks.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center gap-3 min-h-[300px]">
              <Video className="h-12 w-12 text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">Waiting for participants...</p>
              <p className="text-muted-foreground/50 text-xs italic">
                "Focus now, future you will thank you."
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="border-t border-border bg-card/80 backdrop-blur-xl px-4 py-3">
        <div className="flex items-center justify-center gap-3">
          <Button
            variant={videoEnabled ? "outline" : "destructive"}
            size="sm"
            onClick={toggleVideo}
            className="gap-2 rounded-xl h-10 px-4"
          >
            {videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
            {videoEnabled ? "Video" : "Video Off"}
          </Button>

          <Button
            variant={audioEnabled ? "outline" : "destructive"}
            size="sm"
            onClick={toggleAudio}
            className="gap-2 rounded-xl h-10 px-4"
          >
            {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            {audioEnabled ? "Mic" : "Muted"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={toggleScreenShare}
            className="gap-2 rounded-xl h-10 px-4"
          >
            <Monitor className="h-4 w-4" />
            Screen
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={onDisconnect}
            className="gap-2 rounded-xl h-10 px-4"
          >
            <PhoneOff className="h-4 w-4" />
            Leave
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LiveKitVideo;
