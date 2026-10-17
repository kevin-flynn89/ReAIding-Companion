import { API_URL } from "./config";
import { addUsage, looksLikeQuotaError, markExhausted, COST_ASK } from "./quota";
import { applyShield, type Chunk } from "./rag";

export type Passage = { chapter: number; text: string };
export type HistoryItem = { role: "user" | "assistant"; content: string; chapter: number };

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
  // Barriere lato app: niente passaggi né cronologia oltre il capitolo corrente
  const safe = passages.filter((p) => p.chapter <= current).sort((a, b) => a.chapter - b.chapter);
  const hist = history.filter((m) => m.chapter <= current).slice(-6);
  const safeNotes = notes.filter((n) => n.chapter <= current).slice(0, 16);
  const r = await fetch(`${API_URL}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title, chapter: current, question,
      passages: safe.map((p) => ({ chapter: p.chapter, text: p.text.slice(0, 1200) })),
      notes: safeNotes,
      history: hist.map((m) => ({ role: m.role, content: m.content.slice(0, 900), chapter: m.chapter })),
    }),
  });
  const d = await r.json().catch(() => ({}));
  if (d.status === "ok") { addUsage(COST_ASK); return d.answer as string; }
  const msg = d.message || "Errore di comunicazione con il backend.";
  if (looksLikeQuotaError(msg)) markExhausted();
  throw new Error(msg);
}
