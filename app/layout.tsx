import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { ThemeConfigProvider } from "@/lib/theme/ThemeContext";
import { ModuleConfigProvider } from "@/lib/modules/ModuleContext";
import { AppShell } from "@/components/layout/AppShell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  fallback: [
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
  ],
});

export const metadata: Metadata = {
  title: {
    default: "Sahil's Shore",
    template: "%s | Sahil's Shore",
  },
  description: "Your day, your shore. Single-user personal Life OS.",
  applicationName: "Sahil's Shore",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Shore",
  },
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF7F2" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1620" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        {/* Anti-FOUC Theme Pre-Initialization Script */}
        <script
          id="shore-theme-init"
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var stored = localStorage.getItem('shore_theme_config');
                if (stored) {
                  var cfg = JSON.parse(stored);
                  if (cfg.font) {
                    document.documentElement.setAttribute('data-font', cfg.font);
                    document.body && document.body.setAttribute('data-font', cfg.font);
                  }
                  if (cfg.radius) {
                    document.documentElement.setAttribute('data-radius', cfg.radius);
                  }
                  if (cfg.density) {
                    document.documentElement.setAttribute('data-density', cfg.density);
                    document.body && document.body.setAttribute('data-density', cfg.density);
                  }
                  if (cfg.background && cfg.background.style) {
                    document.documentElement.setAttribute('data-bg-style', cfg.background.style);
                    if (cfg.background.style === 'image' && cfg.background.imageUrl) {
                      document.documentElement.style.setProperty('--bg-image-url', 'url("' + cfg.background.imageUrl + '")');
                    }
                  }
                }
              } catch(e) {}
            `,
          }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ThemeConfigProvider>
            <ModuleConfigProvider>
              <AppShell>{children}</AppShell>
            </ModuleConfigProvider>
          </ThemeConfigProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
