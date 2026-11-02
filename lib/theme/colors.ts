// ============================================================================
// Sahil's Shore: Theme Color Utilities & WCAG AA Contrast Engine
// ============================================================================

import type { ContrastResult, ThemeColors } from "./types";

export interface ColorSwatch {
  name: string;
  hex: string;
  category: "coastal" | "nature" | "warmth" | "neutral";
}

export const CURATED_SWATCHES: ColorSwatch[] = [
  { name: "Deep Sea Teal", hex: "#1F7A8C", category: "coastal" },
  { name: "Midnight Cyan", hex: "#0284C7", category: "coastal" },
  { name: "Ocean Cobalt", hex: "#0077B6", category: "coastal" },
  { name: "Emerald Forest", hex: "#2D6A4F", category: "nature" },
  { name: "Sage Mist", hex: "#52B788", category: "nature" },
  { name: "Sunset Sand", hex: "#E0A458", category: "warmth" },
  { name: "Terracotta", hex: "#E07A5F", category: "warmth" },
  { name: "Sakura Blossom", hex: "#D84A75", category: "warmth" },
  { name: "Twilight Violet", hex: "#7C3AED", category: "nature" },
  { name: "Minimal Slate", hex: "#18181B", category: "neutral" },
];

/**
 * Parses a 3 or 6 digit hex color to RGB integers
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const sanitized = hex.replace("#", "").trim();
  if (sanitized.length === 3) {
    return {
      r: parseInt(sanitized[0] + sanitized[0], 16),
      g: parseInt(sanitized[1] + sanitized[1], 16),
      b: parseInt(sanitized[2] + sanitized[2], 16),
    };
  }
  if (sanitized.length === 6) {
    return {
      r: parseInt(sanitized.slice(0, 2), 16),
      g: parseInt(sanitized.slice(2, 4), 16),
      b: parseInt(sanitized.slice(4, 6), 16),
    };
  }
  return null;
}

/**
 * Calculates WCAG 2.1 relative luminance for an sRGB channel
 */
function getLuminanceChannel(val: number): number {
  const s = val / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

/**
 * Calculates WCAG 2.1 relative luminance (0 to 1) of a hex color
 */
export function getRelativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0.5;
  const r = getLuminanceChannel(rgb.r);
  const g = getLuminanceChannel(rgb.g);
  const b = getLuminanceChannel(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Computes contrast ratio (1:1 to 21:1) between two hex colors
 */
export function getContrastRatio(fgHex: string, bgHex: string): number {
  const lum1 = getRelativeLuminance(fgHex);
  const lum2 = getRelativeLuminance(bgHex);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  const ratio = (lighter + 0.05) / (darker + 0.05);
  return Math.round(ratio * 100) / 100;
}

/**
 * Evaluates WCAG compliance against body text criteria (4.5:1 for AA, 7:1 for AAA)
 */
export function checkWcagContrast(fgHex: string, bgHex: string): ContrastResult {
  const ratio = getContrastRatio(fgHex, bgHex);
  const passesAA = ratio >= 4.5;
  const passesAAA = ratio >= 7.0;

  let level: "AAA" | "AA" | "Fail" = "Fail";
  if (passesAAA) level = "AAA";
  else if (passesAA) level = "AA";

  let warning: string | undefined;
  if (!passesAA) {
    warning = `Contrast ratio is ${ratio}:1, which is below the WCAG AA minimum of 4.5:1. Text might be hard to read on this background.`;
  }

  return { ratio, passesAA, passesAAA, level, warning };
}

/**
 * Checks whether dark or light text should be used against a given background
 */
export function getOptimalTextColor(bgHex: string): "#FFFFFF" | "#14232E" {
  const contrastWithWhite = getContrastRatio("#FFFFFF", bgHex);
  const contrastWithDark = getContrastRatio("#14232E", bgHex);
  return contrastWithWhite >= contrastWithDark ? "#FFFFFF" : "#14232E";
}

/**
 * Dynamically shifts brightness of an RGB color
 */
export function adjustHexBrightness(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const factor = 1 + percent / 100;
  const r = Math.min(255, Math.max(0, Math.round(rgb.r * factor)));
  const g = Math.min(255, Math.max(0, Math.round(rgb.g * factor)));
  const b = Math.min(255, Math.max(0, Math.round(rgb.b * factor)));

  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Generates primary-soft, primary-foreground, and ring tokens based on selected accent color
 */
export function generateAccentTokens(
  accentHex: string,
  isDark: boolean
): {
  primary: string;
  primarySoft: string;
  primaryForeground: string;
  ring: string;
} {
  const primaryForeground = getOptimalTextColor(accentHex);

  // In dark mode, primary soft should be a muted translucent tint
  // In light mode, a very soft pastel tint
  const rgb = hexToRgb(accentHex);
  let primarySoft = isDark
    ? adjustHexBrightness(accentHex, -55)
    : adjustHexBrightness(accentHex, 75);

  if (rgb && !isDark) {
    // Soft pastel mix with white
    const r = Math.round(rgb.r * 0.2 + 255 * 0.8);
    const g = Math.round(rgb.g * 0.2 + 255 * 0.8);
    const b = Math.round(rgb.b * 0.2 + 255 * 0.8);
    const toHex = (n: number) => n.toString(16).padStart(2, "0");
    primarySoft = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  return {
    primary: accentHex,
    primarySoft,
    primaryForeground,
    ring: accentHex,
  };
}
