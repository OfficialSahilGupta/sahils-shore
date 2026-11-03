// ============================================================================
// Sahil's Shore: Native IndexedDB Persistence for Offline Queue
// Zero external dependencies, pure browser IndexedDB API
// ============================================================================

import { QueuedMutation, QueuedPhoto } from "./types.ts";

const DB_NAME = "shore_offline_db";
const DB_VERSION = 1;

const STORES = {
  MUTATIONS: "mutations",
  PHOTOS: "photos",
} as const;

/**
 * Opens or upgrades the IndexedDB database.
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB is not available in this environment."));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Mutations Store
      if (!db.objectStoreNames.contains(STORES.MUTATIONS)) {
        const mutationStore = db.createObjectStore(STORES.MUTATIONS, {
          keyPath: "id",
        });
        mutationStore.createIndex("idempotencyKey", "idempotencyKey", { unique: true });
        mutationStore.createIndex("status", "status", { unique: false });
        mutationStore.createIndex("createdAt", "createdAt", { unique: false });
      }

      // 2. Photos Store
      if (!db.objectStoreNames.contains(STORES.PHOTOS)) {
        const photoStore = db.createObjectStore(STORES.PHOTOS, {
          keyPath: "id",
        });
        photoStore.createIndex("createdAt", "createdAt", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Saves a mutation to IndexedDB.
 */
export async function addMutationToDb(mutation: QueuedMutation): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.MUTATIONS, "readwrite");
    const store = tx.objectStore(STORES.MUTATIONS);
    const req = store.put(mutation);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Fetches all pending or failed mutations from IndexedDB.
 */
export async function getPendingMutations(): Promise<QueuedMutation[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.MUTATIONS, "readonly");
    const store = tx.objectStore(STORES.MUTATIONS);
    const req = store.getAll();
    req.onsuccess = () => {
      const all = (req.result || []) as QueuedMutation[];
      // Sort oldest first
      all.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      resolve(all);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Updates a mutation's status and error in IndexedDB.
 */
export async function updateMutationStatus(
  id: string,
  status: QueuedMutation["status"],
  error?: string | null
): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.MUTATIONS, "readwrite");
    const store = tx.objectStore(STORES.MUTATIONS);
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const item = getReq.result as QueuedMutation | undefined;
      if (!item) return resolve();

      item.status = status;
      if (error !== undefined) item.error = error;
      if (status === "failed") item.retryCount = (item.retryCount || 0) + 1;

      const putReq = store.put(item);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

/**
 * Removes a synced mutation from IndexedDB.
 */
export async function removeMutationFromDb(id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.MUTATIONS, "readwrite");
    const store = tx.objectStore(STORES.MUTATIONS);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Saves a photo file to IndexedDB for offline upload.
 */
export async function addPhotoToDb(photo: QueuedPhoto): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.PHOTOS, "readwrite");
    const store = tx.objectStore(STORES.PHOTOS);
    const req = store.put(photo);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Gets all pending photos from IndexedDB.
 */
export async function getPendingPhotos(): Promise<QueuedPhoto[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.PHOTOS, "readonly");
    const store = tx.objectStore(STORES.PHOTOS);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Removes a synced photo from IndexedDB.
 */
export async function removePhotoFromDb(id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.PHOTOS, "readwrite");
    const store = tx.objectStore(STORES.PHOTOS);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Clears all stores in IndexedDB (used for resets or testing).
 */
export async function clearAllOfflineQueue(): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.MUTATIONS, STORES.PHOTOS], "readwrite");
    tx.objectStore(STORES.MUTATIONS).clear();
    tx.objectStore(STORES.PHOTOS).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
