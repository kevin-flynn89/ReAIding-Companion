"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { listWorks, setLastOpened, setProgress, type Work } from "@/lib/library";
import { chunkWork } from "@/lib/rag";
import { answer } from "@/lib/companion";

export default function Lettore() {
  const [work, setWork] = useState<Work | null>(null);
  const [state, setState] = useState<"loading" | "missing" | "ok">("loading");
  const [n, setN] = useState(1);
  const [size, setSize] = useState(18);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [ans, setAns] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    listWorks().then((ws) => {
      const w = ws.find((x) => x.id === id);
      if (!w) { setState("missing"); return; }
      setWork(w); setN(Math.min(Math.max(w.current, 1), w.chapters.length)); setState("ok"); setLastOpened(w.id);
    });
    try { const s = Number(localStorage.getItem("rc_font")); if (s >= 14 && s <= 30) setSize(s); } catch { /* ignora */ }
  }, []);

  const chunks = useMemo(() => (open && work ? chunkWork(work) : []), [open, work]);
  const chapter = work?.chapters.find((c) => c.n === n);

  function go(next: number) {
    if (!work || next < 1 || next > work.chapters.length) return;
    setN(next); setProgress(work.id, next); setAns(""); setErr("");
    window.scrollTo(0, 0);
  }
  function resize(d: number) {
    const s = Math.min(30, Math.max(14, size + d)); setSize(s);
    try { localStorage.setItem("rc_font", String(s)); } catch { /* ignora */ }
  }
  async function chiedi(question: string, spread = false) {
    if (!work) return;
    setBusy(true); setAns(""); setErr("");
    try { setAns(await answer(work, chunks, n, question, spread)); }
    catch (e: any) { setErr(e?.message || "Errore. Controlla che il backend sia collegato."); }
    setBusy(false);
  }

  if (state === "loading") return <main><p className="text-sm">Caricamento...</p></main>;
  if (state === "missing" || !work || !chapter) return (
    <main>
      <Link href="/libreria" className="text-sm text-segnalibro">Vai alla libreria</Link>
      <p className="mt-4 text-sm">Opera non trovata. Aprila dalla libreria.</p>
    </main>
  );

  return (
    <main className="pb-44">
      <div className="flex items-center justify-between text-sm">
        <Link href="/libreria" className="text-segnalibro">Libreria</Link>
        <div className="flex gap-2">
          <button onClick={() => resize(-2)} aria-label="Testo più piccolo" className="rounded border border-segnalibro px-3 py-1 text-segnalibro">A-</button>
          <button onClick={() => resize(2)} aria-label="Testo più grande" className="rounded border border-segnalibro px-3 py-1 text-segnalibro">A+</button>
        </div>
      </div>
      <h1 className="mt-4 text-2xl font-bold">{work.title}</h1>
      <p className="text-xs">{work.author || "Autore non indicato"} · capitolo {n} di {work.chapters.length}</p>
      <h2 className="mt-5 text-lg font-bold">{chapter.title}</h2>
      <article style={{ fontSize: size, lineHeight: 1.7, fontFamily: "Georgia, 'Times New Roman', serif" }} className="mt-3">
        {chapter.text.split(/\n+/).map((p, i) => <p key={i} className="mb-4">{p}</p>)}
      </article>
      <div className="mt-6 flex justify-between">
        <button onClick={() => go(n - 1)} disabled={n <= 1} className="rounded border border-segnalibro px-4 py-3 text-sm font-semibold text-segnalibro disabled:opacity-30">Indietro</button>
        <button onClick={() => go(n + 1)} disabled={n >= work.chapters.length} className="rounded bg-segnalibro px-5 py-3 text-sm font-semibold text-white disabled:opacity-30">Capitolo successivo</button>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-inchiostro/20 bg-carta">
        <div className="mx-auto max-w-md px-5 py-3">
          {open && (
            <section className="mb-3 max-h-[55vh] overflow-auto rounded bg-white p-3 text-sm">
              <p className="text-xs">Le risposte usano solo i capitoli fino al {n}.</p>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Chiedi qualcosa sulla storia..."
                className="mt-2 w-full rounded border border-inchiostro/30 p-2" />
              <div className="mt-2 flex flex-wrap gap-2">
                <button onClick={() => chiedi(q)} disabled={!q || busy} className="rounded bg-segnalibro px-3 py-2 font-semibold text-white disabled:opacity-40">{busy ? "Sto pensando..." : "Chiedi"}</button>
                <button onClick={() => chiedi("Riassumi quello che è successo fin qui.", true)} disabled={busy} className="rounded border border-segnalibro px-3 py-2 font-semibold text-segnalibro disabled:opacity-40">Riassumi fin qui</button>
                <button onClick={() => chiedi("Cosa devo ricordare? Elenca personaggi, relazioni, eventi e misteri aperti.", true)} disabled={busy} className="rounded border border-segnalibro px-3 py-2 font-semibold text-segnalibro disabled:opacity-40">Cosa devo ricordare?</button>
              </div>
              {ans && <p className="mt-3 whitespace-pre-line border-l-4 border-segnalibro pl-3">{ans}</p>}
              {err && <p className="mt-3 text-red-600">{err}</p>}
            </section>
          )}
          <div className="flex items-center gap-2">
            <select value={n} onChange={(e) => go(Number(e.target.value))} aria-label="Vai al capitolo" className="min-w-0 flex-1 rounded border border-inchiostro/30 bg-white p-2 text-sm">
              {work.chapters.map((c) => <option key={c.n} value={c.n}>{c.n}. {c.title.slice(0, 28)}</option>)}
            </select>
            <button onClick={() => setOpen(!open)} className="rounded bg-inchiostro px-4 py-2 text-sm font-semibold text-white">{open ? "Chiudi AI" : "Chiedi all'AI"}</button>
          </div>
        </div>
      </div>
    </main>
  );
}
