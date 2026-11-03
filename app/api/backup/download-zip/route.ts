// ============================================================================
// Sahil's Shore: API Route — Download Full Backup ZIP
// ============================================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { collectFullBackupData } from "@/lib/backups/export";
import { createBackupZip } from "@/lib/backups/zip";
import { currentISTDateString } from "@/lib/date-utils";

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

    const backupData = await collectFullBackupData(supabase, user.id);
    const zipBuffer = (await createBackupZip(backupData)) as Buffer;

    const dateStr = currentISTDateString();
    const filename = `sahils-shore-backup-${dateStr}.zip`;

    const uint8 = new Uint8Array(zipBuffer);
    return new NextResponse(uint8, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": zipBuffer.length.toString(),
      },
    });
  } catch (err: any) {
    console.error("[/api/backup/download-zip] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to generate backup zip." },
      { status: 500 }
    );
  }
}
