// Resolves a login identifier (email OR phone) to the user's email.
// Uses service role to read auth.users; never exposes other PII.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { identifier } = await req.json();
    if (typeof identifier !== "string" || identifier.length < 3 || identifier.length > 120) {
      return json({ error: "invalid identifier" }, 400);
    }

    // If it looks like an email already, return as-is (no lookup needed)
    if (identifier.includes("@")) {
      return json({ email: identifier.trim().toLowerCase() });
    }

    const phone = identifier.replace(/\D/g, "");
    if (phone.length < 8) return json({ error: "invalid phone" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await admin
      .from("profiles")
      .select("id")
      .eq("phone", phone)
      .maybeSingle();
    if (error) return json({ error: error.message }, 500);
    if (!data) return json({ error: "not_found" }, 404);

    const { data: userRes, error: uErr } = await admin.auth.admin.getUserById(data.id);
    if (uErr || !userRes.user?.email) return json({ error: "not_found" }, 404);

    return json({ email: userRes.user.email });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
