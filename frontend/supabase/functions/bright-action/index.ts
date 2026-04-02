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
    const { email, new_password } = await req.json() as {
      email?: string;
      new_password?: string;
    };

    if (!email || !new_password) {
      return new Response(
        JSON.stringify({ success: false, error: "Email and new password required" }),
        { status: 400, headers: { ...corsHeaders, "content-type": "application/json" } }
      );
    }

    if (new_password.length < 6) {
      return new Response(
        JSON.stringify({ success: false, error: "Password must be at least 6 characters" }),
        { status: 400, headers: { ...corsHeaders, "content-type": "application/json" } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const normalizedEmail = email.toLowerCase().trim();

    // Find user by email in auth.users
    const { data: userData, error: userErr } = await supabase.auth.admin.listUsers();
    
    if (userErr) {
      console.error("bright-action listUsers error", userErr);
      return new Response(
        JSON.stringify({ success: false, error: userErr.message }),
        { status: 500, headers: { ...corsHeaders, "content-type": "application/json" } }
      );
    }

    const user = userData.users.find(u => u.email?.toLowerCase() === normalizedEmail);

    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "content-type": "application/json" } }
      );
    }

    // Update user password using admin API
    const { error: updateErr } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: new_password }
    );

    if (updateErr) {
      console.error("bright-action updateUser error", updateErr);
      return new Response(
        JSON.stringify({ success: false, error: updateErr.message }),
        { status: 500, headers: { ...corsHeaders, "content-type": "application/json" } }
      );
    }

    console.log("Password updated successfully for:", normalizedEmail);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "content-type": "application/json" } }
    );
  } catch (e) {
    console.error("bright-action fatal error", e);
    return new Response(
      JSON.stringify({ success: false, error: String(e) }),
      { status: 500, headers: { ...corsHeaders, "content-type": "application/json" } }
    );
  }
});
