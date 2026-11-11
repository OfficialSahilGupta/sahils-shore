"use client";

// ============================================================================
// Sahil's Shore: Attach Concept Map & Architecture Diagram Modal
// Allows inserting high-definition concept maps, architecture blueprints,
// and system flowcharts into study notes via file upload, URL, or preset blueprints.
// Strictly adheres to Shore rules: Zero Emojis (Lucide SVGs only),
// CSS tokenized colors, and WCAG AA contrast.
// ============================================================================

import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  Link as LinkIcon,
  Sparkles,
  Image as ImageIcon,
  Check,
  Layers,
  ArrowRight,
  FileImage,
} from "lucide-react";
import { ModalPortal } from "@/components/ui/modal-portal";
import {
  prepareConceptMapImage,
  CURATED_CONCEPT_MAP_PRESETS,
  type ConceptMapPreset,
  type ChapterConceptMap,
} from "@/lib/learning/concept-map";

interface AttachConceptMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  topicTitle: string;
  onAttachConceptMap?: (conceptMap: ChapterConceptMap) => void;
  onInsertImage?: (caption: string, url: string) => void;
}

export function AttachConceptMapModal({
  isOpen,
  onClose,
  topicTitle,
  onAttachConceptMap,
  onInsertImage,
}: AttachConceptMapModalProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "url" | "presets">("upload");

  // Upload tab state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [uploadCaption, setUploadCaption] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // URL tab state
  const [directUrl, setDirectUrl] = useState("");
  const [urlCaption, setUrlCaption] = useState("");
  const [urlPreviewValid, setUrlPreviewValid] = useState<boolean | null>(null);

  if (!isOpen) return null;

  // File selection & processing
  const handleFileChange = async (file: File) => {
    setSelectedFile(file);
    setIsProcessing(true);
    try {
      const prepared = await prepareConceptMapImage(file);
      setPreviewUrl(prepared.dataUrl);
      if (!uploadCaption.trim()) {
        setUploadCaption(prepared.caption);
      }
    } catch (err) {
      console.error("Failed to prepare concept map image:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await handleFileChange(files[0]);
    }
  };

  const deliverConceptMap = (caption: string, url: string) => {
    const cleanCaption = caption.trim() || `Concept Map: ${topicTitle}`;
    if (onAttachConceptMap) {
      onAttachConceptMap({
        id: `cm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: cleanCaption,
        caption: cleanCaption,
        url,
        createdAt: new Date().toISOString(),
      });
    }
    if (onInsertImage) {
      onInsertImage(cleanCaption, url);
    }
  };

  const handleInsertUpload = () => {
    if (!previewUrl) return;
    const caption = uploadCaption.trim() || `Concept Map: ${topicTitle}`;
    deliverConceptMap(caption, previewUrl);
    resetAndClose();
  };

  const handleInsertUrl = () => {
    if (!directUrl.trim()) return;
    const caption = urlCaption.trim() || `Concept Map: ${topicTitle}`;
    deliverConceptMap(caption, directUrl.trim());
    resetAndClose();
  };

  const handleInsertPreset = (preset: ConceptMapPreset) => {
    deliverConceptMap(`Concept Map: ${preset.title}`, preset.svgDataUrl);
    resetAndClose();
  };

  const resetAndClose = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    setUploadCaption("");
    setDirectUrl("");
    setUrlCaption("");
    setUrlPreviewValid(null);
    onClose();
  };

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
        onClick={resetAndClose}
      >
        <div
          className="w-full max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4 bg-[var(--surface)] shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20">
                <ImageIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[var(--text)]">
                  Add Concept Map or Architecture Diagram
                </h3>
                <p className="text-xs text-[var(--text-muted)] truncate max-w-sm sm:max-w-md">
                  Attach visual maps & system blueprints to &ldquo;{topicTitle}&rdquo;
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={resetAndClose}
              className="rounded-xl p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)] transition-colors"
              title="Close (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 px-5 py-2.5 border-b border-[var(--border)] bg-[var(--surface-muted)]/30 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("upload")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === "upload"
                  ? "bg-[var(--surface)] text-[var(--primary)] shadow-2xs border border-[var(--border)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Upload Image File</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("url")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === "url"
                  ? "bg-[var(--surface)] text-[var(--primary)] shadow-2xs border border-[var(--border)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              <LinkIcon className="h-3.5 w-3.5" />
              <span>Image URL / Web</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("presets")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                activeTab === "presets"
                  ? "bg-[var(--surface)] text-[var(--primary)] shadow-2xs border border-[var(--border)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Architecture Blueprints</span>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* TAB 1: UPLOAD FILE */}
            {activeTab === "upload" && (
              <div className="space-y-4">
                {/* Drag-and-drop zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                    isDragging
                      ? "border-[var(--primary)] bg-[var(--primary)]/10"
                      : "border-[var(--border)] hover:border-[var(--primary)]/60 bg-[var(--surface-muted)]/20"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        void handleFileChange(e.target.files[0]);
                      }
                    }}
                  />

                  <FileImage className="h-8 w-8 text-[var(--primary)] mx-auto mb-2 opacity-80" />
                  <p className="text-xs font-bold text-[var(--text)]">
                    Click to browse or drag and drop your concept map
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1">
                    Supports PNG, JPG, WebP, SVG vector diagrams, & whiteboard captures (up to 20MB)
                  </p>
                </div>

                {/* Preview and Caption */}
                {previewUrl && (
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/30 p-3.5 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[var(--text)] flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5 text-[var(--success)]" />
                        <span>Ready to attach ({selectedFile?.name})</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setPreviewUrl("");
                        }}
                        className="text-[11px] text-[var(--danger)] hover:underline"
                      >
                        Remove
                      </button>
                    </div>

                    {/* Image Thumbnail */}
                    <div className="max-h-52 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--background)] flex items-center justify-center p-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-h-48 w-auto max-w-full object-contain"
                      />
                    </div>

                    {/* Caption Input */}
                    <div>
                      <label className="block text-[11px] font-bold text-[var(--text)] mb-1">
                        Diagram Caption / Concept Map Title
                      </label>
                      <input
                        type="text"
                        value={uploadCaption}
                        onChange={(e) => setUploadCaption(e.target.value)}
                        placeholder={`e.g. Concept Map: ${topicTitle} Architecture & Internal Pipeline`}
                        className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: IMAGE URL */}
            {activeTab === "url" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-[var(--text)] mb-1">
                    Direct Image URL
                  </label>
                  <input
                    type="url"
                    value={directUrl}
                    onChange={(e) => {
                      setDirectUrl(e.target.value);
                      setUrlPreviewValid(null);
                    }}
                    placeholder="https://example.com/architecture-diagram.png"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none transition-colors"
                  />
                  <p className="text-[11px] text-[var(--text-muted)] mt-1">
                    Direct link to a PNG, SVG, or WebP diagram (e.g. from GitHub, Draw.io, or Excalidraw)
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[var(--text)] mb-1">
                    Diagram Caption / Concept Map Title
                  </label>
                  <input
                    type="text"
                    value={urlCaption}
                    onChange={(e) => setUrlCaption(e.target.value)}
                    placeholder={`e.g. Concept Map: ${topicTitle} Schema Blueprint`}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none transition-colors"
                  />
                </div>

                {directUrl.trim() && (
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/20 p-3">
                    <span className="text-[11px] font-bold text-[var(--text-muted)] block mb-1.5">
                      URL Image Preview:
                    </span>
                    <div className="max-h-44 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--background)] flex items-center justify-center p-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={directUrl}
                        alt="URL Preview"
                        onLoad={() => setUrlPreviewValid(true)}
                        onError={() => setUrlPreviewValid(false)}
                        className="max-h-40 w-auto max-w-full object-contain"
                      />
                    </div>
                    {urlPreviewValid === false && (
                      <p className="text-[11px] text-[var(--danger)] mt-1.5">
                        Unable to load image from this URL. Please verify the link is accessible.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: ARCHITECTURE BLUEPRINTS */}
            {activeTab === "presets" && (
              <div className="space-y-3">
                <p className="text-xs text-[var(--text-muted)]">
                  Pick a pre-designed, razor-sharp vector architecture blueprint to embed directly into your notes:
                </p>

                <div className="space-y-2.5">
                  {CURATED_CONCEPT_MAP_PRESETS.map((preset) => (
                    <div
                      key={preset.id}
                      className="group rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 hover:border-[var(--primary)]/50 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-[var(--primary)]/10 px-2 py-0.5 text-[10px] font-bold text-[var(--primary)] border border-[var(--primary)]/20">
                            {preset.category}
                          </span>
                          <h4 className="text-xs font-bold text-[var(--text)] truncate">
                            {preset.title}
                          </h4>
                        </div>
                        <p className="text-[11px] text-[var(--text-muted)] line-clamp-2">
                          {preset.description}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleInsertPreset(preset)}
                        className="flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:opacity-90 transition-opacity shrink-0"
                      >
                        <span>Insert Map</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="border-t border-[var(--border)] px-5 py-3.5 bg-[var(--surface-muted)]/20 flex items-center justify-between shrink-0">
            <span className="text-[11px] text-[var(--text-muted)]">
              Tip: Visual diagrams are saved cleanly to your chapter gallery without bloating Markdown notes
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetAndClose}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-muted)] transition-colors"
              >
                Cancel
              </button>

              {activeTab === "upload" && (
                <button
                  type="button"
                  onClick={handleInsertUpload}
                  disabled={!previewUrl || isProcessing}
                  className="flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Attach Concept Map</span>
                </button>
              )}

              {activeTab === "url" && (
                <button
                  type="button"
                  onClick={handleInsertUrl}
                  disabled={!directUrl.trim()}
                  className="flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Attach from URL</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
