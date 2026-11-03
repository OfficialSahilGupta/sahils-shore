// ============================================================================
// Sahil's Shore: Google Drive OAuth Initiation Endpoint
// Route: GET /api/drive/auth
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDriveOAuthUrl } from "@/lib/drive";

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.redirect(
        new URL("/login?message=Please log in to connect Google Drive.", request.url)
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    // Check if Google OAuth credentials exist
    if (!clientId || !clientSecret) {
      const searchParams = request.nextUrl.searchParams;
      const simulate = searchParams.get("simulate");

      // Development simulation mode if requested
      if (simulate === "true") {
        return NextResponse.redirect(
          new URL("/api/drive/callback?simulate=true&user_id=" + user.id, request.url)
        );
      }

      return NextResponse.redirect(
        new URL(
          "/settings?drive_error=missing_keys&tip=Set+GOOGLE_CLIENT_ID+and+GOOGLE_CLIENT_SECRET+in+.env.local",
          request.url
        )
      );
    }

    // CSRF state: base64 encoded user_id + timestamp + salt
    const statePayload = JSON.stringify({
      userId: user.id,
      timestamp: Date.now(),
      salt: Math.random().toString(36).substring(2, 10),
    });
    const state = Buffer.from(statePayload).toString("base64url");

    const authUrl = getDriveOAuthUrl(state);
    return NextResponse.redirect(authUrl);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
