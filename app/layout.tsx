import "./globals.css";
import type { Metadata, Viewport } from "next";
import { RegisterSW } from "./pwa";
import AppShell from "./appshell";

const base = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const metadata: Metadata = {
  title: "AI Reading Companion",
  description: "Il compagno di lettura AI che non fa spoiler.",
  manifest: `${base}/manifest.webmanifest`,
  icons: {
    icon: [{ url: `${base}/icon.svg`, type: "image/svg+xml" }, { url: `${base}/icon-192.png`, sizes: "192x192", type: "image/png" }],
    apple: `${base}/apple-touch-icon.png`,
  },
  appleWebApp: { capable: true, title: "Reading AI", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width", initialScale: 1, viewportFit: "cover",
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#F6F8FA" }, { media: "(prefers-color-scheme: dark)", color: "#0D161E" }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body className="min-h-dvh">
        <RegisterSW />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
