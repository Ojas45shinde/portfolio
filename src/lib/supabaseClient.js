import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn(
    "Supabase env vars are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (see .env.example)."
  );
}

// This anon key is *meant* to be public — it ships in the browser bundle.
// It only has read access, enforced by the Row Level Security policy in
// supabase/schema.sql. All writes go through the portfolio-write Edge
// Function, which uses the service-role key that never leaves Supabase.
export const supabase = createClient(url, anonKey);
