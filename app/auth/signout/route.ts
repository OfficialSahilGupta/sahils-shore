// ============================================================================
// Sahil's Shore: Sign-Out Handler
// Clears session cookies and redirects to /login
// ============================================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const supabase = createClient();

  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/login", requestUrl.origin), {
    status: 302,
  });
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const supabase = createClient();

  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/login", requestUrl.origin), {
    status: 302,
  });
}
