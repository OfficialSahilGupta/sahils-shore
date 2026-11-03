"use client";

// ============================================================================
// Sahil's Shore: Global Error Boundary
// ============================================================================

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError] Uncaught exception:", error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-4 text-center">
      <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-8 shadow-xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-danger">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h2 className="mb-2 text-xl font-bold tracking-tight text-text">
          Something went off course
        </h2>
        <p className="mb-6 text-xs text-text-muted leading-relaxed">
          An unexpected error interrupted this page. Your data is secure and queued locally.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
          <button
            onClick={() => reset()}
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-95"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-border bg-surface-muted/50 px-4 py-2.5 text-xs font-semibold text-text hover:bg-surface-muted"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Back to Shore</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
