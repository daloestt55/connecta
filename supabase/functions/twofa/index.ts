import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js";
import { authenticator } from "npm:otplib";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, authorization, apikey, x-client-info",
};

authenticator.options = { step: 30, window: 1 };

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase environment variables" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { action, code } = await req.json();

    if (!action) {
      return new Response(
        JSON.stringify({ error: "Missing action" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (action === "status") {
      const { data, error } = await adminClient
        .from("user_2fa")
        .select("enabled")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      return new Response(
        JSON.stringify({ enabled: data?.enabled === true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (action === "setup") {
      const secret = authenticator.generateSecret();
      const otpauthUrl = authenticator.keyuri(user.email || user.id, "Connecta", secret);

      const { error } = await adminClient
        .from("user_2fa")
        .upsert({
          user_id: user.id,
          email: user.email || "",
          secret,
          enabled: false,
        }, { onConflict: "user_id" });

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      return new Response(
        JSON.stringify({ secret, otpauthUrl }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (action === "confirm") {
      const { data, error } = await adminClient
        .from("user_2fa")
        .select("secret")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      if (!data?.secret || !code) {
        return new Response(
          JSON.stringify({ error: "Missing secret or code" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const isValid = authenticator.check(String(code), data.secret);
      if (!isValid) {
        return new Response(
          JSON.stringify({ error: "Invalid verification code" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const { error: updateError } = await adminClient
        .from("user_2fa")
        .update({ enabled: true })
        .eq("user_id", user.id);

      if (updateError) {
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      return new Response(
        JSON.stringify({ enabled: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (action === "verify") {
      const { data, error } = await adminClient
        .from("user_2fa")
        .select("secret, enabled")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      if (!data?.enabled) {
        return new Response(
          JSON.stringify({ error: "2FA not enabled" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const isValid = authenticator.check(String(code), data.secret);
      if (!isValid) {
        return new Response(
          JSON.stringify({ error: "Invalid 2FA code" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      return new Response(
        JSON.stringify({ valid: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (action === "disable") {
      const { error } = await adminClient
        .from("user_2fa")
        .update({ enabled: false })
        .eq("user_id", user.id);

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      return new Response(
        JSON.stringify({ enabled: false }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || "Internal error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
