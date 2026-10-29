// Istruzioni inviate all'AI (prima stavano nel backend). Lo Spoiler Shield è applicato qui, prima di ogni invio.
export type Passage = { chapter: number; text: string };
export type Note = { chapter: number; text: string };
export type HistoryItem = { role: "user" | "assistant"; content: string; chapter: number };

export const ASK_SYSTEM = (title: string, chapter: number) =>
  `You are a reading companion. The reader is reading "${title}" and has reached chapter ${chapter}.
RULES:
1. Answer using ONLY the PASSAGES (and any NOTES) provided by the user. Do not use any outside knowledge about the book, even if you know it: it may contain events from chapters the reader has not read yet.
2. Never hint at or anticipate what happens later.
3. If the passages are not enough to answer, say so clearly, in the language of the question. For example in Italian: "Fino al punto in cui sei arrivato questo non è ancora stato spiegato"; in English: "Up to where you have read, this has not been explained yet". Then report only what the passages really say.
4. LANGUAGE: always answer in the same language as the reader's QUESTION, even if the book or the passages are in another language. Be clear and conversational, in a few sentences. The more detail the passages contain, the more detailed the answer can be.
5. There may be a previous conversation: it helps you understand what the question refers to (for example "he", "and then?"). For facts, use the passages provided and what was already said in the conversation.
6. There may be NOTES FROM THE BOOK SHEET: summaries of chapters already read, created by an AI. Use them to complete the answer, but if they contradict the passages, the passages win.`;

// "lim": limiti più stretti per i modelli sul dispositivo (contesto di soli 4096 token)
export type AskLimits = { pass: number; chars: number; total: number; notes: number; hist: number };
export const DEFAULT_LIMITS: AskLimits = { pass: 14, chars: 1200, total: 14000, notes: 16, hist: 6 };
export const LOCAL_LIMITS: AskLimits = { pass: 4, chars: 700, total: 2800, notes: 5, hist: 2 };

export function buildAsk(title: string, current: number, question: string, passages: Passage[], history: HistoryItem[], notes: Note[], lim: AskLimits = DEFAULT_LIMITS) {
  // Barriere Spoiler Shield: nulla oltre il capitolo corrente
  if (passages.some((p) => !(p.chapter <= current)) || history.some((m) => !(m.chapter <= current)) || notes.some((n) => !(n.chapter <= current))) {
    throw new Error("Contenuto oltre il capitolo corrente: richiesta bloccata dallo Spoiler Shield.");
  }
  const q = question.slice(0, 500).trim();
  const pass = passages.slice(0, lim.pass);
  const nts = notes.slice(0, lim.notes);
  const noteText = nts.length ? "NOTES FROM THE BOOK SHEET:\n" + nts.map((n) => `- (ch. ${n.chapter}) ${n.text.slice(0, 300)}`).join("\n") + "\n\n" : "";
  let used = 0;
  const context = pass.map((p, i) => {
    const t = p.text.slice(0, lim.chars); used += t.length;
    return used > lim.total ? "" : `[Passage ${i + 1} - chapter ${p.chapter}]\n${t}`;
  }).filter(Boolean).join("\n\n");
  return {
    system: ASK_SYSTEM(title.slice(0, 120), current),
    messages: [
      ...history.slice(-lim.hist).map((m) => ({ role: m.role, content: m.content.slice(0, 600) })),
      { role: "user" as const, content: `${noteText}PASSAGES:\n${context || "(none)"}\n\nQUESTION: ${q}` },
    ],
  };
}

// --- Memoria narrativa ---
export const EXTRACT_SYSTEM = (title: string) =>
  `Sei un assistente che prepara la scheda di un libro. Leggi il brano di "${title}" e rispondi SOLO con un oggetto JSON valido, senza testo prima o dopo, con questa forma (le chiavi JSON restano ESATTAMENTE in italiano; i testi dentro scrivili nella stessa lingua del brano):
{"personaggi":[{"nome":"","descrizione":""}],"luoghi":[{"nome":"","descrizione":""}],"oggetti":[{"nome":"","descrizione":""}],"eventi":[""],"misteri":[""]}
REGOLE:
1. Usa SOLO ciò che è scritto nel brano. Nessuna conoscenza esterna sul libro.
2. "descrizione": una frase breve su cosa il brano dice di quel personaggio/luogo/oggetto.
3. "eventi": i fatti principali accaduti nel brano (max 5, una frase ciascuno).
4. "misteri": domande rimaste aperte o segreti emersi nel brano (max 3). Se non ce ne sono, lascia la lista vuota.
5. Max 8 personaggi, 5 luoghi, 5 oggetti. Includi solo ciò che conta davvero. Liste vuote se non c'è nulla.`;

type Entry = { nome: string; descrizione: string };
export type Extracted = { personaggi: Entry[]; luoghi: Entry[]; oggetti: Entry[]; eventi: string[]; misteri: string[] };

function cleanEntries(arr: any, max: number): Entry[] {
  return (Array.isArray(arr) ? arr : []).slice(0, max).map((x) => {
    if (!x || typeof x !== "object") return null;
    const nome = String(x.nome || "").trim().slice(0, 80);
    return nome ? { nome, descrizione: String(x.descrizione || "").trim().slice(0, 240) } : null;
  }).filter(Boolean) as Entry[];
}
function cleanStrings(arr: any, max: number): string[] {
  return (Array.isArray(arr) ? arr : []).slice(0, max).map((x) => String(x || "").trim().slice(0, 300)).filter(Boolean);
}
export function cleanExtracted(d: any): Extracted {
  return { personaggi: cleanEntries(d.personaggi, 8), luoghi: cleanEntries(d.luoghi, 5), oggetti: cleanEntries(d.oggetti, 5), eventi: cleanStrings(d.eventi, 5), misteri: cleanStrings(d.misteri, 3) };
}

// Legge la risposta dell'AI: testo con ```json, oppure un JSON tagliato a metà (lo ripara)
export function parseLoose(resp: unknown): any | null {
  if (resp && typeof resp === "object") return resp;
  const t = String(resp || "");
  const i = t.indexOf("{");
  if (i < 0) return null;
  const body = t.slice(i);
  const j = body.lastIndexOf("}");
  try { return JSON.parse(body.slice(0, j + 1)); } catch { /* prova a riparare */ }
  const close = (str: string) => {
    const stack: string[] = []; let inStr = false, esc = false;
    for (const ch of str) {
      if (inStr) { if (esc) esc = false; else if (ch === "\\") esc = true; else if (ch === '"') inStr = false; continue; }
      if (ch === '"') inStr = true;
      else if (ch === "{") stack.push("}");
      else if (ch === "[") stack.push("]");
      else if (ch === "}" || ch === "]") stack.pop();
    }
    if (inStr) return null;
    try { return JSON.parse(str.replace(/,\s*$/, "") + stack.reverse().join("")); } catch { return null; }
  };
  let cut = body.length;
  for (let k = 0; k < 40 && cut > 0; k++) {
    const r = close(body.slice(0, cut));
    if (r) return r;
    cut = Math.max(body.lastIndexOf("}", cut - 2), body.lastIndexOf("]", cut - 2));
    if (cut < 0) break;
    cut += 1;
  }
  return null;
}
