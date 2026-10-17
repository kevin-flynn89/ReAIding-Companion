import { activeProfile, addUsage, type Provider } from "./aiconfig";

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
  if (status === 404) return new AiError("model", `Modello non trovato: controlla il nome nelle Impostazioni${tail}`);
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

export async function chat(o: ChatOpts): Promise<string> {
  const a = activeProfile();
  const p: Provider = a.provider;
  if (p === "custom" ? !a.baseUrl : !a.apiKey.trim()) throw new AiError("nokey", "Prima collega un'AI: apri Impostazioni e inserisci la tua chiave.");
  const model = ((o.cheap && a.cheapModel.trim()) || a.model).trim();
  if (!model) throw new AiError("model", "Scegli il nome del modello nelle Impostazioni.");
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
