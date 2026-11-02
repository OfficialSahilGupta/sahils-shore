// ============================================================================
// Sahil's Shore: Theme Engine Type Definitions
// ============================================================================

export type ThemeMode = "light" | "dark" | "system";

export type ThemePresetId =
  | "shore"
  | "midnight-tide"
  | "sakura"
  | "forest"
  | "sunset"
  | "mono"
  | "ocean";

export type ThemeFont = "inter" | "geist" | "dm-sans" | "lora";

export type ThemeRadius = "none" | "sm" | "md" | "lg" | "full";

export type ThemeDensity = "compact" | "comfortable" | "spacious";

export type BackgroundStyle = "solid" | "gradient" | "image" | "glass";

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceMuted: string;
  primary: string;
  primarySoft: string;
  accentWarm: string;
  text: string;
  textMuted: string;
  border: string;
  success: string;
  warning: string;
  danger: string;
  primaryForeground: string;
  ring: string;
}

export interface ThemePreset {
  id: ThemePresetId;
  name: string;
  description: string;
  accentColor: string;
  light: ThemeColors;
  dark: ThemeColors;
}

export interface ThemeConfig {
  preset: ThemePresetId;
  mode: ThemeMode;
  accentColor: string;
  font: ThemeFont;
  radius: ThemeRadius;
  density: ThemeDensity;
  background: {
    style: BackgroundStyle;
    imageUrl?: string;
    blur: number; // 0 - 24 px
    opacity: number; // 50 - 100 %
  };
}

export interface ContrastResult {
  ratio: number;
  passesAA: boolean;
  passesAAA: boolean;
  level: "AAA" | "AA" | "Fail";
  warning?: string;
}
