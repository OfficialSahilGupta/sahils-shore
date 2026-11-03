// ============================================================================
// Sahil's Shore: API Route — Export Backup Now to Google Drive
// ============================================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exportBackupToDrive } from "@/lib/backups/export";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await exportBackupToDrive(supabase, user.id, "manual");

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Backup failed." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      folderName: result.folderName,
      driveFolderId: result.driveFolderId,
      totalRows: result.totalRows,
      tablesCount: result.tablesCount,
    });
  } catch (err: any) {
    console.error("[/api/backup/export] Unhandled error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
