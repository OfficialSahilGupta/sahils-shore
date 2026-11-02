// ============================================================================
// Sahil's Shore: OAuth Callback Handler & Single-User Lock
// Validates Google OAuth code and enforces ALLOWED_EMAIL restriction
// ============================================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/";

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=no_code", requestUrl.origin)
    );
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    console.error("[auth/callback] Code exchange error:", error?.message);
    return NextResponse.redirect(
      new URL("/login?error=auth_failed", requestUrl.origin)
    );
  }

  // Single-User Lock Enforcement
  const allowedEmail = process.env.ALLOWED_EMAIL?.trim().toLowerCase();
  const userEmail = data.user.email?.trim().toLowerCase();

  if (allowedEmail && userEmail !== allowedEmail) {
    console.warn(
      `[auth/callback] Access denied for unauthorized account: "${userEmail}". Allowed: "${allowedEmail}".`
    );

    // Terminate session immediately
    await supabase.auth.signOut();

    return NextResponse.redirect(
      new URL("/login?error=unauthorized", requestUrl.origin)
    );
  }

  // Authorized user successfully authenticated
  const targetUrl = new URL(next, requestUrl.origin);
  return NextResponse.redirect(targetUrl);
}
