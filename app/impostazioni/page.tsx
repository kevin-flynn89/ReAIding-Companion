"use client";
import { useEffect, useState } from "react";
import { PROVIDERS, clearKeys, loadConfig, profileOf, saveConfig, useUsage, type AiConfig, type Profile, type Provider } from "@/lib/aiconfig";
import { chat, forgetAutoModels, listModels, resolveModels } from "@/lib/llm";
import { Icon, TopBar } from "../ui";

export default function Impostazioni() {
  const [cfg, setCfg] = useState<AiConfig | null>(null);
  const [draft, setDraft] = useState<Profile | null>(null);
  const [show, setShow] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [busy, setBusy] = useState<"" | "test" | "models">("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const usage = useUsage();

  useEffect(() => { const c = loadConfig(); setCfg(c); setDraft(profileOf(c)); }, []);
  if (!cfg || !draft) return <main><TopBar title="Impostazioni" /></main>;

  const provider = cfg.provider;
  const info = PROVIDERS.find((p) => p.id === provider)!;
  const set = (patch: Partial<Profile>) => { setDraft({ ...draft, ...patch }); setMsg(null); };

  function persist(): AiConfig {
    const next: AiConfig = { provider, profiles: { ...cfg!.profiles, [provider]: { ...draft!, apiKey: draft!.apiKey.trim(), baseUrl: draft!.baseUrl.trim() } } };
    setCfg(next); saveConfig(next); return next;
  }
  function pick(p: Provider) {
    const next = { ...cfg!, provider: p };
    setCfg(next); saveConfig(next); setDraft(profileOf(next, p)); setModels([]); setMsg(null); setShow(false);
  }
  async function prova() {
    setBusy("test"); setMsg(null); persist(); forgetAutoModels();
    try {
      const r = await chat({ system: "Rispondi in italiano con una sola parola.", messages: [{ role: "user", content: "Scrivi: pronto" }], maxTokens: 20 });
      const d = draft!;
      let which = "";
      if (provider !== "custom" && (!d.model.trim() || !d.cheapModel.trim())) {
        const a = await resolveModels(provider, d.apiKey, d.baseUrl);
        which = ` Modelli scelti in automatico: ${d.model.trim() ? "" : `risposte → ${a.main}`}${!d.model.trim() && !d.cheapModel.trim() ? ", " : ""}${d.cheapModel.trim() ? "" : `memoria → ${a.cheap}`}.`;
      }
      setMsg({ ok: true, text: `Funziona! L'AI ha risposto: "${r.slice(0, 60)}".${which} Ora puoi leggere e fare domande.` });
    } catch (e: any) { setMsg({ ok: false, text: e?.message || "Errore sconosciuto." }); }
    setBusy("");
  }
  async function aggiornaModelli() {
    setBusy("models"); setMsg(null);
    try {
      const ids = await listModels(provider, draft!.apiKey, draft!.baseUrl);
      setModels(ids);
      setMsg(ids.length ? { ok: true, text: `Trovati ${ids.length} modelli: scrivi nel campo e scegli dal suggerimento.` } : { ok: false, text: "Nessun modello trovato." });
    } catch (e: any) { setMsg({ ok: false, text: e?.message || "Errore." }); }
    setBusy("");
  }
  function rimuovi() {
    if (!window.confirm("Rimuovere dal dispositivo la chiave e le impostazioni dell'AI?")) return;
    clearKeys(); const c = loadConfig(); setCfg(c); setDraft(profileOf(c)); setModels([]); setMsg({ ok: true, text: "Chiave rimossa da questo dispositivo." });
  }

  const ready = provider === "custom" ? !!draft.baseUrl.trim() : !!draft.apiKey.trim();
  return (
    <main>
      <TopBar title="Impostazioni" sub="Collega la tua AI: usi la tua chiave, paghi solo il tuo provider." />

      <p className="banner flex items-start gap-3">
        <Icon name="shield" className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <span>La chiave resta <b>solo su questo dispositivo</b>: non finisce nei backup e viene inviata soltanto al provider che scegli. Le domande al libro mandano all'AI pochi passaggi, solo fino al capitolo che hai letto.</span>
      </p>

      <section className="card mt-4">
        <h2 className="text-lg font-bold">1. Scegli il provider</h2>
        <div className="-mx-1 mt-3 flex flex-wrap gap-2 px-1" role="tablist">
          {PROVIDERS.map((p) => <button key={p.id} role="tab" aria-selected={provider === p.id} onClick={() => pick(p.id)} className="chip">{p.label}</button>)}
        </div>
        <p className="mt-3 text-sm text-on-surface-variant">
          {info.keyUrl ? <>Crea la chiave qui: <a href={info.keyUrl} target="_blank" rel="noreferrer" className="font-semibold text-primary underline">{info.keyHelp}</a>. Di solito serve aggiungere un po' di credito (alcuni provider offrono un uso gratuito limitato: controlla le loro condizioni).</> : info.keyHelp}
        </p>
      </section>

      <section className="card mt-4 space-y-4">
        <h2 className="text-lg font-bold">2. Inserisci chiave e modello</h2>
        {provider === "custom" && (
          <label className="block text-sm"><span className="font-semibold">Indirizzo del provider</span>
            <input value={draft.baseUrl} onChange={(e) => set({ baseUrl: e.target.value })} placeholder="https://openrouter.ai/api/v1" inputMode="url" autoCapitalize="none" autoCorrect="off" className="field mt-1" />
            <span className="mt-1 block text-xs text-on-surface-variant">L'indirizzo che termina prima di "/chat/completions".</span>
          </label>
        )}
        <label className="block text-sm"><span className="font-semibold">Chiave API{provider === "custom" ? " (se serve)" : ""}</span>
          <span className="relative mt-1 block">
            <input value={draft.apiKey} onChange={(e) => set({ apiKey: e.target.value })} type={show ? "text" : "password"} placeholder="incolla qui la chiave" autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} className="field pr-14" />
            <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Nascondi la chiave" : "Mostra la chiave"} className="icon-btn absolute right-1 top-1/2 -translate-y-1/2"><Icon name="eye" /></button>
          </span>
        </label>
        <label className="block text-sm"><span className="font-semibold">Modello per le risposte</span>
          <span className="mt-0.5 block text-xs text-on-surface-variant">{provider === "custom" ? "Scrivi il nome del modello del tuo provider." : "Lascia vuoto: l'app sceglie da sola il modello più adatto e recente. Scrivi un nome solo se vuoi forzarne uno."}</span>
          <input value={draft.model} onChange={(e) => set({ model: e.target.value })} list="modelli" placeholder={provider === "custom" ? "nome del modello" : "Automatico (consigliato)"} autoCapitalize="none" autoCorrect="off" spellCheck={false} className="field mt-1" />
        </label>
        <details className="text-sm">
          <summary className="cursor-pointer font-semibold text-primary">Avanzate: modello economico per la memoria</summary>
          <label className="mt-3 block"><span className="text-on-surface-variant">Per analizzare i capitoli conviene un modello più piccolo e meno caro. Vuoto = scelta automatica del più economico del provider.</span>
            <input value={draft.cheapModel} onChange={(e) => set({ cheapModel: e.target.value })} list="modelli" placeholder={provider === "custom" ? "(come le risposte)" : "Automatico (consigliato)"} autoCapitalize="none" autoCorrect="off" spellCheck={false} className="field mt-2" />
          </label>
        </details>
        <datalist id="modelli">{models.map((m) => <option key={m} value={m} />)}</datalist>
        <div className="grid gap-2 sm:grid-cols-2">
          <button onClick={prova} disabled={!ready || busy !== ""} className="btn btn-filled"><Icon name="check" className="h-5 w-5" />{busy === "test" ? "Provo..." : "Salva e prova"}</button>
          <button onClick={aggiornaModelli} disabled={!ready || busy !== ""} className="btn btn-tonal">{busy === "models" ? "Cerco..." : "Aggiorna elenco modelli"}</button>
        </div>
        {msg && <p role="status" className={msg.ok ? "banner" : "banner-error"}>{msg.text}</p>}
      </section>

      <section className="card mt-4">
        <h2 className="text-lg font-bold">Uso di oggi</h2>
        <p className="mt-1 text-sm text-on-surface-variant">Su questo dispositivo: {usage.inT.toLocaleString("it-IT")} token inviati, {usage.outT.toLocaleString("it-IT")} ricevuti. Il costo dipende dal tuo provider e dal modello scelto: controlla il suo pannello per i dati ufficiali.</p>
      </section>

      <button onClick={rimuovi} className="btn btn-danger btn-sm mt-6"><Icon name="trash" className="h-4 w-4" />Rimuovi chiave da questo dispositivo</button>
    </main>
  );
}
