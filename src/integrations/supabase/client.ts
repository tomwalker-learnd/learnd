// src/integrations/supabase/client.ts
// Centralized Supabase client. Reads from Vite env vars and fails fast if missing.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env
  .VITE_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  const msg =
    "[Supabase] Missing VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY. Check your .env";
  // Fail fast in dev; throw to surface the error in CI/build
  console.error(msg);
  throw new Error(msg);
}

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      headers: {
        "x-client-info": "learnd-frontend",
      },
    },
  }
);
