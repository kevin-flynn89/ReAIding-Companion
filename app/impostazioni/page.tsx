"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PROVIDERS, clearKeys, loadConfig, profileOf, saveConfig, useUsage, type AiConfig, type Profile, type Provider } from "@/lib/aiconfig";
import { chat, forgetAutoModels, listModels, pickModels, resolveModels } from "@/lib/llm";
import { Icon, TopBar } from "../ui";
import Locale from "./locale";

export default function Impostazioni() {
  const [cfg, setCfg] = useState<AiConfig | null>(null);
  const [draft, setDraft] = useState<Profile | null>(null);
  const [show, setShow] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [panel, setPanel] = useState(false);
  const [target, setTarget] = useState<"model" | "cheap">("model");
  const [filter, setFilter] = useState("");
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
    setCfg(next); saveConfig(next); setDraft(profileOf(next, p)); setModels([]); setPanel(false); setMsg(null); setShow(false);
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
  async function apriElenco(t: "model" | "cheap" = target) {
    setTarget(t); setPanel(true); setFilter("");
    if (models.length) return;
    setBusy("models"); setMsg(null);
    try {
      const ids = await listModels(provider, draft!.apiKey, draft!.baseUrl);
      setModels(ids);
      if (!ids.length) setMsg({ ok: false, text: "Il provider non ha elencato nessun modello." });
    } catch (e: any) { setMsg({ ok: false, text: e?.message || "Errore." }); setPanel(false); }
    setBusy("");
  }
  function scegli(id: string) {
    set(target === "model" ? { model: id } : { cheapModel: id });
    setPanel(false);
    setMsg({ ok: true, text: `Scelto "${id}" per ${target === "model" ? "le risposte" : "la memoria"}. Premi "Salva e prova" per confermare.` });
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

      {provider === "local" ? (
        <Locale model={draft.model} onModel={(id) => { const d = { ...draft, model: id }; setDraft(d); const next: AiConfig = { provider, profiles: { ...cfg.profiles, [provider]: d } }; setCfg(next); saveConfig(next); }} />
      ) : (
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
          <span className="relative mt-1 block">
            <input value={draft.model} onChange={(e) => set({ model: e.target.value })} placeholder={provider === "custom" ? "nome del modello" : "Automatico (consigliato)"} autoCapitalize="none" autoCorrect="off" spellCheck={false} className="field pr-14" />
            <button type="button" onClick={() => apriElenco("model")} disabled={!ready} aria-label="Scegli da un elenco di modelli" className="icon-btn absolute right-1 top-1/2 -translate-y-1/2"><Icon name="list" /></button>
          </span>
        </label>
        <details className="text-sm">
          <summary className="cursor-pointer font-semibold text-primary">Avanzate: modello economico per la memoria</summary>
          <label className="mt-3 block"><span className="text-on-surface-variant">Per analizzare i capitoli conviene un modello più piccolo e meno caro. Vuoto = scelta automatica del più economico del provider.</span>
            <span className="relative mt-2 block">
              <input value={draft.cheapModel} onChange={(e) => set({ cheapModel: e.target.value })} placeholder={provider === "custom" ? "(come le risposte)" : "Automatico (consigliato)"} autoCapitalize="none" autoCorrect="off" spellCheck={false} className="field pr-14" />
              <button type="button" onClick={() => apriElenco("cheap")} disabled={!ready} aria-label="Scegli da un elenco di modelli" className="icon-btn absolute right-1 top-1/2 -translate-y-1/2"><Icon name="list" /></button>
            </span>
          </label>
        </details>
        <div className="grid gap-2 sm:grid-cols-2">
          <button onClick={prova} disabled={!ready || busy !== ""} className="btn btn-filled"><Icon name="check" className="h-5 w-5" />{busy === "test" ? "Provo..." : "Salva e prova"}</button>
          <button onClick={() => apriElenco()} disabled={!ready || busy !== ""} className="btn btn-tonal"><Icon name="list" className="h-5 w-5" />{busy === "models" ? "Cerco..." : "Vedi i modelli disponibili"}</button>
        </div>
        {panel && (
          <div className="rounded-3xl bg-surface-high p-4" aria-label="Modelli disponibili">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-bold">Modelli disponibili</h3>
              <button onClick={() => setPanel(false)} aria-label="Chiudi l'elenco" className="icon-btn -my-2 -mr-2"><Icon name="close" /></button>
            </div>
            <p className="mt-1 text-xs text-on-surface-variant">Elenco preso ora dal tuo provider: sono i nomi che funzionano con la tua chiave. Tocca un nome per usarlo come:</p>
            <div className="mt-2 flex gap-2" role="tablist">
              <button role="tab" aria-selected={target === "model"} onClick={() => setTarget("model")} className="chip">Risposte</button>
              <button role="tab" aria-selected={target === "cheap"} onClick={() => setTarget("cheap")} className="chip">Memoria</button>
            </div>
            <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Cerca (es. flash, mini, sonnet)" autoCapitalize="none" autoCorrect="off" className="field mt-3" />
            {busy === "models" && <p className="mt-3 text-sm text-on-surface-variant">Cerco i modelli...</p>}
            {(() => {
              const auto = models.length && provider !== "custom" ? (() => { try { return pickModels(provider, models); } catch { return null; } })() : null;
              const list = models.filter((m) => m.toLowerCase().includes(filter.trim().toLowerCase()));
              return (
                <ul className="mt-2 max-h-[45vh] space-y-1 overflow-y-auto">
                  {list.map((m) => (
                    <li key={m}>
                      <button onClick={() => scegli(m)} className="flex min-h-[48px] w-full items-center justify-between gap-2 rounded-xl px-3 text-left text-sm hover:bg-on-surface/10 active:bg-on-surface/15">
                        <span className="min-w-0 break-all font-medium">{m}</span>
                        {auto && (m === auto.main || m === auto.cheap) && <span className="shrink-0 rounded-full bg-primary-container px-2 py-0.5 text-[11px] font-bold text-on-primary-container">{m === auto.main ? "consigliato: risposte" : "consigliato: memoria"}</span>}
                      </button>
                    </li>
                  ))}
                  {models.length > 0 && list.length === 0 && <li className="px-3 py-2 text-sm text-on-surface-variant">Nessun modello con questo nome.</li>}
                </ul>
              );
            })()}
          </div>
        )}
        {info.modelsUrl && <p className="text-xs text-on-surface-variant">Elenco ufficiale e descrizioni dei modelli: <a href={info.modelsUrl} target="_blank" rel="noreferrer" className="font-semibold text-primary underline">pagina dei modelli di {info.label.split(" ")[0]}</a>.</p>}
        {msg && <p role="status" className={msg.ok ? "banner" : "banner-error"}>{msg.text}</p>}
      </section>
      )}

      {provider !== "local" && (      <section className="card mt-4">
        <h2 className="text-lg font-bold">Uso di oggi</h2>
        <p className="mt-1 text-sm text-on-surface-variant">Su questo dispositivo: {usage.inT.toLocaleString("it-IT")} token inviati, {usage.outT.toLocaleString("it-IT")} ricevuti. Il costo dipende dal tuo provider e dal modello scelto: controlla il suo pannello per i dati ufficiali.</p>
      </section>)}

      <button onClick={rimuovi} className="btn btn-danger btn-sm mt-6"><Icon name="trash" className="h-4 w-4" />Rimuovi chiave da questo dispositivo</button>

      <p className="mt-8 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        <Link href="/privacy" className="font-semibold text-primary underline">Privacy</Link>
        <Link href="/condizioni" className="font-semibold text-primary underline">Condizioni d'uso</Link>
      </p>
    </main>
  );
}
