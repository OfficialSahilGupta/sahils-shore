"use client";

// ============================================================================
// Sahil's Shore: PWA Install Banner Component
// ============================================================================

import React, { useState } from "react";
import { usePwa } from "./PwaProvider";
import { Download, X, Smartphone } from "lucide-react";

export function PwaInstallBanner() {
  const { isInstallable, promptInstall } = usePwa();
  const [dismissed, setDismissed] = useState(false);

  if (!isInstallable || dismissed) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 mx-auto max-w-md animate-in fade-in slide-in-from-bottom-4 md:bottom-6 md:right-6 md:left-auto">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-surface/95 p-3.5 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-text">Install Sahil&apos;s Shore</h4>
            <p className="text-[11px] text-text-muted">
              Add to Home Screen for instant offline access and quick capture.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => promptInstall()}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm transition-all hover:opacity-95"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Install</span>
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="rounded-lg p-1.5 text-text-muted hover:bg-surface-muted hover:text-text"
            aria-label="Dismiss install banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
