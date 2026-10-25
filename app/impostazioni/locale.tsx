"use client";
import { useEffect, useState } from "react";
import { Icon } from "../ui";
import { runQualityTest, savedScores, voteOf, type QualityResult } from "@/lib/localtest";
import { LOCAL_MODELS, downloadAndTest, isDownloaded, loadModel, localReadyFor, localSupport, recommendedModel, removeModel, type Support } from "@/lib/localllm";

// Sezione "AI sul dispositivo": scelta del modello, download con avanzamento, prova ed eliminazione.
export default function Locale({ model, onModel }: { model: string; onModel: (id: string) => void }) {
  const [sup, setSup] = useState<Support | null>(null);
  const [have, setHave] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [prog, setProg] = useState<{ p: number; text: string } | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [ready, setReady] = useState(false);
  const [scores, setScores] = useState<Record<string, QualityResult>>({});
  const [qprog, setQprog] = useState<string | null>(null);

  const refresh = async () => {
    const h: Record<string, boolean> = {};
    for (const m of LOCAL_MODELS) h[m.id] = await isDownloaded(m.id);
    setHave(h);
  };
  useEffect(() => { localSupport().then(setSup); refresh(); setScores(savedScores()); }, []);
  useEffect(() => { setReady(localReadyFor(model)); }, [model, busy]);

  const rec = recommendedModel(sup?.memGB ?? null);
  const chosen = LOCAL_MODELS.some((m) => m.id === model) ? model : rec;

  async function scarica() {
    setBusy(true); setMsg(null); setProg({ p: 0, text: "Preparo il download..." });
    onModel(chosen);
    try {
      const r = await downloadAndTest(chosen, (p, text) => setProg({ p, text }));
      setMsg({ ok: true, text: `Funziona! Il modello ha risposto: "${r.slice(0, 60)}". Ora puoi fare domande dal lettore e dalla chat.` });
    } catch (e: any) { setMsg({ ok: false, text: e?.message || "Errore sconosciuto." }); }
    setProg(null); setBusy(false); refresh();
  }
  async function elimina() {
    if (!window.confirm("Eliminare il modello scaricato da questo dispositivo? Libererai spazio, ma per usarlo dovrai riscaricarlo.")) return;
    setBusy(true); await removeModel(chosen); await refresh(); setBusy(false);
    setMsg({ ok: true, text: "Modello eliminato da questo dispositivo." });
  }

  async function provaQualita() {
    setBusy(true); setMsg(null); setQprog("Avvio la prova...");
    onModel(chosen);
    try {
      await loadModel(chosen, (p, text) => setQprog(`${Math.round(p * 100)}% · ${text}`));
      const r = await runQualityTest(chosen, (d, t) => setQprog(`Domanda ${Math.min(d + 1, t)} di ${t}...`));
      setScores(savedScores());
      setMsg({ ok: true, text: `Prova finita: italiano ${r.it}/3, inglese ${r.en}/3, circa ${r.secPerAnswer} secondi a risposta.` });
    } catch (e: any) { setMsg({ ok: false, text: e?.message || "Errore sconosciuto." }); }
    setQprog(null); setBusy(false); refresh();
  }

  return (
    <section className="card mt-4 space-y-4">
      <h2 className="text-lg font-bold">2. Scegli il modello sul dispositivo</h2>
      <p className="text-sm text-on-surface-variant">Il modello si scarica una volta (meglio con il Wi‑Fi) e poi funziona senza chiave e senza costi. I testi dei libri non lasciano il telefono. Risponde più lentamente e con meno precisione delle AI esterne: è un'opzione "base".</p>

      {sup && !sup.webgpu && <p role="status" className="banner-error">Questo browser non supporta WebGPU, necessario per l'AI sul dispositivo. Prova con Chrome aggiornato (versione 121 o successiva su Android) oppure usa una chiave AI.</p>}
      {sup && sup.webgpu && (
        <p className="text-xs text-on-surface-variant">
          {sup.memGB !== null ? `Memoria rilevata: circa ${sup.memGB} GB (il browser la arrotonda). ` : "Il browser non comunica la memoria del telefono: ti suggerisco il modello più leggero. "}
          {sup.f16 ? "" : "Questa scheda grafica usa la versione più pesante del modello. "}
        </p>
      )}

      <div className="space-y-2" role="radiogroup" aria-label="Modello sul dispositivo">
        {LOCAL_MODELS.map((m) => (
          <button key={m.id} role="radio" aria-checked={chosen === m.id} disabled={busy} onClick={() => { onModel(m.id); setMsg(null); }}
            className={`w-full rounded-3xl border-2 p-4 text-left transition ${chosen === m.id ? "border-primary bg-primary-container/40" : "border-outline-variant hover:bg-on-surface/5"}`}>
            <span className="flex flex-wrap items-center gap-2">
              <span className="font-bold">{m.label}</span>
              <span className="rounded-full border border-outline-variant px-2 py-0.5 text-[11px] font-bold">Livello: {m.level}</span>
              {m.id === rec && <span className="rounded-full bg-primary-container px-2 py-0.5 text-[11px] font-bold text-on-primary-container">consigliato per il tuo telefono</span>}
              {have[m.id] && <span className="rounded-full bg-secondary-container px-2 py-0.5 text-[11px] font-bold text-on-secondary-container">scaricato</span>}
            </span>
            <span className="mt-1 block text-sm text-on-surface-variant">Download {m.download} · memoria della scheda grafica {m.gpu}</span>
            <span className="mt-1 block text-xs text-on-surface-variant">Lingue: {m.langs}</span>
            <span className="mt-1 block text-xs text-on-surface-variant">{m.note}</span>
            <span className="mt-1 block text-xs font-semibold">
              {scores[m.id] ? `Voto misurato su questo telefono: ${voteOf(scores[m.id])}/10 (italiano ${scores[m.id].it}/3, inglese ${scores[m.id].en}/3, ~${scores[m.id].secPerAnswer} s a risposta)` : "Voto: da misurare (usa “Prova la qualità”)"}
            </span>
          </button>
        ))}
      </div>

      {prog && (
        <div role="status" aria-live="polite">
          <div className="progress" role="progressbar" aria-valuenow={Math.round(prog.p * 100)} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${Math.max(3, Math.round(prog.p * 100))}%` }} /></div>
          <p className="mt-2 break-words text-xs text-on-surface-variant">{Math.round(prog.p * 100)}% · {prog.text}</p>
        </div>
      )}

      {qprog && <p role="status" aria-live="polite" className="break-words text-xs text-on-surface-variant">{qprog}</p>}
      <div className="grid gap-2 sm:grid-cols-2">
        <button onClick={scarica} disabled={busy || (sup !== null && !sup.webgpu)} className="btn btn-filled">
          <Icon name="download" className="h-5 w-5" />{busy ? "Attendi..." : have[chosen] ? "Prova il modello" : "Scarica e prova"}
        </button>
        <button onClick={provaQualita} disabled={busy || !have[chosen] || (sup !== null && !sup.webgpu)} className="btn btn-outlined">Prova la qualità</button>
        <button onClick={elimina} disabled={busy || !have[chosen]} className="btn btn-outlined"><Icon name="trash" className="h-5 w-5" />Elimina dal dispositivo</button>
      </div>
      {ready && !msg && <p className="banner">Modello pronto: {LOCAL_MODELS.find((m) => m.id === model)?.label}.</p>}
      <p className="text-xs text-on-surface-variant">“Prova la qualità” fa 6 piccole domande (3 in italiano, 3 in inglese) a un mini-testo, direttamente sul telefono, e calcola il voto. Il risultato vale solo per questo telefono e resta salvato qui.</p>
      {msg && <p role="status" className={msg.ok ? "banner" : "banner-error"}>{msg.text}</p>}
      <p className="text-xs text-on-surface-variant">Limiti: la memoria narrativa richiede un'AI esterna (i modelli piccoli non la costruiscono in modo affidabile); durante le risposte il telefono può scaldarsi e consumare batteria. Il modello viene scaricato da huggingface.co e salvato nella memoria del browser.</p>
    </section>
  );
}
