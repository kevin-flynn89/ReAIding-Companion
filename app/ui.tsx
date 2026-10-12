import Link from "next/link";
import type { ReactNode } from "react";

// Icone semplici in stile Material (24x24)
const P = {
  home: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z",
  book: "M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z",
  add: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z",
  back: "M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z",
  prev: "M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z",
  next: "M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z",
  send: "M2.01 21L23 12 2.01 3 2 10l15 2-15 2z",
  chat: "M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z",
  close: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
  download: "M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z",
  upload: "M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z",
  trash: "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z",
  bulb: "M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z",
  check: "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z",
  shield: "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z",
  spark: "M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z",
  backup: "M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z",
} as const;
export type IconName = keyof typeof P;

export function Icon({ name, className = "h-6 w-6" }: { name: IconName; className?: string }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor"><path d={P[name]} /></svg>;
}

// Barra in alto (Material "small top app bar"): resta visibile mentre scorri
export function TopBar({ title, sub, back, backLabel = "Indietro", actions }: {
  title: string; sub?: string; back?: string; backLabel?: string; actions?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 -mx-4 flex min-h-16 items-center gap-1 bg-surface/95 px-2 backdrop-blur md:-mx-8 md:px-6">
      {back && <Link href={back} aria-label={backLabel} className="icon-btn text-on-surface"><Icon name="back" /></Link>}
      <div className={`min-w-0 flex-1 ${back ? "px-1" : "px-2"}`}>
        <h1 className="truncate text-[22px] font-semibold leading-7">{title}</h1>
        {sub && <p className="truncate text-xs text-on-surface-variant">{sub}</p>}
      </div>
      {actions}
    </header>
  );
}

// Messaggio quando non c'è niente da mostrare: dice cosa fare
export function Empty({ icon = "book", title, children }: { icon?: IconName; title: string; children?: ReactNode }) {
  return (
    <div className="mx-auto mt-10 flex max-w-sm flex-col items-center text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-container text-on-primary-container"><Icon name={icon} className="h-10 w-10" /></span>
      <h2 className="mt-5 text-2xl font-semibold">{title}</h2>
      <div className="mt-2 text-sm text-on-surface-variant">{children}</div>
    </div>
  );
}
