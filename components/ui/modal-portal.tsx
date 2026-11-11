"use client";

// ============================================================================
// Sahil's Shore: Modal Portal Component
// Portals modal dialogs directly to document.body, escaping ancestor CSS
// transforms (such as Framer Motion page transitions) to guarantee 100% full-screen
// backdrop blur coverage including the top navigation bar and all upper edges.
// ============================================================================

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ModalPortalProps {
  children: React.ReactNode;
}

export function ModalPortal({ children }: ModalPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  return createPortal(children, document.body);
}
