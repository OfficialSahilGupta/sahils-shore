// ============================================================================
// Sahil's Shore: API Route — Backup History & Last-Backup Status
// ============================================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: logs, error } = await supabase
      .from("backup_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json({ logs: [], lastBackup: null });
    }

    const lastSuccessfulBackup = logs?.find((l) => l.status === "success") || null;
    const lastAttempt = logs?.[0] || null;

    return NextResponse.json({
      logs: logs || [],
      lastBackup: lastSuccessfulBackup,
      lastAttempt,
    });
  } catch (err: any) {
    console.error("[/api/backup/history] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
