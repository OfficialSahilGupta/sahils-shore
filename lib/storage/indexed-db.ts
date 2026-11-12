// ============================================================================
// Sahil's Shore: Client-Side IndexedDB Image & Diagram Vault
// Provides virtually unlimited offline storage for concept maps, whiteboard
// diagrams, and study notes screenshots without blowing up the 5MB localStorage limit.
// ============================================================================

const DB_NAME = "shore_image_vault";
const DB_VERSION = 1;
const STORE_NAME = "concept_maps";

export interface StoredConceptMapImage {
  id: string;
  dataUrl: string;
  mimeType: string;
  sizeBytes: number;
  caption: string;
  module: "learning" | "dsa";
  folderName: string;
  driveFileId?: string;
  driveWebViewLink?: string;
  isSyncedToDrive: boolean;
  createdAt: string;
  updatedAt: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB is not available in this environment."));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("module", "module", { unique: false });
        store.createIndex("isSyncedToDrive", "isSyncedToDrive", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Saves a concept map image to IndexedDB.
 */
export async function saveImageToIndexedDB(
  image: StoredConceptMapImage
): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(image);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("[IndexedDB] Could not save image to IndexedDB:", err);
  }
}

/**
 * Retrieves a concept map image by its ID.
 */
export async function getImageFromIndexedDB(
  id: string
): Promise<StoredConceptMapImage | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("[IndexedDB] Could not get image from IndexedDB:", err);
    return null;
  }
}

/**
 * Retrieves all images that have not yet been synced to Google Drive.
 */
export async function getPendingDriveUploads(): Promise<StoredConceptMapImage[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const all: StoredConceptMapImage[] = req.result || [];
        resolve(all.filter((img) => !img.isSyncedToDrive));
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("[IndexedDB] Could not query pending drive uploads:", err);
    return [];
  }
}

/**
 * Marks an image as successfully synced to Google Drive.
 */
export async function markImageSyncedToDrive(
  id: string,
  driveFileId: string,
  driveWebViewLink?: string
): Promise<void> {
  try {
    const item = await getImageFromIndexedDB(id);
    if (!item) return;

    item.isSyncedToDrive = true;
    item.driveFileId = driveFileId;
    if (driveWebViewLink) item.driveWebViewLink = driveWebViewLink;
    item.updatedAt = new Date().toISOString();

    await saveImageToIndexedDB(item);
  } catch (err) {
    console.warn("[IndexedDB] Could not mark image synced:", err);
  }
}
