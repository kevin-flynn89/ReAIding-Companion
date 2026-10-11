import "./globals.css";
import type { Metadata, Viewport } from "next";
import { RegisterSW } from "./pwa";

const base = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const metadata: Metadata = {
  title: "AI Reading Companion",
  description: "Il compagno di lettura AI che non fa spoiler.",
  manifest: `${base}/manifest.webmanifest`,
  icons: { icon: `${base}/icon-192.png`, apple: `${base}/apple-touch-icon.png` },
  appleWebApp: { capable: true, title: "Reading AI", statusBarStyle: "default" },
};

export const viewport: Viewport = { themeColor: "#14213D", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body className="mx-auto min-h-screen max-w-md px-5 py-8">
        <RegisterSW />
        {children}
      </body>
    </html>
  );
}
