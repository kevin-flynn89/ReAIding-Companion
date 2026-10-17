// Istruzioni inviate all'AI (prima stavano nel backend). Lo Spoiler Shield è applicato qui, prima di ogni invio.
export type Passage = { chapter: number; text: string };
export type Note = { chapter: number; text: string };
export type HistoryItem = { role: "user" | "assistant"; content: string; chapter: number };

export const ASK_SYSTEM = (title: string, chapter: number) =>
  `Sei un compagno di lettura. Il lettore sta leggendo "${title}" ed è arrivato al capitolo ${chapter}.
REGOLE:
1. Rispondi usando SOLO i passaggi (ed eventuali appunti) forniti dall'utente. Non usare nessuna conoscenza esterna sul libro, anche se lo conosci: potrebbe contenere eventi di capitoli che il lettore non ha ancora letto.
2. Non anticipare né suggerire cosa succederà dopo.
3. Se i passaggi non bastano per rispondere, dillo chiaramente: "Fino al punto in cui sei arrivato questo non è ancora stato spiegato", e riporta solo quello che i passaggi dicono davvero.
4. Rispondi in italiano, in modo chiaro e discorsivo, in poche frasi. Più i passaggi contengono dettagli, più la risposta può essere dettagliata.
5. Può esserci una conversazione precedente: serve a capire a cosa si riferisce la domanda (per esempio "lui", "e dopo?"). Per i fatti usa i passaggi forniti e quanto già detto nella conversazione.
6. Possono esserci APPUNTI DELLA SCHEDA: sintesi di capitoli già letti create da un'AI. Usali per completare la risposta, ma se contraddicono i passaggi, valgono i passaggi.`;

export function buildAsk(title: string, current: number, question: string, passages: Passage[], history: HistoryItem[], notes: Note[]) {
  // Barriere Spoiler Shield: nulla oltre il capitolo corrente
  if (passages.some((p) => !(p.chapter <= current)) || history.some((m) => !(m.chapter <= current)) || notes.some((n) => !(n.chapter <= current))) {
    throw new Error("Contenuto oltre il capitolo corrente: richiesta bloccata dallo Spoiler Shield.");
  }
  const q = question.slice(0, 500).trim();
  const pass = passages.slice(0, 14);
  const nts = notes.slice(0, 16);
  const noteText = nts.length ? "APPUNTI DELLA SCHEDA:\n" + nts.map((n) => `- (cap. ${n.chapter}) ${n.text.slice(0, 300)}`).join("\n") + "\n\n" : "";
  let used = 0;
  const context = pass.map((p, i) => {
    const t = p.text.slice(0, 1200); used += t.length;
    return used > 14000 ? "" : `[Passaggio ${i + 1} - capitolo ${p.chapter}]\n${t}`;
  }).filter(Boolean).join("\n\n");
  return {
    system: ASK_SYSTEM(title.slice(0, 120), current),
    messages: [
      ...history.slice(-6).map((m) => ({ role: m.role, content: m.content.slice(0, 900) })),
      { role: "user" as const, content: `${noteText}PASSAGGI:\n${context || "(nessuno)"}\n\nDOMANDA: ${q}` },
    ],
  };
}

// --- Memoria narrativa ---
export const EXTRACT_SYSTEM = (title: string) =>
  `Sei un assistente che prepara la scheda di un libro. Leggi il brano di "${title}" e rispondi SOLO con un oggetto JSON valido, senza testo prima o dopo, in italiano, con questa forma:
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
