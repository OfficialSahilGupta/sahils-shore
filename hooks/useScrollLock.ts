"use client";

import { useEffect } from "react";

/**
 * Custom React hook to prevent underlying background scrolling when modals,
 * dialogs, or drawers are open.
 *
 * Automatically compensates for scrollbar width to prevent layout shift.
 */
export function useScrollLock(lock: boolean) {
  useEffect(() => {
    if (!lock || typeof window === "undefined") return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [lock]);
}
