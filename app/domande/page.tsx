"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { listBooks, getWork, type BookMeta, type Work } from "@/lib/library";
import { applyShield, chunkWork, search, searchHybrid, type EmbIndex } from "@/lib/rag";
import { buildIndex, embedQuery, getIndex } from "@/lib/embed";
import { askAI, sampleSpread } from "@/lib/ask";
import { Empty, TopBar } from "../ui";

export default function Domande() {
  const [works, setWorks] = useState<BookMeta[]>([]);
  const [id, setId] = useState("");
  const [work, setWorkState] = useState<Work | null>(null);
  const [current, setCurrent] = useState(1);
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState<EmbIndex | null>(null);
  const [status, setStatus] = useState("");
  const [running, setRunning] = useState(false);
  const [res, setRes] = useState<ReturnType<typeof search> | null>(null);
  const [mode, setMode] = useState("");
  const [answer, setAnswer] = useState("");
  const [thinking, setThinking] = useState(false);
  const stop = useRef(false);

  useEffect(() => {
    listBooks().then((w) => { setWorks(w); if (w[0]) { setId(w[0].id); setCurrent(w[0].current); } });
  }, []);

  useEffect(() => {
    if (!id) return;
    let ok = true;
    getWork(id).then((w) => { if (ok) setWorkState(w); });
    return () => { ok = false; };
  }, [id]);

  const chunks = useMemo(() => (work ? chunkWork(work) : []), [work]);
  const wanted = useMemo(() => applyShield(chunks, current), [chunks, current]); // solo fino al tuo capitolo
  const missing = useMemo(() => { const have = new Set(idx?.ids || []); return wanted.filter((c) => !have.has(c.id)).length; }, [wanted, idx]);

  useEffect(() => { setIdx(null); setRes(null); if (work) getIndex(work.id).then(setIdx); }, [work]);

  async function prepara() {
    if (!work) return;
    stop.current = false; setRunning(true);
    try { setIdx(await buildIndex(work.id, wanted, idx, setStatus, () => stop.current)); setStatus(stop.current ? "Interrotto: i progressi sono salvati." : "Ricerca avanzata pronta."); }
    catch { setStatus("Non sono riuscito a preparare la ricerca avanzata: uso quella semplice."); }
    setRunning(false);
  }

  async function retrieve(query: string) {
    if (idx && idx.ids.length > 0) {
      try {
        const qv = await embedQuery(query, setStatus);
        return { r: searchHybrid(chunks, query, current, qv, idx, 8), m: "avanzata" };
      } catch { /* ripiega sulla ricerca semplice */ }
    }
    return { r: search(chunks, query, current, 8), m: "semplice" };
  }

  async function chiedi(question: string, spread = false) {
    if (!work) return;
    setThinking(true); setAnswer(""); setRes(null); setStatus("");
    try {
      let hits: { chapter: number; text: string; id: string; score: number }[] = [];
      if (spread) {
        const sp = sampleSpread(chunks, current);
        hits = sp.map((c) => ({ ...c, score: 0 }));
        setRes({ hits, visible: wanted.length, hidden: chunks.length - wanted.length }); setMode("distribuita");
      } else {
        const { r, m } = await retrieve(question);
        hits = r.hits; setRes(r); setMode(m);
      }
      if (hits.length === 0) {
        setAnswer("Fino al punto in cui sei arrivato non ho trovato nulla su questo: potrebbe non essere ancora stato spiegato.");
      } else {
        setAnswer(await askAI(work.title, current, question, hits));
      }
    } catch (e: any) {
      setStatus(e?.message || "Errore. Controlla che il backend sia collegato.");
    }
    setThinking(false);
  }

  return (
    <main>
      <TopBar title="Prova le domande" sub="Strumento di test" back="/" backLabel="Torna alla home" />
      <p className="banner mt-2">Qui vedi i passaggi che l'AI riceverebbe: solo quelli fino al tuo capitolo.</p>
      {works.length === 0 && <Empty title="Nessun libro"><p>Prima aggiungi un libro da file.</p></Empty>}
      {work && (
        <>
          <label className="mt-4 block text-sm font-medium">Libro<br />
            <select value={id} onChange={(e) => { const w = works.find((x) => x.id === e.target.value)!; setId(w.id); setCurrent(w.current); }}
              className="select mt-1 w-full">{works.map((w) => <option key={w.id} value={w.id}>{w.title.slice(0, 40)}</option>)}</select>
          </label>
          <label className="mt-3 block text-sm font-medium">Sono arrivato al capitolo<br />
            <select value={current} onChange={(e) => setCurrent(Number(e.target.value))} className="select mt-1 w-full">
              {work.chapters.map((c) => <option key={c.n} value={c.n}>{c.n}</option>)}
            </select>
          </label>

          <div className="mt-4 text-sm">
            {missing === 0 && idx ? <p>Ricerca avanzata pronta fino al capitolo {current}.</p> : (
              <div className="flex flex-wrap gap-3">
                <button onClick={prepara} disabled={running} className="btn btn-outlined">
                  {running ? "Analisi in corso..." : `Prepara ricerca avanzata (${missing} frammenti)`}
                </button>
                {running && <button onClick={() => (stop.current = true)} className="btn btn-danger">Interrompi</button>}
              </div>
            )}
            <p className="mt-1 text-xs">Analizza solo fino al capitolo {current}, sul tuo dispositivo. Puoi interrompere e riprendere: i progressi restano salvati. Tieni lo schermo acceso e la pagina aperta.</p>
            {status && <p className="mt-1 text-xs">{status}</p>}
          </div>

          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Es. Perché Marco ha litigato con Luca?"
            className="field mt-4" />
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => chiedi(q)} disabled={!q || running || thinking}
              className="btn btn-filled">{thinking ? "Sto pensando..." : "Chiedi"}</button>
            <button onClick={() => chiedi("Riassumi quello che è successo fin qui.", true)} disabled={running || thinking}
              className="btn btn-tonal">Riassumi fin qui</button>
            <button onClick={() => chiedi("Cosa devo ricordare? Elenca personaggi, relazioni, eventi e misteri aperti.", true)} disabled={running || thinking}
              className="btn btn-tonal">Cosa devo ricordare?</button>
          </div>
          {answer && (
            <section className="card mt-5 border-l-4 border-primary">
              <h2 className="text-lg font-semibold">Risposta (fino al capitolo {current})</h2>
              <p className="mt-2 whitespace-pre-line text-sm">{answer}</p>
            </section>
          )}
          {res && (
            <details className="mt-5">
              <summary className="cursor-pointer py-2 text-sm font-semibold">Passaggi usati per la risposta ({res.hits.length})</summary>
              <p className="mt-2 text-xs">Ricerca {mode} · frammenti consultabili: {res.visible} · nascosti dallo Spoiler Shield: {res.hidden}</p>
              {res.hits.length === 0 && <p className="card mt-3 text-sm">
                Nessun passaggio trovato fino al capitolo {current}: l'AI risponderebbe che questo non è ancora stato spiegato.</p>}
              <ul className="mt-3 space-y-3">
                {res.hits.map((h) => (
                  <li key={h.id} className="card border-l-4 border-primary p-3 text-sm">
                    <span className="font-semibold">Cap. {h.chapter}</span> · punteggio {h.score.toFixed(1)}
                    <p className="mt-1">{h.text.length > 350 ? h.text.slice(0, 350) + "..." : h.text}</p>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </main>
  );
}
