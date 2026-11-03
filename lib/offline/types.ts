// ============================================================================
// Sahil's Shore: Offline Queue Types
// ============================================================================

export type OfflineEntityType = "task" | "expense" | "meal" | "note" | "photo";

export type OfflineAction = "create" | "update" | "delete";

export type OfflineStatus = "pending" | "syncing" | "failed";

export interface QueuedMutation {
  id: string; // Internal unique ID
  idempotencyKey: string; // Client-generated UUID preventing duplicate insertions
  entityType: OfflineEntityType;
  action: OfflineAction;
  payload: Record<string, any>;
  status: OfflineStatus;
  retryCount: number;
  createdAt: string; // ISO 8601 UTC
  error?: string | null;
}

export interface QueuedPhoto {
  id: string;
  fileName: string;
  mimeType: string;
  blob: Blob | ArrayBuffer;
  metadata: {
    albumId?: string | null;
    placeId?: string | null;
    mealId?: string | null;
    takenAt?: string;
    caption?: string;
  };
  createdAt: string;
}

export interface SyncResult {
  syncedCount: number;
  failedCount: number;
  errors: string[];
}
