import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, otp, purpose } = await req.json() as {
      email?: string;
      otp?: string;
      purpose?: string;
    };

    if (!email || !otp) {
      return new Response(
        JSON.stringify({ valid: false, reason: "Email and OTP required" }),
        { status: 400, headers: { ...corsHeaders, "content-type": "application/json" } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const normalizedEmail = email.toLowerCase().trim();
    const flowPurpose = (purpose === "signup" || purpose === "forgot") ? purpose : "forgot";

    // Find the OTP record
    const { data: otpRecord, error: selectErr } = await supabase
      .from("password_reset_otps")
      .select("*")
      .eq("email", normalizedEmail)
      .eq("otp_code", otp)
      .eq("purpose", flowPurpose)
      .eq("used", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (selectErr) {
      console.error("verify_otp select error", selectErr);
      return new Response(
        JSON.stringify({ valid: false, reason: selectErr.message }),
        { status: 500, headers: { ...corsHeaders, "content-type": "application/json" } }
      );
    }

    if (!otpRecord) {
      return new Response(
        JSON.stringify({ valid: false, reason: "Invalid or expired OTP" }),
        { status: 200, headers: { ...corsHeaders, "content-type": "application/json" } }
      );
    }

    // Mark OTP as used
    const { error: updateErr } = await supabase
      .from("password_reset_otps")
      .update({ used: true })
      .eq("id", otpRecord.id);

    if (updateErr) {
      console.error("verify_otp update error", updateErr);
    }

    return new Response(
      JSON.stringify({ valid: true }),
      { status: 200, headers: { ...corsHeaders, "content-type": "application/json" } }
    );
  } catch (e) {
    console.error("verify_otp fatal error", e);
    return new Response(
      JSON.stringify({ valid: false, reason: String(e) }),
      { status: 500, headers: { ...corsHeaders, "content-type": "application/json" } }
    );
  }
});
