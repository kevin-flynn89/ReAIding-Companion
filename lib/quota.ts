"use client";
import { useEffect, useState } from "react";

// Contatore locale dell'uso gratuito dell'AI.
// È una STIMA: Cloudflare conta la quota sul tuo account (si azzera a mezzanotte UTC, cioè le 01:00/02:00 in Italia).
// Una domanda alla chat vale 1; l'analisi di un pezzo di capitolo per la memoria vale molto meno.
export const DAILY_QUESTIONS = 70;
export const COST_ASK = 1;
export const COST_EXTRACT = 0.15;
const KEY = "rc_quota";

type Q = { day: string; used: number };
const today = () => new Date().toISOString().slice(0, 10); // giorno UTC

function read(): Q {
  try {
    const q = JSON.parse(localStorage.getItem(KEY) || "null") as Q | null;
    if (q && q.day === today() && typeof q.used === "number") return q;
  } catch { /* ignora */ }
  return { day: today(), used: 0 };
}
function write(q: Q) {
  try { localStorage.setItem(KEY, JSON.stringify(q)); } catch { /* ignora */ }
  if (typeof window !== "undefined") window.dispatchEvent(new Event("rc-quota"));
}

// Una risposta riuscita smentisce un eventuale "quota finita" sbagliato: il contatore non può restare a zero
export function addUsage(cost: number) { const q = read(); q.used = Math.min(q.used + cost, DAILY_QUESTIONS - 1); write(q); }
// Il server ha detto che la quota è finita: allineo il contatore
export function markExhausted() { const q = read(); q.used = Math.max(q.used, DAILY_QUESTIONS); write(q); }
export const looksLikeQuotaError = (m: string) => /quota/i.test(m);
export function questionsLeft(): number { return Math.max(0, Math.floor(DAILY_QUESTIONS - read().used)); }

export function useQuota(): number {
  const [left, setLeft] = useState<number>(DAILY_QUESTIONS);
  useEffect(() => {
    const upd = () => setLeft(questionsLeft());
    upd();
    window.addEventListener("rc-quota", upd);
    window.addEventListener("focus", upd);
    return () => { window.removeEventListener("rc-quota", upd); window.removeEventListener("focus", upd); };
  }, []);
  return left;
}
