import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        surface: {
          DEFAULT: "var(--surface)",
          muted: "var(--surface-muted)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          soft: "var(--primary-soft)",
          foreground: "var(--primary-foreground)",
        },
        accent: {
          warm: "var(--accent-warm)",
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        text: {
          DEFAULT: "var(--text)",
          muted: "var(--text-muted)",
        },
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
        border: "var(--border)",
        ring: "var(--ring)",
        card: {
          DEFAULT: "var(--surface)",
          foreground: "var(--text)",
        },
        popover: {
          DEFAULT: "var(--surface)",
          foreground: "var(--text)",
        },
        muted: {
          DEFAULT: "var(--surface-muted)",
          foreground: "var(--text-muted)",
        },
      },
      borderRadius: {
        none: "0px",
        sm: "calc(var(--radius) * 0.5)",
        DEFAULT: "calc(var(--radius) * 0.75)",
        md: "calc(var(--radius) * 0.85)",
        lg: "var(--radius)",
        xl: "calc(var(--radius) * 1.35)",
        "2xl": "calc(var(--radius) * 1.7)",
        "3xl": "calc(var(--radius) * 2.2)",
        full: "9999px",
      },
      keyframes: {
        wave: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-3px)" },
        },
      },
      animation: {
        wave: "wave 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
