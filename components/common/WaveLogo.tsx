"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface WaveLogoProps {
  className?: string;
  size?: number;
  animated?: boolean;
}

export function WaveLogo({ className, size = 32, animated = false }: WaveLogoProps) {
  return (
    <div
      className={cn("relative flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
      aria-label="Shore Logo"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("transition-transform duration-300", animated && "animate-wave")}
      >
        <defs>
          <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--accent-warm)" />
          </linearGradient>
          <linearGradient id="horizon-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--primary-soft)" stopOpacity="0.4" />
            <stop offset="50%" stopColor="var(--accent-warm)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="var(--primary-soft)" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Soft rounded background container */}
        <rect
          x="4"
          y="4"
          width="92"
          height="92"
          rx="24"
          fill="var(--surface-muted)"
          stroke="var(--border)"
          strokeWidth="3"
        />

        {/* Calm Horizon Line */}
        <path
          d="M 18 52 Q 50 48 82 52"
          stroke="url(#horizon-gradient)"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Gentle Cresting Wave */}
        <path
          d="M 18 64 C 34 64, 42 54, 52 54 C 62 54, 70 64, 82 64"
          stroke="url(#wave-gradient)"
          strokeWidth="5"
          strokeLinecap="round"
        />

        {/* Secondary Foam Ripple */}
        <path
          d="M 28 73 C 40 73, 46 67, 54 67 C 62 67, 68 73, 74 73"
          stroke="var(--primary-soft)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeOpacity="0.9"
        />

        {/* Horizon Sun / Dawn Accent */}
        <circle cx="50" cy="38" r="6" fill="var(--accent-warm)" fillOpacity="0.85" />
      </svg>
    </div>
  );
}
