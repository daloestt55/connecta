import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const TELEGRAM_BUG_BOT_TOKEN = Deno.env.get("TELEGRAM_BUG_BOT_TOKEN") || "";
const TELEGRAM_BUG_CHAT_ID = Deno.env.get("TELEGRAM_BUG_CHAT_ID") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, authorization, apikey, x-client-info",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !TELEGRAM_BUG_BOT_TOKEN || !TELEGRAM_BUG_CHAT_ID) {
      return new Response(
        JSON.stringify({ error: "Missing environment variables" }),
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

    const payload = await req.json();
    const title = String(payload?.title || "").trim();
    const description = String(payload?.description || "").trim();
    const category = String(payload?.category || "").trim();
    const username = String(payload?.username || "").trim();
    const email = String(payload?.email || "").trim();
    const userId = String(payload?.userId || user.id || "").trim();
    const pageUrl = String(payload?.pageUrl || "").trim();
    const userAgent = String(payload?.userAgent || "").trim();

    if (!title || !description || !category) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const lines = [
      "Connecta Bug Report",
      `Category: ${category}`,
      `Title: ${title}`,
      `Description: ${description}`,
      "",
      `User: ${username || "Unknown"}`,
      `Email: ${email || user.email || "Unknown"}`,
      `User ID: ${userId || "Unknown"}`,
      `Page: ${pageUrl || "Unknown"}`,
      `Agent: ${userAgent || "Unknown"}`,
      `Time: ${new Date().toISOString()}`,
    ];

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BUG_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_BUG_CHAT_ID,
          text: lines.join("\n"),
        }),
      }
    );

    const result = await telegramResponse.json();

    if (!result.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to send Telegram message", details: result }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || "Unexpected error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
