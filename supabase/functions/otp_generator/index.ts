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
    const { email, purpose } = await req.json() as {
      email?: string;
      purpose?: string;
    };

    if (!email) {
      return new Response(
        JSON.stringify({ success: false, message: "Email required" }),
        { status: 400, headers: { ...corsHeaders, "content-type": "application/json" } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const normalizedEmail = email.toLowerCase().trim();
    const flowPurpose = (purpose === "signup" || purpose === "forgot") ? purpose : "forgot";

    // Check if user exists in public.users table
    const { data: userRow, error: userErr } = await supabase
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (userErr) {
      console.error("otp_generator user check error", userErr);
      return new Response(
        JSON.stringify({ success: false, error: userErr.message }),
        { status: 500, headers: { ...corsHeaders, "content-type": "application/json" } }
      );
    }

    // For forgot password, user must exist
    if (flowPurpose === "forgot" && !userRow) {
      return new Response(
        JSON.stringify({ success: true, user_exists: false }),
        { status: 200, headers: { ...corsHeaders, "content-type": "application/json" } }
      );
    }

    // For signup, user should NOT exist
    if (flowPurpose === "signup" && userRow) {
      return new Response(
        JSON.stringify({ success: false, message: "User already registered. Please login instead." }),
        { status: 200, headers: { ...corsHeaders, "content-type": "application/json" } }
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Insert OTP into password_reset_otps table
    const { error: insertErr } = await supabase
      .from("password_reset_otps")
      .insert({
        email: normalizedEmail,
        otp_code: otp,
        used: false,
        purpose: flowPurpose,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      });

    if (insertErr) {
      console.error("otp_generator insert error", insertErr);
      return new Response(
        JSON.stringify({ success: false, error: insertErr.message }),
        { status: 500, headers: { ...corsHeaders, "content-type": "application/json" } }
      );
    }

    // Send OTP email via Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Prepixo <noreply@prepixo.info>",
        to: [normalizedEmail],
        subject: "Your OTP Code - Prepixo",
        html: `
          <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0A0E21; color: white;">
            <h1 style="color: #E57C23; text-align: center;">Prepixo</h1>
            <h2 style="text-align: center;">Your OTP Code</h2>
            <div style="background-color: #1D1E33; padding: 30px; border-radius: 16px; text-align: center; margin: 20px 0;">
              <p style="font-size: 36px; font-weight: bold; color: #E57C23; letter-spacing: 8px; margin: 0;">${otp}</p>
            </div>
            <p style="text-align: center; color: #9CA3AF;">This OTP is valid for 5 minutes.</p>
            <p style="text-align: center; color: #9CA3AF; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
          </div>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Resend error:", errorText);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to send email" }),
        { status: 500, headers: { ...corsHeaders, "content-type": "application/json" } }
      );
    }

    console.log("Email sent successfully");

    return new Response(
      JSON.stringify({ success: true, user_exists: userRow ? true : false }),
      { status: 200, headers: { ...corsHeaders, "content-type": "application/json" } }
    );
  } catch (e) {
    console.error("otp_generator fatal error", e);
    return new Response(
      JSON.stringify({ success: false, error: String(e) }),
      { status: 500, headers: { ...corsHeaders, "content-type": "application/json" } }
    );
  }
});
