"use client";
import { useEffect, useState } from "react";
import { localReadyFor } from "./localllm";

// Impostazioni dell'AI scelta dall'utente. La chiave resta SOLO su questo dispositivo (localStorage):
// non entra nei backup e non viene mai inviata a nessuno tranne al provider scelto.
export type Provider = "anthropic" | "openai" | "gemini" | "custom" | "local";
export const PROVIDERS: { id: Provider; label: string; keyUrl: string; keyHelp: string; modelsUrl: string }[] = [
  { id: "anthropic", label: "Anthropic (Claude)", keyUrl: "https://console.anthropic.com/settings/keys", keyHelp: "console.anthropic.com → API Keys", modelsUrl: "https://docs.claude.com/en/docs/about-claude/models/overview" },
  { id: "openai", label: "OpenAI", keyUrl: "https://platform.openai.com/api-keys", keyHelp: "platform.openai.com → API keys", modelsUrl: "https://platform.openai.com/docs/models" },
  { id: "gemini", label: "Google Gemini", keyUrl: "https://aistudio.google.com/apikey", keyHelp: "aistudio.google.com → Get API key", modelsUrl: "https://ai.google.dev/gemini-api/docs/models" },
  { id: "local", label: "Sul dispositivo (offline)", keyUrl: "", keyHelp: "Nessuna chiave e nessun costo: un piccolo modello gira sul tuo telefono. Più lento e meno preciso delle AI esterne.", modelsUrl: "" },
  { id: "custom", label: "Altro (compatibile OpenAI)", keyUrl: "", keyHelp: "OpenRouter, Groq, Mistral, un modello locale...", modelsUrl: "" },
];
// I nomi dei modelli NON sono scritti qui (invecchiano): se il campo è vuoto l'app sceglie da sola
// il modello giusto leggendo l'elenco del provider (vedi lib/llm.ts).
// Questi erano i vecchi suggerimenti salvati nelle versioni precedenti: li trattiamo come "automatico".
const OLD_DEFAULTS = new Set(["claude-sonnet-5-5", "claude-haiku-5-5", "gpt-4o-mini", "gemini-2.5-flash", "gemini-2.5-flash-lite"]);

export type Profile = { apiKey: string; model: string; cheapModel: string; baseUrl: string };
export type AiConfig = { provider: Provider; profiles: Partial<Record<Provider, Profile>> };

const KEY = "rc_ai";
const emptyProfile = (): Profile => ({ apiKey: "", model: "", cheapModel: "", baseUrl: "" });

export function loadConfig(): AiConfig {
  try {
    const c = JSON.parse(localStorage.getItem(KEY) || "null") as AiConfig | null;
    if (c && PROVIDERS.some((p) => p.id === c.provider) && c.profiles) return c;
  } catch { /* ignora */ }
  return { provider: "anthropic", profiles: {} };
}
export function saveConfig(c: AiConfig) {
  try { localStorage.setItem(KEY, JSON.stringify(c)); } catch { /* ignora */ }
  if (typeof window !== "undefined") window.dispatchEvent(new Event("rc-ai"));
}
export function profileOf(c: AiConfig, p: Provider = c.provider): Profile {
  const x = { ...emptyProfile(), ...(c.profiles[p] || {}) };
  if (OLD_DEFAULTS.has(x.model)) x.model = "";
  if (OLD_DEFAULTS.has(x.cheapModel)) x.cheapModel = "";
  return x;
}
export const activeProfile = () => { const c = loadConfig(); return { provider: c.provider, ...profileOf(c) }; };
export function hasKey(): boolean {
  const a = activeProfile();
  if (a.provider === "local") return localReadyFor(a.model);
  return a.provider === "custom" ? !!a.baseUrl : !!a.apiKey.trim();
}
export function clearKeys() { try { localStorage.removeItem(KEY); } catch { /* ignora */ } window.dispatchEvent(new Event("rc-ai")); }

export function useAiReady(): boolean | null {
  const [ready, setReady] = useState<boolean | null>(null);
  useEffect(() => {
    const upd = () => setReady(hasKey());
    upd();
    window.addEventListener("rc-ai", upd);
    return () => window.removeEventListener("rc-ai", upd);
  }, []);
  return ready;
}

// Token usati oggi (solo conteggio informativo, sul dispositivo)
const UKEY = "rc_usage";
type U = { day: string; inT: number; outT: number };
const day = () => new Date().toLocaleDateString("sv"); // AAAA-MM-GG, ora locale
function readU(): U {
  try { const u = JSON.parse(localStorage.getItem(UKEY) || "null") as U | null; if (u && u.day === day()) return u; } catch { /* ignora */ }
  return { day: day(), inT: 0, outT: 0 };
}
export function addUsage(inT: number, outT: number) {
  const u = readU(); u.inT += inT || 0; u.outT += outT || 0;
  try { localStorage.setItem(UKEY, JSON.stringify(u)); } catch { /* ignora */ }
  window.dispatchEvent(new Event("rc-usage"));
}
export function useUsage(): { inT: number; outT: number } {
  const [u, setU] = useState({ inT: 0, outT: 0 });
  useEffect(() => {
    const upd = () => { const x = readU(); setU({ inT: x.inT, outT: x.outT }); };
    upd();
    window.addEventListener("rc-usage", upd); window.addEventListener("focus", upd);
    return () => { window.removeEventListener("rc-usage", upd); window.removeEventListener("focus", upd); };
  }, []);
  return u;
}
