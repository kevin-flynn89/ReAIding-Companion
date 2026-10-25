// "Prova la qualità": 6 domande fisse su due mini-testi (3 italiano, 3 inglese), con la stessa impostazione
// usata nell'app (istruzioni, Spoiler Shield, limiti ridotti). In ogni lingua una domanda non ha risposta nel testo:
// il modello deve dire che non è stato spiegato, non inventare. Il punteggio si calcola in automatico e vale per questo telefono.
import { buildAsk, LOCAL_LIMITS } from "./prompts";
import { localChat } from "./localllm";

type Q = { lang: "it" | "en"; text: string; question: string; ok: (a: string) => boolean };

const IT = "Marco e Luca erano amici d'infanzia. Un giorno d'estate Marco prestò a Luca la sua bicicletta rossa. Luca la perse al lago e non lo disse a nessuno. Il giorno dopo Marco lo scoprì e smise di parlargli.";
const EN = "Anna and Peter found an old key in the garden. Anna kept it in her blue backpack. The next morning the key had disappeared, and only Peter knew that the zip of the backpack was broken.";
const REFUSE = /(non (è|e|risulta|c'è|ci sono|si sa|viene|ho|so|sono|è stato|è ancora|sappiamo|possiamo)|ancora|nessuna informazione|non spiegat|non indicat|non menzion|not (yet )?(explained|mentioned|stated|said|clear))/i;

export const QUESTIONS: Q[] = [
  { lang: "it", text: IT, question: "Chi ha perso la bicicletta?", ok: (a) => /luca/i.test(a) },
  { lang: "it", text: IT, question: "Di che colore era la bicicletta?", ok: (a) => /ross/i.test(a) },
  { lang: "it", text: IT, question: "Come si chiama il padre di Marco?", ok: (a) => REFUSE.test(a) },
  { lang: "en", text: EN, question: "Who found the old key?", ok: (a) => /anna/i.test(a) && /peter|pietro/i.test(a) },
  { lang: "en", text: EN, question: "Where did Anna keep the key?", ok: (a) => /(zaino|backpack)/i.test(a) && /(blu|blue)/i.test(a) },
  { lang: "en", text: EN, question: "Who stole the key?", ok: (a) => REFUSE.test(a) },
];

export type QualityResult = { it: number; en: number; total: number; n: number; secPerAnswer: number; at: number };
const KEY = "rc_local_scores";

export function savedScores(): Record<string, QualityResult> {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}") as Record<string, QualityResult>; } catch { return {}; }
}
// Voto da 1 a 10 ricavato dal test (6 su 6 = 10)
export const voteOf = (r: QualityResult) => Math.max(1, Math.round((r.total / r.n) * 10));

export async function runQualityTest(base: string, onStep: (done: number, total: number) => void): Promise<QualityResult> {
  const res: QualityResult = { it: 0, en: 0, total: 0, n: QUESTIONS.length, secPerAnswer: 0, at: Date.now() };
  const t0 = Date.now();
  for (let i = 0; i < QUESTIONS.length; i++) {
    onStep(i, QUESTIONS.length);
    const q = QUESTIONS[i];
    const { system, messages } = buildAsk("Prova", 1, q.question, [{ chapter: 1, text: q.text }], [], [], LOCAL_LIMITS);
    let answer = "";
    try { answer = await localChat(base, system, messages, 200, 0.2); } catch { answer = ""; }
    if (q.ok(answer)) { res[q.lang]++; res.total++; }
  }
  onStep(QUESTIONS.length, QUESTIONS.length);
  res.secPerAnswer = Math.round((Date.now() - t0) / QUESTIONS.length / 100) / 10;
  try { const all = savedScores(); all[base] = res; localStorage.setItem(KEY, JSON.stringify(all)); } catch { /* ignora */ }
  return res;
}
