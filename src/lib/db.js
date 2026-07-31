import { supabase } from "./supabaseClient";

const FUNCTION_URL = import.meta.env.VITE_PORTFOLIO_FUNCTION_URL; // e.g. https://<project-ref>.supabase.co/functions/v1/portfolio-write
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** Anyone can read — table has a public SELECT policy (see schema.sql). */
export async function loadShared(key, fallback) {
  try {
    const { data, error } = await supabase
      .from("portfolio_data")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (error || !data) return fallback;
    return data.value ?? fallback;
  } catch (e) {
    console.error("loadShared failed", key, e);
    return fallback;
  }
}

/**
 * Only succeeds if the passcode matches OWNER_PASSCODE_HASH set as a secret
 * on the Edge Function — that check happens server-side, never in this
 * browser code. Returns true/false.
 */
export async function saveShared(key, value, passcode) {
  try {
    const res = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify({ passcode, key, value }),
    });
    const json = await res.json();
    return Boolean(json.ok);
  } catch (e) {
    console.error("saveShared failed", key, e);
    return false;
  }
}

/** Verifies a passcode without writing anything — used for the sign-in modal. */
export async function verifyPasscode(passcode) {
  try {
    const res = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify({ passcode }), // no key/value → verify-only
    });
    const json = await res.json();
    return Boolean(json.ok);
  } catch (e) {
    console.error("verifyPasscode failed", e);
    return false;
  }
}

/* ---------------------------------------------------------------------
   "Stay signed in on this device" — this is a real website now, so plain
   localStorage is fine (unlike a Claude artifact sandbox). We store the
   passcode only on the owner's own device, to re-send with each save call.
   Anyone using the owner's browser session could see it in devtools —
   same tradeoff as any "remember me" checkbox on a small personal site.
   --------------------------------------------------------------------- */
const LOCAL_KEY = "ojas-portfolio:owner-passcode";

export function getStoredPasscode() {
  try {
    return localStorage.getItem(LOCAL_KEY) || null;
  } catch (e) {
    return null;
  }
}

export function storePasscode(passcode) {
  try {
    localStorage.setItem(LOCAL_KEY, passcode);
  } catch (e) {
    /* ignore */
  }
}

export function clearStoredPasscode() {
  try {
    localStorage.removeItem(LOCAL_KEY);
  } catch (e) {
    /* ignore */
  }
}
