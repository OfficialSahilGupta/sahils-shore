// ============================================================================
// Sahil's Shore: Vercel Cron Job — Automated Weekly Google Drive Backup
// Protected by CRON_SECRET header
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { exportBackupToDrive } from "@/lib/backups/export";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // 1. Verify CRON_SECRET authorization
    const expectedSecret = process.env.CRON_SECRET;
    if (expectedSecret) {
      const authHeader = req.headers.get("authorization");
      const bearerToken = authHeader?.startsWith("Bearer ")
        ? authHeader.slice(7)
        : null;
      const cronSecretHeader = req.headers.get("x-cron-secret");

      if (bearerToken !== expectedSecret && cronSecretHeader !== expectedSecret) {
        return NextResponse.json(
          { error: "Unauthorized: Invalid CRON_SECRET" },
          { status: 401 }
        );
      }
    }

    const adminClient = createAdminClient();

    // 2. Locate user to back up:
    // First priority: user with active Google Drive credentials
    const { data: driveCreds } = await adminClient
      .from("drive_credentials")
      .select("user_id")
      .limit(1)
      .maybeSingle();

    let targetUserId = driveCreds?.user_id;

    // Fallback: lookup single-user profile
    if (!targetUserId) {
      const { data: profile } = await adminClient
        .from("profiles")
        .select("user_id")
        .limit(1)
        .maybeSingle();
      targetUserId = profile?.user_id;
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: "No user found in database to back up." },
        { status: 404 }
      );
    }

    // 3. Execute cloud backup with cron trigger
    const result = await exportBackupToDrive(adminClient, targetUserId, "cron");

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Cron backup failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      trigger: "cron",
      folderName: result.folderName,
      driveFolderId: result.driveFolderId,
      totalRows: result.totalRows,
      tablesCount: result.tablesCount,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[/api/cron/backup] Error executing weekly cron backup:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// Allow POST as well in case external cron runners invoke POST
export async function POST(req: NextRequest) {
  return GET(req);
}
