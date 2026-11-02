// ============================================================================
// Sahil's Shore: Browser Supabase Client Helper
// For use in client components ("use client")
// ============================================================================

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Provide a fallback during build/dev if env vars are missing
    if (typeof window !== "undefined") {
      console.warn(
        "Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY) are missing. Check .env.local"
      );
    }
  }

  return createBrowserClient<Database>(
    supabaseUrl || "https://placeholder-project.supabase.co",
    supabaseAnonKey || "placeholder-anon-key"
  );
}
