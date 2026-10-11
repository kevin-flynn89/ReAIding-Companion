import type { Work } from "./library";
import { search, searchHybrid, type Chunk } from "./rag";
import { embedQuery, getIndex } from "./embed";
import { askAI, sampleSpread } from "./ask";

// Recupera i passaggi (sempre filtrati dallo Spoiler Shield) e chiede la risposta all'AI.
export async function answer(work: Work, chunks: Chunk[], current: number, question: string, spread = false): Promise<string> {
  let hits: { chapter: number; text: string }[];
  if (spread) {
    hits = sampleSpread(chunks, current);
  } else {
    const idx = await getIndex(work.id);
    let r = null as ReturnType<typeof search> | null;
    if (idx && idx.ids.length > 0) {
      try { r = searchHybrid(chunks, question, current, await embedQuery(question), idx, 8); } catch { r = null; }
    }
    hits = (r || search(chunks, question, current, 8)).hits;
  }
  if (hits.length === 0) return "Fino al punto in cui sei arrivato non ho trovato nulla su questo: potrebbe non essere ancora stato spiegato.";
  return askAI(work.title, current, question, hits);
}
