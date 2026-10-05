"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { listWorks, type Work } from "@/lib/library";
import { chunkWork, search } from "@/lib/rag";

export default function Domande() {
  const [works, setWorks] = useState<Work[]>([]);
  const [id, setId] = useState("");
  const [current, setCurrent] = useState(1);
  const [q, setQ] = useState("");
  const [ask, setAsk] = useState("");

  useEffect(() => {
    listWorks().then((w) => { setWorks(w); if (w[0]) { setId(w[0].id); setCurrent(w[0].current); } });
  }, []);

  const work = works.find((w) => w.id === id);
  const chunks = useMemo(() => (work ? chunkWork(work) : []), [work]);
  const res = useMemo(() => (ask ? search(chunks, ask, current) : null), [chunks, ask, current]);

  return (
    <main>
      <Link href="/" className="text-sm text-segnalibro">Torna alla home</Link>
      <h1 className="mt-3 text-3xl font-bold">Prova le domande</h1>
      <p className="mt-2 text-sm">Qui vedi i passaggi che l'AI riceverebbe: solo quelli fino al tuo capitolo.</p>
      {works.length === 0 && <p className="mt-4 text-sm">Prima aggiungi un'opera da file.</p>}
      {work && (
        <>
          <label className="mt-4 block text-sm">Opera
            <select value={id} onChange={(e) => { const w = works.find((x) => x.id === e.target.value)!; setId(w.id); setCurrent(w.current); }}
              className="ml-2 border p-1">{works.map((w) => <option key={w.id} value={w.id}>{w.title.slice(0, 40)}</option>)}</select>
          </label>
          <label className="mt-3 block text-sm">Sono arrivato al capitolo
            <select value={current} onChange={(e) => setCurrent(Number(e.target.value))} className="ml-2 border p-1">
              {work.chapters.map((c) => <option key={c.n} value={c.n}>{c.n}</option>)}
            </select>
          </label>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Es. Perché Marco ha litigato con Luca?"
            className="mt-4 w-full rounded border border-inchiostro/30 bg-white p-3 text-sm" />
          <button onClick={() => setAsk(q)} disabled={!q}
            className="mt-3 rounded bg-segnalibro px-5 py-3 text-sm font-semibold text-white disabled:opacity-40">Cerca passaggi</button>
          {res && (
            <section className="mt-5">
              <p className="text-xs">Frammenti consultabili: {res.visible} · nascosti dallo Spoiler Shield: {res.hidden}</p>
              {res.hits.length === 0 && <p className="mt-3 border-l-4 border-segnalibro bg-white p-3 text-sm">
                Nessun passaggio trovato fino al capitolo {current}: l'AI risponderebbe che questo non è ancora stato spiegato.</p>}
              <ul className="mt-3 space-y-3">
                {res.hits.map((h) => (
                  <li key={h.id} className="border-l-4 border-segnalibro bg-white p-3 text-sm">
                    <span className="font-semibold">Cap. {h.chapter}</span> · punteggio {h.score.toFixed(1)}
                    <p className="mt-1">{h.text.length > 350 ? h.text.slice(0, 350) + "..." : h.text}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </main>
  );
}
