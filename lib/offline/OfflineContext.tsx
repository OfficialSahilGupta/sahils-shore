"use client";

// ============================================================================
// Sahil's Shore: Offline Context & Queue Hook
// ============================================================================

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  addMutationToDb,
  getPendingMutations,
  addPhotoToDb,
  getPendingPhotos,
} from "./db.ts";
import { syncOfflineQueue } from "./queue.ts";
import { QueuedMutation, OfflineEntityType } from "./types.ts";
import { useToast } from "@/components/ui/toast";

interface OfflineContextValue {
  isOnline: boolean;
  queuedCount: number;
  isSyncing: boolean;
  queuedItems: QueuedMutation[];
  enqueueMutation: (
    entityType: OfflineEntityType,
    payload: Record<string, any>,
    action?: "create" | "update" | "delete"
  ) => Promise<string>;
  enqueuePhoto: (file: File, metadata: Record<string, any>) => Promise<string>;
  syncNow: () => Promise<void>;
  refreshQueue: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextValue | null>(null);

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [queuedCount, setQueuedCount] = useState<number>(0);
  const [queuedItems, setQueuedItems] = useState<QueuedMutation[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const { toast } = useToast();

  const refreshQueue = useCallback(async () => {
    if (typeof window === "undefined" || !window.indexedDB) return;
    try {
      const mutations = await getPendingMutations();
      const photos = await getPendingPhotos();
      setQueuedItems(mutations);
      setQueuedCount(mutations.length + photos.length);
    } catch {
      // IndexedDB might not be initialized
    }
  }, []);

  const syncNow = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.onLine) return;
    try {
      setIsSyncing(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const result = await syncOfflineQueue(supabase, user.id);
      await refreshQueue();

      if (result.syncedCount > 0) {
        toast({
          title: "Offline Sync Complete",
          description: `Synced ${result.syncedCount} offline ${result.syncedCount === 1 ? "change" : "changes"}.`,
          type: "success",
        });
      }
    } catch (err: any) {
      console.warn("[OfflineContext] Sync error:", err);
    } finally {
      setIsSyncing(false);
    }
  }, [refreshQueue, toast]);

  // Track browser online/offline status & listen to Service Worker sync messages
  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);
    refreshQueue();

    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Back Online",
        description: "Internet connection restored. Syncing offline changes...",
        type: "info",
      });
      syncNow();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Offline Mode",
        description: "You're offline. New entries will be saved to your local queue.",
        type: "info",
      });
    };

    const handleSwMessage = (event: MessageEvent) => {
      if (event.data?.type === "SHORE_SYNC_TRIGGER") {
        syncNow();
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    navigator.serviceWorker?.addEventListener("message", handleSwMessage);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      navigator.serviceWorker?.removeEventListener("message", handleSwMessage);
    };
  }, [refreshQueue, syncNow, toast]);

  const enqueueMutation = useCallback(
    async (
      entityType: OfflineEntityType,
      payload: Record<string, any>,
      action: "create" | "update" | "delete" = "create"
    ): Promise<string> => {
      const idempotencyKey = crypto.randomUUID();
      const mutation: QueuedMutation = {
        id: idempotencyKey,
        idempotencyKey,
        entityType,
        action,
        payload: {
          ...payload,
          id: payload.id || idempotencyKey,
        },
        status: "pending",
        retryCount: 0,
        createdAt: new Date().toISOString(),
        error: null,
      };

      await addMutationToDb(mutation);
      await refreshQueue();

      toast({
        title: "Saved Offline",
        description: `Saved ${entityType} to offline queue.`,
        type: "info",
      });

      // If we are online, attempt immediate sync
      if (navigator.onLine) {
        syncNow();
      }

      return idempotencyKey;
    },
    [refreshQueue, syncNow, toast]
  );

  const enqueuePhoto = useCallback(
    async (file: File, metadata: Record<string, any>): Promise<string> => {
      const id = crypto.randomUUID();
      await addPhotoToDb({
        id,
        fileName: file.name,
        mimeType: file.type,
        blob: file,
        metadata,
        createdAt: new Date().toISOString(),
      });

      await refreshQueue();
      toast({
        title: "Photo Queued",
        description: "Photo saved to offline queue. Will upload when back online.",
        type: "info",
      });

      if (navigator.onLine) {
        syncNow();
      }

      return id;
    },
    [refreshQueue, syncNow, toast]
  );

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        queuedCount,
        isSyncing,
        queuedItems,
        enqueueMutation,
        enqueuePhoto,
        syncNow,
        refreshQueue,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
}

export function useOfflineQueue(): OfflineContextValue {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error("useOfflineQueue must be used within an OfflineProvider");
  }
  return context;
}
