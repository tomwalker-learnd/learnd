// src/integrations/supabase/client.ts
// Centralized Supabase client configured with project credentials
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = "https://rakdsvojiwpdunruenmg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJha2Rzdm9qaXdwZHVucnVlbm1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5ODYwNjksImV4cCI6MjA3MTU2MjA2OX0.88i1qTKmKhAXgartXMXLOll6P2KALLU8BiTEGljvQC8";

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
