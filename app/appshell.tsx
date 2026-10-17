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
  { href: "/impostazioni", label: "Opzioni", icon: "settings" },
];
// Lettore e chat occupano tutto lo schermo: niente barra di navigazione
const IMMERSIVE = ["/lettore", "/chat"];

export default function AppShell({ children }: { children: ReactNode }) {
  const raw = usePathname() || "/";
  const path = raw.length > 1 ? raw.replace(/\/$/, "") : raw;
  const immersive = IMMERSIVE.includes(path);
  const active = (h: string) => (h === "/" ? path === "/" : path === h);

  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  return (
    <div className={immersive ? "" : "md:pl-28"}>
      {!immersive && (
        <nav aria-label="Navigazione principale" className="fixed inset-y-0 left-0 z-30 hidden w-28 flex-col items-center gap-4 bg-surface-low py-8 md:flex">
          <img src={`${base}/icon.svg`} alt="" className="mb-4 h-14 w-14 rounded-[18px] shadow-md" />
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} aria-current={active(n.href) ? "page" : undefined} className="group flex w-24 flex-col items-center gap-1.5 py-1 text-xs font-semibold text-on-surface-variant">
              <span className={`nav-pill flex h-9 w-16 items-center justify-center rounded-full ${active(n.href) ? "bg-secondary-container text-on-secondary-container" : "group-hover:bg-on-surface/10"}`} data-on={active(n.href)}><Icon name={n.icon} className="h-6 w-6" /></span>
              <span className={active(n.href) ? "font-bold text-on-surface" : ""}>{n.label}</span>
            </Link>
          ))}
        </nav>
      )}
      <div className={`mx-auto w-full px-4 md:px-8 ${immersive ? "max-w-3xl" : "max-w-3xl pb-32 md:pb-10"}`}>{children}</div>
      {!immersive && (
        <nav aria-label="Navigazione principale" className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
          <div className="float-bar mx-auto flex max-w-md items-stretch justify-around px-1">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} aria-current={active(n.href) ? "page" : undefined} className="flex min-h-[72px] flex-1 flex-col items-center justify-center gap-1 text-xs font-semibold text-on-surface-variant">
                <span className={`nav-pill flex h-8 w-16 items-center justify-center rounded-full ${active(n.href) ? "bg-primary text-on-primary" : ""}`} data-on={active(n.href)}><Icon name={n.icon} /></span>
                <span className={active(n.href) ? "font-bold text-on-surface" : ""}>{n.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
