// ============================================================================
// Sahil's Shore: Google Drive Disconnect Endpoint
// Route: POST /api/drive/disconnect
// ============================================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { disconnectDrive } from "@/lib/drive";
import { writeTimelineEvent } from "@/lib/timeline";

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

    const success = await disconnectDrive(supabase, user.id);

    if (success) {
      await writeTimelineEvent(supabase, {
        userId: user.id,
        type: "drive_disconnected",
        summary: "Disconnected Google Drive integration",
        refTable: "drive_credentials",
      });
    }

    return NextResponse.json({ success });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to disconnect";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
