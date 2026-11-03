// ============================================================================
// Sahil's Shore: 404 Not Found Page
// ============================================================================

import React from "react";
import Link from "next/link";
import { Compass, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-4 text-center">
      <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-8 shadow-xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Compass className="h-7 w-7" />
        </div>
        <div className="text-3xl font-extrabold text-primary mb-1">404</div>
        <h2 className="mb-2 text-xl font-bold tracking-tight text-text">
          Horizon Not Found
        </h2>
        <p className="mb-6 text-xs text-text-muted leading-relaxed">
          The shore you are looking for does not exist or might have shifted with the tide.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-95"
        >
          <Home className="h-3.5 w-3.5" />
          <span>Return to Today</span>
        </Link>
      </div>
    </div>
  );
}
