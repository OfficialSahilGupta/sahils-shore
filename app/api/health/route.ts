// ============================================================================
// Sahil's Shore: Health & System Diagnostics API Route
// GET /api/health
// ============================================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const utcNow = new Date();

  // IST Formatter for display
  const istFormatter = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const istFormatted = `${istFormatter.format(utcNow)} IST`;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const allowedEmail = process.env.ALLOWED_EMAIL;

  const isSupabaseConfigured = Boolean(
    supabaseUrl &&
      anonKey &&
      !supabaseUrl.includes("your-project-id") &&
      !anonKey.includes("placeholder")
  );

  let dbStatus = "unconfigured";
  let dbLatencyMs: number | null = null;

  if (isSupabaseConfigured) {
    try {
      const startTime = Date.now();
      const supabase = createClient();
      // Lightweight test query against profiles table
      const { error } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true });

      dbLatencyMs = Date.now() - startTime;
      dbStatus = error ? `error: ${error.message}` : "connected";
    } catch (err: unknown) {
      dbStatus = `unreachable: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  // Mask allowed email for safe display (e.g. s***l@gmail.com)
  const maskedAllowedEmail = allowedEmail
    ? allowedEmail.replace(/^(.)(.*)(@.*)$/, (_, first, middle, domain) => {
        return `${first}${"*".repeat(Math.max(middle.length, 3))}${domain}`;
      })
    : "not_configured";

  const responseBody = {
    status: isSupabaseConfigured && dbStatus === "connected" ? "ok" : "healthy_needs_config",
    app: {
      name: "Sahil's Shore",
      shortName: "Shore",
      tagline: "Your day, your shore.",
      phase: "Phase 1 - Supabase Auth & Schema",
    },
    clock: {
      utc: utcNow.toISOString(),
      ist: istFormatted,
      timezone: "Asia/Kolkata",
    },
    config: {
      supabaseConfigured: isSupabaseConfigured,
      serviceRoleConfigured: Boolean(serviceRoleKey && !serviceRoleKey.includes("placeholder")),
      singleUserLockActive: Boolean(allowedEmail),
      allowedEmailMasked: maskedAllowedEmail,
    },
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs,
    },
  };

  return NextResponse.json(responseBody, { status: 200 });
}
