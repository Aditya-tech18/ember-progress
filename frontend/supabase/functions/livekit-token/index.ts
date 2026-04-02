import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { AccessToken } from "npm:livekit-server-sdk@^2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LIVEKIT_API_KEY = Deno.env.get("LIVEKIT_API_KEY");
    const LIVEKIT_API_SECRET = Deno.env.get("LIVEKIT_API_SECRET");

    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
      throw new Error("LiveKit credentials not configured");
    }

    const { roomName, participantName, participantIdentity } = await req.json();

    if (!roomName || !participantName || !participantIdentity) {
      return new Response(
        JSON.stringify({ error: "roomName, participantName, and participantIdentity are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: participantIdentity,
      name: participantName,
      ttl: "6h",
    });

    token.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const jwt = await token.toJwt();

    return new Response(
      JSON.stringify({ token: jwt }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating LiveKit token:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
