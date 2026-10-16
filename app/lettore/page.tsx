"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getWork, setLastOpened, setProgress, type Work } from "@/lib/library";
import { chunkWork } from "@/lib/rag";
import Conversazione from "../conversazione";
import { Empty, Icon, TopBar } from "../ui";

export default function Lettore() {
  const [work, setWork] = useState<Work | null>(null);
  const [state, setState] = useState<"loading" | "missing" | "ok">("loading");
  const [n, setN] = useState(1);
  const [size, setSize] = useState(18);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    getWork(id).then((w) => {
      if (!w) { setState("missing"); return; }
      setWork(w); setN(Math.min(Math.max(w.current, 1), w.chapters.length)); setState("ok"); setLastOpened(w.id);
    });
    try { const s = Number(localStorage.getItem("rc_font")); if (s >= 14 && s <= 30) setSize(s); } catch { /* ignora */ }
  }, []);

  const chunks = useMemo(() => (open && work ? chunkWork(work) : []), [open, work]);
  const chapter = work?.chapters.find((c) => c.n === n);

  function go(next: number) {
    if (!work || next < 1 || next > work.chapters.length) return;
    setN(next); setProgress(work.id, next);
    window.scrollTo(0, 0);
  }
  function resize(d: number) {
    const s = Math.min(30, Math.max(14, size + d)); setSize(s);
    try { localStorage.setItem("rc_font", String(s)); } catch { /* ignora */ }
  }

  if (state === "loading") return <main><TopBar title="Lettore" back="/libreria" backLabel="Libreria" /><p className="mt-4 text-sm text-on-surface-variant">Caricamento...</p></main>;
  if (state === "missing" || !work || !chapter) return (
    <main>
      <TopBar title="Lettore" back="/libreria" backLabel="Libreria" />
      <Empty icon="book" title="Libro non trovato"><p>Aprilo dalla libreria.</p><Link href="/libreria" className="btn btn-filled mt-6">Vai alla libreria</Link></Empty>
    </main>
  );

  const total = work.chapters.length;
  return (
    <main className={open ? "pb-[26rem]" : "pb-36"}>
      <TopBar title={work.title} sub={`Capitolo ${n} di ${total}`} back="/libreria" backLabel="Libreria"
        actions={<>
          <button onClick={() => resize(-2)} disabled={size <= 14} aria-label="Testo più piccolo" className="icon-btn text-sm font-semibold">A−</button>
          <button onClick={() => resize(2)} disabled={size >= 30} aria-label="Testo più grande" className="icon-btn text-lg font-semibold">A+</button>
          <Link href={`/memoria?id=${work.id}`} aria-label="Memoria narrativa" className="icon-btn"><Icon name="bulb" /></Link>
        </>} />
      <div className="progress -mx-4 rounded-none md:-mx-8" role="progressbar" aria-label="Avanzamento nel libro" aria-valuenow={n} aria-valuemin={1} aria-valuemax={total}><span style={{ width: `${(n / total) * 100}%` }} /></div>

      <article className="mx-auto mt-8 max-w-[68ch]">
        <h2 className="font-serif text-[1.65rem] font-semibold leading-tight">{chapter.title}</h2>
        <div className="mt-5 font-serif" style={{ fontSize: size, lineHeight: 1.75 }}>
          {chapter.text.split(/\n+/).map((p, i) => <p key={i} className="mb-[1.1em]">{p}</p>)}
        </div>
        <div className="mt-10 flex flex-wrap justify-between gap-3">
          <button onClick={() => go(n - 1)} disabled={n <= 1} className="btn btn-outlined"><Icon name="prev" className="h-5 w-5" />Precedente</button>
          <button onClick={() => go(n + 1)} disabled={n >= total} className="btn btn-filled">Capitolo successivo<Icon name="next" className="h-5 w-5" /></button>
        </div>
      </article>

      <div className="fixed inset-x-0 bottom-0 z-40">
        {open && (
          <section aria-label="Chiedi all'AI" className="mx-auto max-w-3xl rounded-t-[28px] bg-surface-container px-4 pb-2 pt-3 shadow-[0_-4px_16px_rgb(0_0_0/0.15)] md:px-6">
            <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-outline-variant" aria-hidden />
            <div className="flex items-center justify-between">
              <h3 className="font-sans text-base font-semibold">Chiedi all'AI</h3>
              <button onClick={() => setOpen(false)} aria-label="Chiudi" className="icon-btn"><Icon name="close" /></button>
            </div>
            <Conversazione work={work} current={n} chunks={chunks} maxHeight="34dvh" />
          </section>
        )}
        <div className="border-t border-outline-variant bg-surface-container pb-[env(safe-area-inset-bottom)]">
          <div className="mx-auto flex max-w-3xl items-center gap-1 px-2 py-2 md:px-6">
            <button onClick={() => go(n - 1)} disabled={n <= 1} aria-label="Capitolo precedente" className="icon-btn"><Icon name="prev" /></button>
            <select value={n} onChange={(e) => go(Number(e.target.value))} aria-label="Vai al capitolo" className="select min-w-0 flex-1 text-sm">
              {work.chapters.map((c) => <option key={c.n} value={c.n}>{c.n}. {c.title.slice(0, 32)}</option>)}
            </select>
            <button onClick={() => go(n + 1)} disabled={n >= total} aria-label="Capitolo successivo" className="icon-btn"><Icon name="next" /></button>
            <button onClick={() => setOpen(!open)} aria-expanded={open} className="btn btn-filled ml-1 min-h-[48px] px-4"><Icon name="chat" className="h-5 w-5" /><span className="hidden sm:inline">{open ? "Chiudi" : "Chiedi all'AI"}</span></button>
          </div>
        </div>
      </div>
    </main>
  );
}
