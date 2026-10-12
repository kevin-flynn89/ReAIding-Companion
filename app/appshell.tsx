"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Icon, type IconName } from "./ui";

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/libreria", label: "Libreria", icon: "book" },
  { href: "/aggiungi-file", label: "Aggiungi", icon: "add" },
  { href: "/backup", label: "Backup", icon: "backup" },
];
// Lettore e chat occupano tutto lo schermo: niente barra di navigazione
const IMMERSIVE = ["/lettore", "/chat"];

export default function AppShell({ children }: { children: ReactNode }) {
  const raw = usePathname() || "/";
  const path = raw.length > 1 ? raw.replace(/\/$/, "") : raw;
  const immersive = IMMERSIVE.includes(path);
  const active = (h: string) => (h === "/" ? path === "/" : path === h);

  return (
    <div className={immersive ? "" : "md:pl-24"}>
      {!immersive && (
        <nav aria-label="Navigazione principale" className="fixed inset-y-0 left-0 z-30 hidden w-24 flex-col items-center gap-3 border-r border-outline-variant bg-surface py-6 md:flex">
          <span className="mb-3 text-center font-serif text-xs font-semibold leading-tight text-on-surface-variant">Reading<br />AI</span>
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} aria-current={active(n.href) ? "page" : undefined} className="group flex w-20 flex-col items-center gap-1 py-1 text-xs font-medium text-on-surface-variant">
              <span className={`flex h-8 w-14 items-center justify-center rounded-full transition ${active(n.href) ? "bg-secondary-container text-on-secondary-container" : "group-hover:bg-on-surface/10"}`}><Icon name={n.icon} className="h-6 w-6" /></span>
              <span className={active(n.href) ? "text-on-surface" : ""}>{n.label}</span>
            </Link>
          ))}
        </nav>
      )}
      <div className={`mx-auto w-full px-4 md:px-8 ${immersive ? "max-w-3xl" : "max-w-3xl pb-28 md:pb-10"}`}>{children}</div>
      {!immersive && (
        <nav aria-label="Navigazione principale" className="fixed inset-x-0 bottom-0 z-30 flex items-stretch justify-around border-t border-outline-variant bg-surface-container pb-[env(safe-area-inset-bottom)] md:hidden">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} aria-current={active(n.href) ? "page" : undefined} className="flex min-h-[64px] flex-1 flex-col items-center justify-center gap-1 text-xs font-medium text-on-surface-variant">
              <span className={`flex h-8 w-16 items-center justify-center rounded-full transition ${active(n.href) ? "bg-secondary-container text-on-secondary-container" : ""}`}><Icon name={n.icon} /></span>
              <span className={active(n.href) ? "text-on-surface" : ""}>{n.label}</span>
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
