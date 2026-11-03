// ============================================================================
// Sahil's Shore: Skeleton Loader Component
// ============================================================================

import React from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-surface-muted/80 motion-reduce:animate-none",
        className
      )}
      {...props}
    />
  );
}
