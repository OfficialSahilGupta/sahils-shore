// ============================================================================
// Sahil's Shore: API Route — Backup Preview & Restoration
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { previewBackup, executeRestore } from "@/lib/backups/restore";

export const dynamic = "force-dynamic";

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

    const body = await req.json();
    const { jsonContent, previewOnly, mode } = body;

    if (!jsonContent || typeof jsonContent !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid jsonContent in request body." },
        { status: 400 }
      );
    }

    // 1. Preview mode
    if (previewOnly) {
      const preview = previewBackup(jsonContent);
      return NextResponse.json({ preview });
    }

    // 2. Execution mode
    const restoreMode: "merge" | "replace" = mode === "replace" ? "replace" : "merge";
    let parsedBackup: any;
    try {
      parsedBackup = JSON.parse(jsonContent);
    } catch {
      return NextResponse.json({ error: "Failed to parse backup JSON." }, { status: 400 });
    }

    const result = await executeRestore(supabase, user.id, parsedBackup, {
      mode: restoreMode,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Restoration encountered an error.", result },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error("[/api/backup/restore] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
