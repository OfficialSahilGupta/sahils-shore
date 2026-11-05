// ============================================================================
// Sahil's Shore: AI Coach Server-Side Route
// Route: GET /api/coach and POST /api/coach
// Securely processes AI Coach generation; keys never exposed to client
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getOrGenerateDailyInsight,
  getOrGenerateWeeklyReview,
  getCoachSettings,
  saveCoachSettings,
} from "@/lib/coach/service";
import { todayIST } from "@/lib/date-utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || todayIST();
    const type = searchParams.get("type") || "daily";

    const settings = await getCoachSettings(supabase, user.id);
    if (!settings.enabled) {
      return NextResponse.json({ enabled: false, insight: null });
    }

    if (type === "weekly") {
      const review = await getOrGenerateWeeklyReview(supabase, user.id, date, false);
      return NextResponse.json({ enabled: true, insight: review, type: "weekly" });
    }

    const insight = await getOrGenerateDailyInsight(supabase, user.id, date, false);
    return NextResponse.json({ enabled: true, insight, type: "daily" });
  } catch (err: any) {
    console.error("AI Coach GET error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch AI coach insight" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const date = body.date || todayIST();
    const forceRefresh = Boolean(body.forceRefresh);
    const type = body.type || "daily";

    const settings = await getCoachSettings(supabase, user.id);
    if (!settings.enabled) {
      return NextResponse.json({ enabled: false, insight: null });
    }

    if (type === "weekly") {
      const review = await getOrGenerateWeeklyReview(supabase, user.id, date, forceRefresh);
      return NextResponse.json({ enabled: true, insight: review, type: "weekly" });
    }

    const insight = await getOrGenerateDailyInsight(supabase, user.id, date, forceRefresh);
    return NextResponse.json({ enabled: true, insight, type: "daily" });
  } catch (err: any) {
    console.error("AI Coach POST error:", err);
    return NextResponse.json({ error: err.message || "Failed to generate AI coach insight" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const updated = await saveCoachSettings(supabase, user.id, body);
    return NextResponse.json({ success: true, settings: updated });
  } catch (err: any) {
    console.error("AI Coach PATCH error:", err);
    return NextResponse.json({ error: err.message || "Failed to update AI coach settings" }, { status: 500 });
  }
}
