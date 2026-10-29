// Traduzione semplice, senza librerie: il testo originale (italiano) fa da chiave.
// t("Capitolo {n}", { n: 3 }) → in italiano resta così; in inglese usa il dizionario (lib/i18n-en.ts).
// Se manca la traduzione, si vede l'italiano (nulla si rompe).
import { EN } from "./i18n-en";

export type Lang = "it" | "en";
const KEY = "rc_lang";
let current: Lang = "it";

export const getLang = (): Lang => current;
export const setCurrentLang = (l: Lang) => { current = l; };
export const numLocale = () => (current === "en" ? "en-GB" : "it-IT");

// Lingua scelta dall'utente; altrimenti quella del telefono (italiano se inizia per "it", inglese per tutte le altre)
export function detectLang(): Lang {
  try {
    const s = localStorage.getItem(KEY);
    if (s === "it" || s === "en") return s;
  } catch { /* ignora */ }
  try { return /^it\b/i.test(navigator.language || "") ? "it" : "en"; } catch { return "it"; }
}
export function chooseLang(l: Lang) {
  try { localStorage.setItem(KEY, l); } catch { /* ignora */ }
  window.dispatchEvent(new Event("rc-lang"));
}

export function t(it: string, vars?: Record<string, string | number>): string {
  let s = current === "en" ? (EN[it] ?? it) : it;
  if (vars) for (const k of Object.keys(vars)) s = s.split(`{${k}}`).join(String(vars[k]));
  return s;
}
