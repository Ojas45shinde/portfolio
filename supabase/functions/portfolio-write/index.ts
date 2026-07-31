// Supabase Edge Function: portfolio-write
//
// This is the *only* place a write to portfolio_data can happen. The
// browser never gets a key with write access — it only gets the public
// anon key (read-only, enforced by RLS in schema.sql). This function
// holds the service-role key (auto-injected by Supabase) and only uses
// it after checking the passcode against OWNER_PASSCODE_HASH, a secret
// you set once with the Supabase CLI (see DEPLOY.md) and that never
// reaches the browser.
//
// Deploy with:  supabase functions deploy portfolio-write --no-verify-jwt

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const { passcode, key, value } = await req.json();

    const expectedHash = Deno.env.get("OWNER_PASSCODE_HASH");
    if (!expectedHash) {
      return json({ ok: false, error: "Server has no passcode configured." }, 500);
    }
    if (!passcode || (await sha256(passcode)) !== expectedHash) {
      return json({ ok: false, error: "Invalid passcode." }, 401);
    }

    // Verify-only call (owner sign-in check) — no key/value provided.
    if (!key) {
      return json({ ok: true });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error } = await supabase
      .from("portfolio_data")
      .upsert({ key, value }, { onConflict: "key" });

    if (error) return json({ ok: false, error: error.message }, 500);
    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 400);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}
