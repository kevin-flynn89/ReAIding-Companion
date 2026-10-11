"use client";
import { useEffect, useRef, useState } from "react";
import type { Work } from "@/lib/library";
import type { Chunk } from "@/lib/rag";
import { clearChat, historyFor, loadChat, saveChat, type Msg } from "@/lib/chat";
import { answer } from "@/lib/companion";

// Conversazione con l'AI per un libro. La cronologia resta salvata sul dispositivo.
export default function Conversazione({ work, current, chunks, maxHeight = "40vh" }: { work: Work; current: number; chunks: Chunk[]; maxHeight?: string }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => { loadChat(work.id).then(setMsgs); }, [work.id]);
  useEffect(() => { end.current?.scrollIntoView({ block: "nearest" }); }, [msgs.length, busy]);

  async function invia(question: string, spread = false) {
    const text = question.trim();
    if (!text || busy) return;
    setBusy(true); setErr(""); setQ("");
    const hist = historyFor(msgs, current);
    const mine: Msg = { role: "user", text, chapter: current, ts: Date.now() };
    const withMine = [...msgs, mine];
    setMsgs(withMine);
    try {
      const a = await answer(work, chunks, current, text, spread, hist);
      const all = [...withMine, { role: "assistant", text: a, chapter: current, ts: Date.now() } as Msg];
      setMsgs(all); await saveChat(work.id, all);
    } catch (e: any) {
      await saveChat(work.id, withMine);
      setErr(e?.message || "Errore. Controlla che il backend sia collegato.");
    }
    setBusy(false);
  }

  async function svuota() {
    if (window.confirm("Cancellare la cronologia di questa conversazione?")) { await clearChat(work.id); setMsgs([]); setErr(""); }
  }

  return (
    <div className="text-sm">
      <p className="text-xs">Le risposte usano solo i capitoli fino al {current}.</p>
      <div className="mt-2 overflow-auto" style={{ maxHeight }}>
        {msgs.length === 0 && <p className="py-2 text-xs">Nessun messaggio. Fai una domanda sulla storia: puoi anche continuare con domande brevi come "e lui che ruolo ha?".</p>}
        <ul className="space-y-2">
          {msgs.map((m) => (
            <li key={m.ts + m.role} className={m.role === "user" ? "flex justify-end" : ""}>
              <div className={`max-w-[92%] whitespace-pre-line rounded p-2 ${m.role === "user" ? "bg-segnalibro text-white" : "border-l-4 border-segnalibro bg-white"}`}>
                {m.text}
                <span className="mt-1 block text-[10px] opacity-60">cap. {m.chapter}</span>
              </div>
            </li>
          ))}
          {busy && <li className="text-xs">Sto pensando...</li>}
        </ul>
        <div ref={end} />
      </div>
      {err && <p className="mt-2 text-red-600">{err}</p>}
      <form onSubmit={(e) => { e.preventDefault(); invia(q); }} className="mt-2 flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Scrivi una domanda..." className="min-w-0 flex-1 rounded border border-inchiostro/30 p-2" />
        <button type="submit" disabled={!q.trim() || busy} className="rounded bg-segnalibro px-4 py-2 font-semibold text-white disabled:opacity-40">Invia</button>
      </form>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button onClick={() => invia("Riassumi fin qui", true)} disabled={busy} className="rounded border border-segnalibro px-3 py-1 text-xs font-semibold text-segnalibro disabled:opacity-40">Riassumi fin qui</button>
        <button onClick={() => invia("Cosa devo ricordare?", true)} disabled={busy} className="rounded border border-segnalibro px-3 py-1 text-xs font-semibold text-segnalibro disabled:opacity-40">Cosa devo ricordare?</button>
        {msgs.length > 0 && <button onClick={svuota} className="ml-auto text-xs text-red-600">Cancella cronologia</button>}
      </div>
    </div>
  );
}
