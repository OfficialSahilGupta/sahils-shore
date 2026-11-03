// ============================================================================
// Sahil's Shore: Google Drive Sync Queue Retry Endpoint
// Route: POST /api/drive/sync-retry
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { queueId, mediaId } = body;

    if (queueId) {
      // Retry specific sync queue item
      const { data: queueItem } = await supabase
        .from("sync_queue")
        .select("*")
        .eq("id", queueId)
        .eq("user_id", user.id)
        .single();

      if (!queueItem) {
        return NextResponse.json({ error: "Queue item not found" }, { status: 404 });
      }

      await supabase
        .from("sync_queue")
        .update({
          status: "pending",
          attempts: (queueItem.attempts || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", queueId);

      const targetMediaId = (queueItem.payload as Record<string, unknown>)?.media_id as string;
      if (targetMediaId) {
        await supabase
          .from("media_items")
          .update({ sync_status: "pending", updated_at: new Date().toISOString() })
          .eq("id", targetMediaId)
          .eq("user_id", user.id);
      }

      return NextResponse.json({ success: true, retriedId: queueId });
    } else if (mediaId) {
      // Retry by media ID
      await supabase
        .from("media_items")
        .update({ sync_status: "pending", updated_at: new Date().toISOString() })
        .eq("id", mediaId)
        .eq("user_id", user.id);

      return NextResponse.json({ success: true, retriedMediaId: mediaId });
    } else {
      // Retry all failed
      await supabase
        .from("sync_queue")
        .update({
          status: "pending",
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("status", "failed");

      await supabase
        .from("media_items")
        .update({
          sync_status: "pending",
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("sync_status", "failed");

      return NextResponse.json({ success: true, message: "All failed items queued for retry" });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Retry failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
