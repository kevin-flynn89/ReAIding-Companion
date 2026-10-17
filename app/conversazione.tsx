"use client";
import { useEffect, useRef, useState } from "react";
import type { Work } from "@/lib/library";
import type { Chunk } from "@/lib/rag";
import { clearChat, historyFor, loadChat, saveChat, type Msg } from "@/lib/chat";
import { answer } from "@/lib/companion";
import Link from "next/link";
import { useAiReady } from "@/lib/aiconfig";
import { AiChip, Icon, Loader } from "./ui";

// Conversazione con l'AI per un libro. La cronologia resta salvata sul dispositivo.
// fill = occupa tutta l'altezza del contenitore (pagina chat); altrimenti i messaggi scorrono fino a maxHeight.
export default function Conversazione({ work, current, chunks, maxHeight = "40vh", fill = false }: { work: Work; current: number; chunks: Chunk[]; maxHeight?: string; fill?: boolean }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const ready = useAiReady();

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
    <div className={`flex flex-col text-[15px] ${fill ? "h-full min-h-0" : ""}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-col items-start gap-1.5">
          <p className="flex items-center gap-2 text-xs text-on-surface-variant"><Icon name="shield" className="h-4 w-4 shrink-0" />Le risposte usano solo i capitoli fino al {current}.</p>
          <AiChip />
        </div>
        {msgs.length > 0 && <button onClick={svuota} aria-label="Cancella cronologia" title="Cancella cronologia" className="icon-btn -my-2 -mr-2 h-10 w-10 shrink-0 text-on-surface-variant"><Icon name="trash" className="h-5 w-5" /></button>}
      </div>

      {ready === false && (
        <div className="mt-3 rounded-3xl bg-tertiary-container p-4 text-sm text-on-tertiary-container">
          <p className="font-semibold">Prima collega un'AI</p>
          <p className="mt-1">Per fare domande serve la tua chiave API (di Anthropic, OpenAI, Google o altro). Costa poco e resta solo sul tuo dispositivo.</p>
          <Link href="/impostazioni" className="btn btn-filled btn-sm mt-3">Vai alle Impostazioni</Link>
        </div>
      )}
      <div className={`mt-3 overflow-y-auto ${fill ? "min-h-0 flex-1" : ""}`} style={fill ? undefined : { maxHeight }}>
        {msgs.length === 0 && (
          <div className="rounded-3xl bg-surface-high p-4 text-sm text-on-surface-variant">
            Fai una domanda sulla storia. Puoi continuare con domande brevi, come "e lui che ruolo ha?".
          </div>
        )}
        <ul className="space-y-3">
          {msgs.map((m) => (
            <li key={m.ts + m.role} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div className={`max-w-[88%] whitespace-pre-line rounded-[24px] px-4 py-3 ${m.role === "user" ? "rounded-br-[8px] bg-primary text-on-primary" : "rounded-bl-[8px] bg-surface-high text-on-surface"}`}>
                {m.text}
                <span className="mt-1 block text-[11px] opacity-70">cap. {m.chapter}</span>
              </div>
            </li>
          ))}
          {busy && <li className="flex justify-start"><div className="rounded-[24px] rounded-bl-[8px] bg-surface-high px-4 py-3"><Loader label="Sto pensando..." /></div></li>}
        </ul>
        <div ref={end} />
      </div>

      {err && <p role="alert" className="banner-error mt-3">{err}</p>}

      <div className="-mx-1 mt-3 flex items-center gap-2 overflow-x-auto px-1 pb-1">
        <button onClick={() => invia("Riassumi fin qui", true)} disabled={busy} className="chip">Riassumi fin qui</button>
        <button onClick={() => invia("Cosa devo ricordare?", true)} disabled={busy} className="chip">Cosa devo ricordare?</button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); invia(q); }} className="mt-2 flex items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Scrivi una domanda" aria-label="Domanda sul libro" enterKeyHint="send"
          className="min-h-[56px] min-w-0 flex-1 rounded-full border-2 border-transparent bg-surface-highest px-5 text-base text-on-surface placeholder:text-on-surface-variant/70 focus:border-primary focus:outline-none" />
        <button type="submit" disabled={!q.trim() || busy || ready === false} aria-label="Invia" className="fab"><Icon name="send" /></button>
      </form>
    </div>
  );
}
