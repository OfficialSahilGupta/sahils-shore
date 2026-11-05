"use client";
/* eslint-disable @next/next/no-img-element */

// ============================================================================
// Sahil's Shore: Media Uploader Component
// Drag-and-drop, camera capture, EXIF extraction, thumbnailing, & Drive resumable upload
// ============================================================================

import React, { useRef, useState } from "react";
import {
  UploadCloud,
  Camera,
  Film,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Sparkles,
  Folder,
  Calendar,
} from "lucide-react";
import { generateImageThumbnail, generateVideoThumbnail } from "@/lib/media/thumbnail";
import { extractExifMetadata } from "@/lib/media/exif";
import { Select } from "@/components/ui/select";
import { todayIST } from "@/lib/date-utils";
import type { MediaItem, MediaType, SyncStatus, Album } from "@/lib/media";

export interface MediaUploadTask {
  id: string;
  file: File;
  previewUrl: string;
  mediaType: MediaType;
  fileName: string;
  size: number;
  progress: number; // 0 to 100
  status: "processing" | "uploading" | "completed" | "failed";
  errorMessage?: string;
  driveFileId?: string;
  takenAt?: string;
  lat?: number | null;
  lng?: number | null;
}

interface MediaUploaderProps {
  onUploadComplete: (item: Partial<MediaItem>, file: File) => Promise<void>;
  albumId?: string | null;
  albums?: Album[];
}

export function MediaUploader({ onUploadComplete, albumId, albums = [] }: MediaUploaderProps) {
  const [tasks, setTasks] = useState<MediaUploadTask[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [currentAlbumId, setCurrentAlbumId] = useState<string | null>(albumId || null);
  const [uploadDate, setUploadDate] = useState<string>(todayIST());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setCurrentAlbumId(albumId || null);
  }, [albumId]);

  const processAndUploadFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    for (const file of fileArray) {
      const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");
      const mediaType: MediaType = isVideo ? "video" : "photo";

      const previewUrl = URL.createObjectURL(file);

      const newTask: MediaUploadTask = {
        id: taskId,
        file,
        previewUrl,
        mediaType,
        fileName: file.name,
        size: file.size,
        progress: 0,
        status: "processing",
      };

      setTasks((prev) => [newTask, ...prev]);

      // Execute upload pipeline
      executePipeline(newTask);
    }
  };

  const executePipeline = async (task: MediaUploadTask) => {
    try {
      // 1. Client-side EXIF extraction
      const exif = await extractExifMetadata(task.file);

      // 2. Client-side thumbnail generation
      let thumbDataUrl: string | undefined;
      try {
        if (task.mediaType === "video") {
          const thumb = await generateVideoThumbnail(task.file);
          thumbDataUrl = thumb.dataUrl;
        } else {
          const thumb = await generateImageThumbnail(task.file);
          thumbDataUrl = thumb.dataUrl;
        }
      } catch (thumbErr) {
        console.warn("Thumbnail generation failed, using preview URL:", thumbErr);
        thumbDataUrl = task.previewUrl;
      }

      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? {
                ...t,
                status: "uploading",
                takenAt: exif.takenAt,
                lat: exif.lat,
                lng: exif.lng,
              }
            : t
        )
      );

      // 3. Initiate Google Drive Resumable Upload session
      let driveFileId: string | null = null;
      let syncStatus: SyncStatus = "synced";
      let driveErrorMessage: string | undefined;

      try {
        const effectiveTakenAt =
          exif.takenAt ||
          (uploadDate ? new Date(`${uploadDate}T12:00:00Z`).toISOString() : new Date().toISOString());

        const sessionRes = await fetch("/api/drive/upload-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: task.fileName,
            mimeType: task.file.type || (task.mediaType === "video" ? "video/mp4" : "image/jpeg"),
            size: task.file.size,
            folderType: task.mediaType === "video" ? "videos" : "photos",
            albumId: currentAlbumId || null,
            date: effectiveTakenAt,
          }),
        });

        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();

          if (sessionData.mock) {
            // Simulated development upload
            driveFileId = sessionData.fileId;
            setTasks((prev) =>
              prev.map((t) => (t.id === task.id ? { ...t, progress: 100 } : t))
            );
          } else if (sessionData.uploadUrl) {
            // Real resumable PUT directly to Google Drive with byte progress
            const uploadedDriveId = await uploadDirectToDrive(
              sessionData.uploadUrl,
              task.file,
              (percent) => {
                setTasks((prev) =>
                  prev.map((t) => (t.id === task.id ? { ...t, progress: percent } : t))
                );
              }
            );
            driveFileId = uploadedDriveId || `drive_${Date.now()}`;
          }
        } else {
          const errorData = await sessionRes.json().catch(() => ({}));
          throw new Error(errorData.error || errorData.message || "Failed to initiate session");
        }
      } catch (driveErr: unknown) {
        const errMsg = driveErr instanceof Error ? driveErr.message : "Drive upload failed";
        console.warn("Direct Drive upload session failed, queued as failed:", errMsg);
        syncStatus = "failed";
        driveErrorMessage = errMsg;
      }

      // 4. Save media item record to Supabase
      const finalTakenAt =
        exif.takenAt ||
        (uploadDate ? new Date(`${uploadDate}T12:00:00Z`).toISOString() : new Date().toISOString());

      await onUploadComplete(
        {
          file_name: task.fileName,
          mime_type: task.file.type || (task.mediaType === "video" ? "video/mp4" : "image/jpeg"),
          media_type: task.mediaType,
          thumb_path: thumbDataUrl || null,
          taken_at: finalTakenAt,
          lat: exif.lat,
          lng: exif.lng,
          album_id: currentAlbumId || null,
          drive_file_id: driveFileId,
          sync_status: syncStatus,
        },
        task.file
      );

      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? {
                ...t,
                status: syncStatus === "failed" ? "failed" : "completed",
                progress: 100,
                errorMessage:
                  syncStatus === "failed"
                    ? driveErrorMessage || "Uploaded locally, pending Google Drive retry"
                    : undefined,
              }
            : t
        )
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, status: "failed", errorMessage: msg } : t
        )
      );
    }
  };

  /**
   * Directly PUTs file bytes to Google Drive resumable session URL with progress tracking.
   */
  const uploadDirectToDrive = (
    uploadUrl: string,
    file: File,
    onProgress: (percent: number) => void
  ): Promise<string | undefined> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl, true);
      xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText || "{}");
            resolve(data.id);
          } catch {
            resolve(undefined);
          }
        } else {
          reject(new Error(`Drive upload responded with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error("Network / CORS error during Drive upload"));
      xhr.send(file);
    });
  };

  const removeTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  return (
    <div className="space-y-4">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={(e) => e.target.files && processAndUploadFiles(e.target.files)}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => e.target.files && processAndUploadFiles(e.target.files)}
        className="hidden"
      />

      {/* Target Album & Date Selection Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-muted/50 p-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-text">
            <Folder className="h-4 w-4 text-primary" />
            <span>Destination:</span>
          </div>
          <Select
            value={currentAlbumId || ""}
            onChange={(e) => setCurrentAlbumId(e.target.value || null)}
            containerClassName="w-56"
            options={[
              { value: "", label: "General Media Vault (No Album)" },
              ...albums.map((a) => ({
                value: a.id,
                label: `${a.title} (${a.item_count || 0})`,
              })),
            ]}
          />
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-text-muted" />
          <span className="text-xs text-text-muted">Date:</span>
          <input
            type="date"
            value={uploadDate}
            onChange={(e) => setUploadDate(e.target.value)}
            className="rounded-xl border border-border bg-surface px-2.5 py-1 text-xs text-text focus:border-primary focus:outline-none"
            title="Upload/Capture Date (defaults to today; EXIF auto-overrides if present)"
          />
        </div>
      </div>

      {/* Drag & Drop Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files) processAndUploadFiles(e.dataTransfer.files);
        }}
        className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
          isDragging
            ? "border-primary bg-primary/5 scale-[1.005]"
            : "border-border hover:border-primary/50 bg-surface"
        }`}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
          <UploadCloud className="h-7 w-7" />
        </div>
        <h4 className="text-base font-semibold text-text">Drop photos & videos here</h4>
        <p className="mt-1 text-xs text-text-muted max-w-sm">
          Extracts EXIF location & date automatically. Large videos stream directly to Google Drive with resumable sessions.
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90 active:scale-98 transition-all"
          >
            <ImageIcon className="h-4 w-4" />
            <span>Choose Files</span>
          </button>
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-xs font-semibold text-text hover:bg-surface-muted active:scale-98 transition-all"
          >
            <Camera className="h-4 w-4 text-accent-warm" />
            <span>Camera Capture</span>
          </button>
        </div>
      </div>

      {/* Live Upload Progress Cards */}
      {tasks.length > 0 && (
        <div className="space-y-2 rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-border text-xs font-medium text-text">
            <span>Uploading Pipeline ({tasks.length})</span>
            <button
              onClick={() => setTasks((prev) => prev.filter((t) => t.status === "uploading"))}
              className="text-[11px] text-text-muted hover:text-text"
            >
              Clear completed
            </button>
          </div>

          <div className="divide-y divide-border/40">
            {tasks.map((task) => (
              <div key={task.id} className="py-2.5 flex items-center gap-3">
                {/* Thumbnail Preview */}
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border bg-surface-muted">
                  <img
                    src={task.previewUrl}
                    alt={task.fileName}
                    className="h-full w-full object-cover"
                  />
                  {task.mediaType === "video" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Film className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>

                {/* Details & Progress */}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="truncate font-medium text-text">{task.fileName}</span>
                    <span className="text-[11px] text-text-muted">
                      {task.status === "completed"
                        ? "100%"
                        : task.status === "failed"
                        ? "Error"
                        : `${task.progress}%`}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className={`h-full transition-all duration-300 ${
                        task.status === "completed"
                          ? "bg-emerald-500"
                          : task.status === "failed"
                          ? "bg-danger"
                          : "bg-primary"
                      }`}
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-text-muted">
                    {task.status === "processing" && (
                      <span className="flex items-center gap-1 text-primary">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Extracting EXIF & Thumbnail...
                      </span>
                    )}
                    {task.status === "uploading" && (
                      <span className="flex items-center gap-1 text-primary">
                        <UploadCloud className="h-3 w-3" />
                        Uploading to Drive ({task.progress}%)...
                      </span>
                    )}
                    {task.status === "completed" && (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="h-3 w-3" />
                        Synced to Google Drive
                      </span>
                    )}
                    {task.status === "failed" && (
                      <span className="flex items-center gap-1 text-danger">
                        <AlertCircle className="h-3 w-3" />
                        {task.errorMessage || "Upload failed"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Remove / Dismiss */}
                <button
                  type="button"
                  onClick={() => removeTask(task.id)}
                  className="rounded-lg p-1 text-text-muted hover:bg-surface-muted hover:text-text"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
