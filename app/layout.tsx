import "./globals.css";
import type { Metadata } from "next";

const base = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const metadata: Metadata = {
  title: "AI Reading Companion",
  description: "Il compagno di lettura AI che non fa spoiler.",
  manifest: `${base}/manifest.webmanifest`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body className="mx-auto min-h-screen max-w-md px-5 py-8">{children}</body>
    </html>
  );
}
