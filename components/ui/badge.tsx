"use client";

// ============================================================================
// Sahil's Shore: Badge UI Primitive
// ============================================================================

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--primary)] text-white",
        secondary:
          "bg-[var(--surface-muted)] text-[var(--text-muted)] hover:text-[var(--text)]",
        outline:
          "border border-[var(--border)] text-[var(--text)]",
        urgent:
          "bg-[var(--danger)]/15 text-[var(--danger)] border border-[var(--danger)]/30 font-semibold",
        high:
          "bg-[var(--warning)]/15 text-[var(--warning)] border border-[var(--warning)]/30",
        medium:
          "bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30",
        low:
          "bg-[var(--surface-muted)] text-[var(--text-muted)]",
        tag:
          "bg-[var(--surface-muted)] text-[var(--text-muted)] hover:bg-[var(--primary-soft)] hover:text-[var(--primary)] cursor-pointer",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
