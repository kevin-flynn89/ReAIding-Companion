"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { listWorks, type Work } from "@/lib/library";
import { buildCard, buildMemory, clearMem, loadMem, type Card, type Item, type MemStore } from "@/lib/memory";

type Tab = "personaggi" | "luoghi" | "oggetti" | "misteri" | "eventi";
const TABS: { id: Tab; label: string }[] = [
  { id: "personaggi", label: "Personaggi" }, { id: "luoghi", label: "Luoghi" }, { id: "oggetti", label: "Oggetti" },
  { id: "misteri", label: "Misteri" }, { id: "eventi", label: "Eventi" },
];

export default function Memoria() {
  const [work, setWork] = useState<Work | null>(null);
  const [state, setState] = useState<"loading" | "missing" | "ok">("loading");
  const [mem, setMem] = useState<MemStore>({});
  const [tab, setTab] = useState<Tab>("personaggi");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const stop = useRef(false);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    listWorks().then(async (ws) => {
      const w = ws.find((x) => x.id === id);
      if (!w) { setState("missing"); return; }
      setWork(w); setMem(await loadMem(w.id)); setState("ok");
    });
  }, []);

  if (state === "loading") return <main><p className="text-sm">Caricamento...</p></main>;
  if (state === "missing" || !work) return (
    <main>
      <Link href="/libreria" className="text-sm text-segnalibro">Vai alla libreria</Link>
      <p className="mt-4 text-sm">Libro non trovato. Aprilo dalla libreria.</p>
    </main>
  );

  const current = work.current;
  const card: Card = buildCard(mem, current); // SOLO capitoli <= capitolo corrente
  const missing = work.chapters.filter((c) => c.n <= current && !mem[c.n]).length;

  async function aggiorna() {
    if (!work) return;
    stop.current = false; setBusy(true); setError(""); setStatus("");
    const r = await buildMemory(work, current, setStatus, () => stop.current);
    setMem(await loadMem(work.id));
    if (r.error) setError(r.error + " I capitoli già analizzati sono stati salvati: puoi riprovare più tardi.");
    setStatus(stop.current ? "Interrotto. Quello fatto è salvato." : r.error ? "" : `Fatto: ${r.done} capitoli analizzati.`);
    setBusy(false);
  }
  async function azzera() {
    if (!work || !window.confirm("Cancellare la memoria narrativa di questo libro? Dovrai rianalizzare i capitoli.")) return;
    await clearMem(work.id); setMem({}); setStatus("");
  }

  const btn = "w-full rounded px-4 py-4 text-base font-semibold disabled:opacity-50";

  const list = (items: Item[], vuoto: string) =>
    items.length === 0 ? <p className="mt-4 text-sm">{vuoto}</p> : (
      <ul className="mt-3 space-y-3">
        {items.map((it) => (
          <li key={it.nome} className="bg-white p-3">
            <p className="font-bold">{it.nome} <span className="text-xs font-normal">· dal cap. {it.first}</span></p>
            <ul className="mt-1 space-y-1 text-sm">
              {it.note.slice(-3).map((n, i) => <li key={i}><span className="text-xs">Cap. {n.n}:</span> {n.testo}</li>)}
            </ul>
          </li>
        ))}
      </ul>
    );

  const lineList = (items: { n: number; testo: string }[], vuoto: string) =>
    items.length === 0 ? <p className="mt-4 text-sm">{vuoto}</p> : (
      <ul className="mt-3 space-y-2">
        {items.map((e, i) => <li key={i} className="bg-white p-3 text-sm"><span className="text-xs font-semibold">Cap. {e.n}</span><br />{e.testo}</li>)}
      </ul>
    );

  return (
    <main>
      <Link href="/libreria" className="text-sm text-segnalibro">Libreria</Link>
      <h1 className="mt-3 text-2xl font-bold leading-snug">Memoria: {work.title}</h1>
      <p className="mt-1 text-xs">
        Sei al capitolo {current} di {work.chapters.length} · analizzati {card.analizzati} ·{" "}
        <Link href={`/lettore?id=${work.id}`} className="text-segnalibro">Torna a leggere</Link>
      </p>
      <p className="mt-2 rounded bg-white p-2 text-xs">Spoiler Shield: questa scheda mostra solo i capitoli fino al {current}. Ciò che viene dopo resta nascosto.</p>

      <div className="mt-4 space-y-2">
        {!busy ? (
          <button onClick={aggiorna} disabled={missing === 0} className={`${btn} bg-segnalibro text-white`}>
            {missing === 0 ? "Memoria aggiornata" : `Aggiorna memoria (${missing} capitoli da analizzare)`}
          </button>
        ) : (
          <button onClick={() => { stop.current = true; }} className={`${btn} border border-segnalibro text-segnalibro`}>Ferma</button>
        )}
        {status && <p role="status" className="text-sm">{status}</p>}
        {error && <p role="alert" className="rounded bg-red-100 p-3 text-sm text-red-900">{error}</p>}
      </div>

      <div className="-mx-1 mt-5 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${tab === t.id ? "bg-segnalibro text-white" : "border border-segnalibro text-segnalibro"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {card.analizzati === 0 ? (
        <p className="mt-4 text-sm">Nessun capitolo analizzato. Premi "Aggiorna memoria" per costruire la scheda dai capitoli che hai letto.</p>
      ) : (
        <>
          {tab === "personaggi" && list(card.personaggi, "Nessun personaggio trovato finora.")}
          {tab === "luoghi" && list(card.luoghi, "Nessun luogo trovato finora.")}
          {tab === "oggetti" && list(card.oggetti, "Nessun oggetto importante trovato finora.")}
          {tab === "misteri" && (
            <>
              <p className="mt-3 text-xs">Domande aperte emerse nei capitoli letti. Alcune potrebbero essere già risolte più avanti nel tuo percorso di lettura.</p>
              {lineList(card.misteri, "Nessun mistero aperto finora.")}
            </>
          )}
          {tab === "eventi" && lineList(card.eventi, "Nessun evento registrato finora.")}
        </>
      )}

      {card.analizzati > 0 && <button onClick={azzera} className="mt-6 text-xs text-red-600">Cancella la memoria di questo libro</button>}
      <p className="mt-4 text-xs">Le schede sono create dall'AI e possono contenere errori o omissioni.</p>
    </main>
  );
}
