"use client";

// ============================================================================
// Sahil's Shore: Daily Physique Gallery & Transformation Slider
// Visual progression tracking with Before/After comparison slider,
// pose classification, body weight stamps, instant mobile camera capture,
// and automatic Google Drive synchronization (Shore/Photos/YYYY/<MonthName>/).
// ============================================================================

import React, { useState, useMemo, useRef } from "react";
import {
  Camera,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  Sliders,
  Scale,
  Maximize2,
  X,
  Upload,
  ChevronRight,
  TrendingUp,
  Cloud,
  CheckCircle2,
  FolderSync,
  Info,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { todayIST, formatFriendlyISTDate } from "@/lib/date-utils";
import {
  PhysiquePhoto,
  uploadPhysiquePhotoToDrive,
} from "@/lib/workout";
import { generateImageThumbnail } from "@/lib/media/thumbnail";

interface DailyPhysiqueGalleryProps {
  photos: PhysiquePhoto[];
  userId?: string | null;
  onSavePhoto: (input: {
    photoDate: string;
    photoUrl: string;
    driveFileId?: string | null;
    syncStatus?: "synced" | "pending";
    poseType: PhysiquePhoto["poseType"];
    weightKg?: number;
    notes?: string;
  }) => Promise<void>;
  onDeletePhoto: (photoId: string) => Promise<void>;
}

const POSE_OPTIONS: Array<{ value: PhysiquePhoto["poseType"]; label: string }> = [
  { value: "front", label: "Front Relaxed" },
  { value: "back", label: "Back Lat Spread" },
  { value: "side", label: "Side Chest / Profile" },
  { value: "flex", label: "Front Double Biceps" },
  { value: "legs", label: "Quads & Calves" },
  { value: "scale", label: "Weight Scale Reading" },
];

export function DailyPhysiqueGallery({
  photos,
  userId,
  onSavePhoto,
  onDeletePhoto,
}: DailyPhysiqueGalleryProps) {
  const currentTodayIST = todayIST();
  const [modalOpen, setModalOpen] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<PhysiquePhoto | null>(null);

  // Form states
  const [photoDate, setPhotoDate] = useState<string>(currentTodayIST);
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [poseType, setPoseType] = useState<PhysiquePhoto["poseType"]>("front");
  const [weightKg, setWeightKg] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatusMsg, setUploadStatusMsg] = useState<string>("");

  // Refs for camera and file inputs
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Before & After Slider states
  const [beforePhotoId, setBeforePhotoId] = useState<string>(
    photos.length > 1 ? photos[photos.length - 1].id : photos[0]?.id || ""
  );
  const [afterPhotoId, setAfterPhotoId] = useState<string>(photos[0]?.id || "");
  const [sliderPos, setSliderPos] = useState<number>(50); // percentage 0 - 100

  const beforePhoto = useMemo(
    () => photos.find((p) => p.id === beforePhotoId) || photos[photos.length - 1] || null,
    [photos, beforePhotoId]
  );

  const afterPhoto = useMemo(
    () => photos.find((p) => p.id === afterPhotoId) || photos[0] || null,
    [photos, afterPhotoId]
  );

  const processSelectedFile = async (file: File) => {
    setAttachedFile(file);

    try {
      // 1. Generate client-side optimized thumbnail for zero-lag display
      const thumb = await generateImageThumbnail(file, 900);
      if (thumb.dataUrl) {
        setPhotoUrl(thumb.dataUrl);
        return;
      }
    } catch {
      // Fallback: standard reader
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPhotoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processSelectedFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoUrl) return;

    try {
      setIsUploading(true);
      setUploadStatusMsg("Syncing to Google Drive...");

      let driveFileId: string | null = null;
      let syncStatus: "synced" | "pending" = "pending";

      // Upload directly to Google Drive if file attached
      if (attachedFile && userId) {
        const driveResult = await uploadPhysiquePhotoToDrive(
          userId,
          attachedFile,
          photoDate,
          poseType,
          weightKg ? parseFloat(weightKg) : undefined
        );
        driveFileId = driveResult.driveFileId;
        syncStatus = driveResult.syncStatus;
      }

      await onSavePhoto({
        photoDate,
        photoUrl,
        driveFileId,
        syncStatus,
        poseType,
        weightKg: weightKg ? parseFloat(weightKg) : undefined,
        notes: notes.trim() || undefined,
      });

      setModalOpen(false);
      setPhotoUrl("");
      setAttachedFile(null);
      setNotes("");
      setWeightKg("");
      setUploadStatusMsg("");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 min-w-0 w-full max-w-full">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
            <Camera className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-text">Daily Physique Progression</h2>
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                <Cloud className="h-3 w-3" />
                <span>Google Drive Synced</span>
              </span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              {photos.length} transformation updates recorded • Backed up to Shore/Photos/
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setPhotoDate(currentTodayIST);
            setPhotoUrl("");
            setAttachedFile(null);
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-all shadow-xs self-start sm:self-center"
        >
          <Camera className="h-4 w-4" />
          <span>Take / Upload Daily Photo</span>
        </button>
      </div>

      {/* 2. Before & After Transformation Slider (Only shown if at least 2 photos) */}
      {photos.length >= 2 && beforePhoto && afterPhoto && (
        <Card className="p-4 sm:p-6 rounded-2xl border border-border bg-surface shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-text">
                Transformation Slider: Before & After
              </h3>
            </div>
            <span className="text-xs text-text-muted">
              Drag slider left and right to inspect physique changes
            </span>
          </div>

          {/* Selectors for Before & After Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-text-muted">
                Before Photo Date:
              </label>
              <Select
                value={beforePhotoId}
                onChange={(e) => setBeforePhotoId(e.target.value)}
                options={photos.map((p) => ({
                  value: p.id,
                  label: `${p.photoDate} - ${p.poseType}${p.weightKg ? ` (${p.weightKg}kg)` : ""}`,
                }))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-text-muted">
                After Photo Date:
              </label>
              <Select
                value={afterPhotoId}
                onChange={(e) => setAfterPhotoId(e.target.value)}
                options={photos.map((p) => ({
                  value: p.id,
                  label: `${p.photoDate} - ${p.poseType}${p.weightKg ? ` (${p.weightKg}kg)` : ""}`,
                }))}
              />
            </div>
          </div>

          {/* Interactive Split View Container */}
          <div className="relative mx-auto max-w-lg overflow-hidden rounded-2xl border border-border select-none aspect-[3/4] bg-surface-muted/40 shadow-inner">
            {/* "After" Image (Underneath) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={afterPhoto.photoUrl}
              alt="After physique"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute top-3 right-3 rounded-lg bg-black/75 backdrop-blur-xs px-2.5 py-1 text-[10px] font-bold text-white shadow-xs flex items-center gap-1.5">
              <span>After: {afterPhoto.photoDate}</span>
              {afterPhoto.weightKg && <span>• {afterPhoto.weightKg}kg</span>}
            </div>

            {/* "Before" Image (Clipped on Top) */}
            <div
              className="absolute inset-y-0 left-0 overflow-hidden border-r-2 border-primary"
              style={{ width: `${sliderPos}%` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={beforePhoto.photoUrl}
                alt="Before physique"
                className="absolute inset-y-0 left-0 h-full max-w-none object-cover"
                style={{ width: "100%", minWidth: "100%" }}
              />
              <div className="absolute top-3 left-3 rounded-lg bg-black/75 backdrop-blur-xs px-2.5 py-1 text-[10px] font-bold text-white shadow-xs flex items-center gap-1.5">
                <span>Before: {beforePhoto.photoDate}</span>
                {beforePhoto.weightKg && <span>• {beforePhoto.weightKg}kg</span>}
              </div>
            </div>

            {/* Range Slider Overlay */}
            <input
              type="range"
              min={0}
              max={100}
              value={sliderPos}
              onChange={(e) => setSliderPos(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
              aria-label="Before after comparison slider"
            />

            {/* Center Slider Handle Divider Line */}
            <div
              className="pointer-events-none absolute inset-y-0 z-10 flex items-center justify-center"
              style={{ left: `calc(${sliderPos}% - 14px)` }}
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg border-2 border-surface">
                <Sliders className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 3. Photos Gallery Grid */}
      {photos.length === 0 ? (
        <Card className="p-12 text-center rounded-2xl border border-dashed border-border bg-surface">
          <Camera className="h-10 w-10 text-text-muted/40 mx-auto mb-3" />
          <h3 className="text-base font-bold text-text">No physique photos captured yet</h3>
          <p className="text-xs text-text-muted max-w-sm mx-auto mt-1">
            Capture a quick mirror photo post-workout. Photos are saved locally and synced directly
            to your Google Drive folder for safe, permanent storage.
          </p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-all shadow-xs"
          >
            <Camera className="h-4 w-4" />
            <span>Take Today&apos;s Photo</span>
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <Card
              key={photo.id}
              className="group relative overflow-hidden rounded-2xl border border-border bg-surface shadow-2xs hover:shadow-md transition-all flex flex-col"
            >
              {/* Image Thumbnail */}
              <div
                onClick={() => setLightboxPhoto(photo)}
                className="relative aspect-[3/4] cursor-pointer overflow-hidden bg-surface-muted/40"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.photoUrl}
                  alt={`Physique on ${photo.photoDate}`}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent opacity-85" />

                {/* Top overlay badges */}
                <div className="absolute top-2 left-2 flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[10px] font-bold text-white capitalize">
                    {photo.poseType}
                  </span>
                  {photo.driveFileId && (
                    <span
                      className="px-1.5 py-0.5 rounded-md bg-emerald-500/80 backdrop-blur-xs text-[9px] font-bold text-white flex items-center gap-1"
                      title="Backed up to Google Drive (Shore/Photos/)"
                    >
                      <Cloud className="h-2.5 w-2.5" />
                      <span>Drive</span>
                    </span>
                  )}
                </div>

                {/* Bottom overlay info */}
                <div className="absolute bottom-2 inset-x-2 text-white">
                  <span className="text-xs font-bold block">{photo.photoDate}</span>
                  {photo.weightKg && (
                    <span className="text-[11px] font-mono text-white/90 font-medium">
                      {photo.weightKg} kg
                    </span>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-2.5 flex items-center justify-between border-t border-border/50 bg-surface">
                <span className="text-[10px] text-text-muted truncate">
                  {formatFriendlyISTDate(photo.photoDate)}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setLightboxPhoto(photo)}
                    className="p-1 rounded text-text-muted hover:text-text hover:bg-surface-muted transition-colors"
                    title="View fullscreen"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeletePhoto(photo.id)}
                    className="p-1 rounded text-text-muted hover:text-danger hover:bg-surface-muted transition-colors"
                    title="Delete photo"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 4. Upload / Camera Photo Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" />
                <h3 className="text-base font-bold text-text">Record Daily Physique</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-surface-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Photo Input Area */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text">Capture / Select Photo</label>

                {/* Hidden native inputs */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleCameraChange}
                  className="hidden"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {photoUrl ? (
                  <div className="relative mx-auto aspect-[3/4] max-h-56 overflow-hidden rounded-xl border border-border bg-surface-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoUrl}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoUrl("");
                        setAttachedFile(null);
                      }}
                      className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Option 1: Native Phone Camera */}
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-primary/40 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors text-center cursor-pointer space-y-1.5"
                    >
                      <Camera className="h-6 w-6 text-primary" />
                      <span className="text-xs font-bold text-text">Take Photo</span>
                      <span className="text-[10px] text-text-muted leading-tight">
                        Instant mobile camera
                      </span>
                    </button>

                    {/* Option 2: Gallery / Files Picker */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-border rounded-xl bg-surface-muted/30 hover:bg-surface-muted/60 transition-colors text-center cursor-pointer space-y-1.5"
                    >
                      <Upload className="h-6 w-6 text-text-muted" />
                      <span className="text-xs font-bold text-text">Choose File</span>
                      <span className="text-[10px] text-text-muted leading-tight">
                        Camera roll / gallery
                      </span>
                    </button>
                  </div>
                )}

                {/* Google Drive automatic backup notice */}
                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-700 dark:text-emerald-300">
                  <Cloud className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                  <div className="leading-snug">
                    <span className="font-semibold block">Google Drive Cloud Backup:</span>
                    <span>
                      Photo will be safely archived to your Drive in{" "}
                      <code className="font-mono text-[10px] font-bold">Shore/Photos/YYYY/</code>.
                    </span>
                  </div>
                </div>

                {/* Direct image URL input option */}
                <div className="pt-1">
                  <input
                    type="url"
                    value={photoUrl.startsWith("data:") ? "" : photoUrl}
                    onChange={(e) => {
                      setPhotoUrl(e.target.value);
                      setAttachedFile(null);
                    }}
                    placeholder="Or paste image URL directly..."
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-surface border border-border text-text placeholder:text-text-muted focus:ring-1 focus:ring-primary shadow-2xs"
                  />
                </div>
              </div>

              {/* Date & Pose */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text">Date</label>
                  <input
                    type="date"
                    value={photoDate}
                    onChange={(e) => setPhotoDate(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 text-xs rounded-xl bg-surface border border-border text-text focus:ring-1 focus:ring-primary shadow-2xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text">Pose Type</label>
                  <Select
                    value={poseType}
                    onChange={(e) => setPoseType(e.target.value as any)}
                    options={POSE_OPTIONS}
                  />
                </div>
              </div>

              {/* Body Weight */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text">
                  Body Weight (kg) <span className="text-text-muted font-normal">(Optional)</span>
                </label>
                <div className="relative">
                  <Scale className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
                  <input
                    type="number"
                    step="0.1"
                    min={30}
                    max={250}
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    placeholder="e.g. 72.5"
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-surface border border-border text-text placeholder:text-text-muted focus:ring-1 focus:ring-primary shadow-2xs font-mono"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-text">
                  Notes <span className="text-text-muted font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Morning fasted, post-push pump..."
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-surface border border-border text-text placeholder:text-text-muted focus:ring-1 focus:ring-primary shadow-2xs"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-[11px] text-text-muted">
                  {isUploading ? uploadStatusMsg || "Saving..." : ""}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-border bg-surface text-text hover:bg-surface-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!photoUrl || isUploading}
                    className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{isUploading ? "Uploading..." : "Save & Sync Photo"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Lightbox Modal */}
      {lightboxPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="relative max-w-2xl w-full flex flex-col items-center">
            <button
              type="button"
              onClick={() => setLightboxPhoto(null)}
              className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxPhoto.photoUrl}
              alt=""
              className="max-h-[80vh] w-auto rounded-xl object-contain shadow-2xl"
            />

            <div className="mt-3 text-center text-white space-y-1">
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm font-bold">{lightboxPhoto.photoDate}</span>
                {lightboxPhoto.driveFileId && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/80 text-[10px] font-bold text-white flex items-center gap-1">
                    <Cloud className="h-3 w-3" />
                    <span>Google Drive Synced</span>
                  </span>
                )}
              </div>
              <span className="text-xs text-white/70 capitalize block">
                {lightboxPhoto.poseType} {lightboxPhoto.weightKg && `• ${lightboxPhoto.weightKg} kg`}
              </span>
              {lightboxPhoto.notes && (
                <p className="text-xs text-white/80 italic">&ldquo;{lightboxPhoto.notes}&rdquo;</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
