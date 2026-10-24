import { chat } from "./llm";
import { buildAsk, DEFAULT_LIMITS, LOCAL_LIMITS, type HistoryItem, type Passage } from "./prompts";
import { activeProfile } from "./aiconfig";
import { applyShield, type Chunk } from "./rag";

export type { Passage, HistoryItem };

// Per "Riassumi fin qui": prende frammenti distribuiti su tutti i capitoli letti (mai oltre il corrente)
export function sampleSpread(chunks: Chunk[], current: number, max = 12): Chunk[] {
  const vis = applyShield(chunks, current);
  if (vis.length <= max) return vis;
  const step = vis.length / max;
  return Array.from({ length: max }, (_, i) => vis[Math.floor(i * step)]);
}

export async function askAI(
  title: string, current: number, question: string, passages: Passage[], history: HistoryItem[] = [], notes: { chapter: number; text: string }[] = [],
): Promise<string> {
  // Barriere lato app: niente passaggi, cronologia o appunti oltre il capitolo corrente
  const local = activeProfile().provider === "local";
  const lim = local ? LOCAL_LIMITS : DEFAULT_LIMITS;
  const safe = passages.filter((p) => p.chapter <= current).slice(0, lim.pass).sort((a, b) => a.chapter - b.chapter);
  const hist = history.filter((m) => m.chapter <= current);
  const safeNotes = notes.filter((n) => n.chapter <= current);
  const { system, messages } = buildAsk(title, current, question, safe, hist, safeNotes, lim);
  return chat({ system, messages, maxTokens: local ? 400 : 500, temperature: 0.2 });
}
