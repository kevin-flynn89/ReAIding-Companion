import { activeProfile, addUsage, hasKey, type Provider } from "./aiconfig";
import { localChat } from "./localllm";

// Chiamata diretta dal browser al provider scelto dall'utente, con la sua chiave.
export type ErrKind = "nokey" | "auth" | "quota" | "model" | "network" | "other";
export class AiError extends Error {
  constructor(public kind: ErrKind, message: string) { super(message); }
}
export type ChatMsg = { role: "user" | "assistant"; content: string };
export type ChatOpts = { system: string; messages: ChatMsg[]; maxTokens: number; temperature?: number; cheap?: boolean };

// Le API richiedono che si parta da un messaggio dell'utente e che i ruoli si alternino
function normalize(msgs: ChatMsg[]): ChatMsg[] {
  const out: ChatMsg[] = [];
  for (const m of msgs) {
    if (!m.content.trim()) continue;
    if (!out.length && m.role !== "user") continue;
    const last = out[out.length - 1];
    if (last && last.role === m.role) last.content += "\n\n" + m.content;
    else out.push({ ...m });
  }
  return out;
}

const reasoning = (model: string) => /^(o\d|gpt-5)/i.test(model);
const thinking = (model: string) => /gemini-(2\.5|3)/i.test(model);

async function readBody(r: Response): Promise<any> { try { return await r.json(); } catch { return {}; } }
function providerMessage(d: any): string {
  const m = d?.error?.message ?? d?.message ?? d?.error ?? "";
  return (typeof m === "string" ? m : JSON.stringify(m)).slice(0, 220);
}
function httpError(status: number, d: any): AiError {
  const detail = providerMessage(d);
  const tail = detail ? ` (${detail})` : "";
  if (status === 401 || status === 403) return new AiError("auth", `Il provider ha rifiutato la chiave: controlla che sia giusta e attiva${tail}`);
  if (status === 429) return new AiError("quota", `Limite o credito del provider esaurito, riprova più tardi${tail}`);
  if (status === 404) return new AiError("model", `Modello non trovato: controlla il nome nelle Opzioni (o lascia il campo vuoto per la scelta automatica)${tail}`);
  return new AiError("other", `Errore del provider (${status})${tail}`);
}
async function post(url: string, headers: Record<string, string>, body: unknown): Promise<any> {
  let r: Response;
  try {
    r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) });
  } catch {
    throw new AiError("network", "Non riesco a raggiungere il provider: controlla la connessione. Se succede sempre, il provider potrebbe non accettare chiamate dirette dal browser.");
  }
  const d = await readBody(r);
  if (!r.ok) throw httpError(r.status, d);
  return d;
}

type Active = ReturnType<typeof activeProfile>;

async function callProvider(a: Active, model: string, o: ChatOpts): Promise<string> {
  const p: Provider = a.provider;
  const msgs = normalize(o.messages);
  if (!msgs.length) throw new AiError("other", "Nessun messaggio da inviare.");
  const key = a.apiKey.trim();
  let text = "", inT = 0, outT = 0;

  if (p === "anthropic") {
    const d = await post("https://api.anthropic.com/v1/messages", {
      "x-api-key": key, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true",
    }, { model, max_tokens: o.maxTokens, system: o.system, messages: msgs, temperature: o.temperature ?? 0.2 });
    text = (d.content || []).map((b: any) => (b?.type === "text" ? b.text : "")).join("");
    inT = d.usage?.input_tokens; outT = d.usage?.output_tokens;
  } else if (p === "gemini") {
    const d = await post(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, { "x-goog-api-key": key }, {
      systemInstruction: { parts: [{ text: o.system }] },
      contents: msgs.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
      generationConfig: { temperature: o.temperature ?? 0.2, maxOutputTokens: thinking(model) ? o.maxTokens * 4 : o.maxTokens },
    });
    text = (d.candidates?.[0]?.content?.parts || []).map((x: any) => x?.text || "").join("");
    if (!text && d.promptFeedback?.blockReason) throw new AiError("other", "Il provider ha bloccato la richiesta per i suoi filtri di sicurezza.");
    inT = d.usageMetadata?.promptTokenCount; outT = d.usageMetadata?.candidatesTokenCount;
  } else {
    // OpenAI e provider compatibili
    const isOpenAI = p === "openai";
    const base = isOpenAI ? "https://api.openai.com/v1" : a.baseUrl.trim().replace(/\/+$/, "");
    const body: any = { model, messages: [{ role: "system", content: o.system }, ...msgs] };
    if (isOpenAI) {
      body.max_completion_tokens = reasoning(model) ? Math.max(o.maxTokens * 4, 2000) : o.maxTokens;
      if (!reasoning(model)) body.temperature = o.temperature ?? 0.2;
    } else {
      body.max_tokens = o.maxTokens; body.temperature = o.temperature ?? 0.2;
    }
    const d = await post(`${base}/chat/completions`, key ? { Authorization: `Bearer ${key}` } : {}, body);
    const c = d.choices?.[0]?.message?.content;
    text = typeof c === "string" ? c : Array.isArray(c) ? c.map((x: any) => x?.text || "").join("") : "";
    inT = d.usage?.prompt_tokens; outT = d.usage?.completion_tokens;
  }
  addUsage(Number(inT) || 0, Number(outT) || 0);
  text = text.trim();
  if (!text) throw new AiError("other", "L'AI ha restituito una risposta vuota. Riprova, o prova un altro modello.");
  return text;
}

export async function chat(o: ChatOpts): Promise<string> {
  const a = activeProfile();
  if (a.provider === "local") {
    if (!hasKey()) throw new AiError("nokey", "Prima scarica un modello: apri Opzioni, scegli \"Sul dispositivo\" e premi \"Scarica e prova\".");
    return localChat(a.model, o.system, normalize(o.messages), o.maxTokens, o.temperature ?? 0.2);
  }
  if (a.provider === "custom" ? !a.baseUrl : !a.apiKey.trim()) throw new AiError("nokey", "Prima collega un'AI: apri Opzioni e inserisci la tua chiave.");
  const typed = ((o.cheap && a.cheapModel.trim()) || (!o.cheap || a.provider === "custom" ? a.model.trim() : "") || "").trim();
  if (typed) return callProvider(a, typed, o); // nome scritto da te: lo uso così com'è
  if (a.provider === "custom") throw new AiError("model", "Scrivi il nome del modello nelle Opzioni.");
  // Automatico: scelgo dall'elenco reale del provider; se il modello è sparito, rileggo l'elenco e riprovo una volta
  for (const force of [false, true]) {
    const picked = await resolveModels(a.provider, a.apiKey, a.baseUrl, force);
    const model = o.cheap ? picked.cheap : picked.main;
    try { return await callProvider(a, model, o); }
    catch (e) { if (!(e instanceof AiError && e.kind === "model") || force) throw e; }
  }
  throw new AiError("model", "Non sono riuscito a scegliere un modello.");
}

// Elenco dei modelli disponibili con la chiave inserita (aiuta a scrivere il nome giusto)
export async function listModels(provider: Provider, apiKey: string, baseUrl: string): Promise<string[]> {
  const key = apiKey.trim();
  let r: Response;
  try {
    if (provider === "anthropic") r = await fetch("https://api.anthropic.com/v1/models?limit=100", { headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" } });
    else if (provider === "gemini") r = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=100", { headers: { "x-goog-api-key": key } });
    else r = await fetch(`${provider === "openai" ? "https://api.openai.com/v1" : baseUrl.trim().replace(/\/+$/, "")}/models`, { headers: key ? { Authorization: `Bearer ${key}` } : {} });
  } catch { throw new AiError("network", "Non riesco a raggiungere il provider."); }
  const d = await readBody(r);
  if (!r.ok) throw httpError(r.status, d);
  let ids: string[] = [];
  if (provider === "gemini") ids = (d.models || []).filter((m: any) => (m.supportedGenerationMethods || []).includes("generateContent")).map((m: any) => String(m.name).replace(/^models\//, ""));
  else ids = (d.data || []).map((m: any) => String(m.id));
  if (provider === "openai") ids = ids.filter((i) => /^(gpt|o\d|chatgpt)/i.test(i) && !/(audio|realtime|tts|transcribe|image|embedding|moderation|search)/i.test(i));
  return ids.sort();
}

// ---- Scelta automatica del modello ----
// Dall'elenco del provider prendo il modello più recente "di taglia media" per le risposte
// e quello più piccolo ed economico per la memoria. Niente nomi scritti nel codice: non invecchia.
const dated = (id: string) => /-(\d{4}-\d{2}-\d{2}|\d{8}|\d{4})$/.test(id);
function ver(id: string): number {
  const m = id.match(/(\d+)(?:[.-](\d+))?/);
  return m ? Number(m[1]) + (m[2] && m[2].length < 3 ? Number(m[2]) / 100 : 0) : 0;
}
function best(ids: string[], want: (id: string) => boolean, avoid: RegExp): string | undefined {
  return ids.filter((i) => want(i) && !avoid.test(i))
    .sort((a, b) => ver(b) - ver(a) || Number(/preview|exp/.test(a)) - Number(/preview|exp/.test(b)) || Number(dated(a)) - Number(dated(b)) || a.length - b.length)[0];
}
export function pickModels(provider: Provider, ids: string[]): { main: string; cheap: string } {
  let main: string | undefined, cheap: string | undefined;
  if (provider === "anthropic") {
    // l'elenco di Anthropic arriva dal più recente: prendo il primo di ogni famiglia
    main = ids.find((i) => /sonnet/.test(i)) || ids.find((i) => /opus/.test(i));
    cheap = ids.find((i) => /haiku/.test(i));
  } else if (provider === "openai") {
    const bad = /(pro|codex|instruct|chat-latest|search|deep-research|oss|nano|mini|audio|image|vision|transcribe|tts|realtime)/;
    main = best(ids, (i) => /^gpt-\d/.test(i), bad);
    cheap = best(ids, (i) => /^gpt-\d.*mini/.test(i), /(audio|image|search|realtime|transcribe|tts|codex)/) || best(ids, (i) => /^gpt-\d.*nano/.test(i), /(audio|image|search|realtime|transcribe|tts)/);
  } else if (provider === "gemini") {
    const bad = /(image|tts|live|audio|embedding|robotics|computer|thinking|vision|learnlm|gemma|nano|banana|customtools|deep-research|aqa)/;
    main = best(ids, (i) => /^gemini-[\d.]+-flash(-preview.*)?$/.test(i) || /^gemini-[\d.]+-flash-\d+$/.test(i), bad) || best(ids, (i) => /^gemini-[\d.]+-pro/.test(i), bad);
    cheap = best(ids, (i) => /flash-lite/.test(i), bad);
  }
  const first = ids[0];
  main = main || first; cheap = cheap || main;
  if (!main) throw new AiError("model", "Il provider non ha elencato modelli utilizzabili: scrivi il nome nelle Opzioni.");
  return { main, cheap: cheap! };
}

const MCACHE = "rc_models";
type MC = { provider: Provider; ts: number; main: string; cheap: string };
export async function resolveModels(provider: Provider, apiKey: string, baseUrl: string, force = false): Promise<{ main: string; cheap: string }> {
  try {
    const c = JSON.parse(localStorage.getItem(MCACHE) || "null") as MC | null;
    if (!force && c && c.provider === provider && Date.now() - c.ts < 24 * 3600 * 1000) return { main: c.main, cheap: c.cheap };
  } catch { /* ignora */ }
  const ids = await listModels(provider, apiKey, baseUrl);
  const r = pickModels(provider, ids);
  try { localStorage.setItem(MCACHE, JSON.stringify({ provider, ts: Date.now(), ...r } satisfies MC)); } catch { /* ignora */ }
  return r;
}
export function forgetAutoModels() { try { localStorage.removeItem(MCACHE); } catch { /* ignora */ } }
