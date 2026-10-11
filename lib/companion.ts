import type { Work } from "./library";
import { search, searchHybrid, type Chunk } from "./rag";
import { embedQuery, getIndex } from "./embed";
import { askAI, sampleSpread } from "./ask";
import type { Msg } from "./chat";
import { loadMem, notesFor } from "./memory";

// Recupera i passaggi (sempre filtrati dallo Spoiler Shield) e chiede la risposta all'AI.
// "history" deve essere già filtrata con historyFor().
export async function answer(
  work: Work, chunks: Chunk[], current: number, question: string, spread = false, history: Msg[] = [],
): Promise<string> {
  const items = history.map((m) => ({ role: m.role, content: m.text, chapter: m.chapter }));
  let hits: { chapter: number; text: string }[];
  let query = question;
  if (spread) {
    hits = sampleSpread(chunks, current);
  } else {
    // Domande brevi tipo "e lui che ruolo ha?": aggiungo alla ricerca la domanda precedente per capire il soggetto
    const prev = [...history].reverse().find((m) => m.role === "user");
    const short = question.trim().split(/\s+/).length <= 8;
    query = prev && short ? `${prev.text} ${question}` : question;
    const idx = await getIndex(work.id);
    let r = null as ReturnType<typeof search> | null;
    if (idx && idx.ids.length > 0) {
      try { r = searchHybrid(chunks, query, current, await embedQuery(query), idx, 8); } catch { r = null; }
    }
    hits = (r || search(chunks, query, current, 8)).hits;
  }
  // Appunti della memoria narrativa (se l'hai costruita): solo capitoli <= corrente
  let notes: { chapter: number; text: string }[] = [];
  try { notes = notesFor(await loadMem(work.id), current, query, spread); } catch { notes = []; }
  if (hits.length === 0 && notes.length === 0) return "Fino al punto in cui sei arrivato non ho trovato nulla su questo: potrebbe non essere ancora stato spiegato.";
  return askAI(work.title, current, question, hits, spread ? [] : items, notes);
}
