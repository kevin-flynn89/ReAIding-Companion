import { get, set } from "idb-keyval";
import type { Chunk, EmbIndex } from "./rag";

const MODEL = "Xenova/multilingual-e5-small";
let extractor: any = null;

async function load(onStatus?: (s: string) => void) {
  if (extractor) return extractor;
  const { pipeline, env } = await import("@xenova/transformers");
  env.allowLocalModels = false;
  extractor = await pipeline("feature-extraction", MODEL, {
    progress_callback: (p: any) => {
      if (p.status === "progress") onStatus?.(`Scarico il modello: ${Math.round(p.progress || 0)}%`);
    },
  });
  return extractor;
}

export async function getIndex(workId: string, count: number): Promise<EmbIndex | null> {
  const saved = (await get(`emb_${workId}`)) as (EmbIndex & { model: string }) | undefined;
  return saved && saved.model === MODEL && saved.ids.length === count ? saved : null;
}

// I calcoli avvengono sul dispositivo: nessun testo esce dal browser.
export async function buildIndex(workId: string, chunks: Chunk[], onStatus: (s: string) => void): Promise<EmbIndex> {
  const ex = await load(onStatus);
  const dim = 384, data = new Float32Array(chunks.length * dim);
  for (let i = 0; i < chunks.length; i += 8) {
    const batch = chunks.slice(i, i + 8).map((c) => "passage: " + c.text.slice(0, 1500));
    const out = await ex(batch, { pooling: "mean", normalize: true });
    data.set(out.data as Float32Array, i * dim);
    onStatus(`Analizzo il libro: ${Math.min(i + 8, chunks.length)} di ${chunks.length}`);
    await new Promise((r) => setTimeout(r, 0)); // lascia respirare l'interfaccia
  }
  const index = { model: MODEL, ids: chunks.map((c) => c.id), dim, data };
  await set(`emb_${workId}`, index);
  return index;
}

export async function embedQuery(q: string, onStatus?: (s: string) => void): Promise<Float32Array> {
  const ex = await load(onStatus);
  const out = await ex("query: " + q, { pooling: "mean", normalize: true });
  return out.data as Float32Array;
}
