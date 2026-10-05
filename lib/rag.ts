import type { Work } from "./library";

export type Chunk = { id: string; chapter: number; text: string };
export type Hit = Chunk & { score: number };

const STOP = new Set(("il lo la i gli le un uno una di a da in con su per tra fra e ed o ma che chi cui non si ne ci mi ti vi era sono ha ho hanno " +
  "del dello della dei degli delle al allo alla ai agli alle dal dallo dalla dai dagli dalle nel nello nella nei negli nelle sul sullo sulla sui sugli sulle " +
  "come piu anche perche quando dove quale quali questo questa questi queste quello quella lui lei loro suo sua suoi sue " +
  "the an of to and is was it that for on with as at by he she they his her their").split(" "));

// Normalizza accenti, toglie parole comuni, accorcia le parole lunghe (litigato/litigio -> litig)
export function tokenize(s: string): string[] {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/[^a-z0-9]+/)
    .filter((w) => w.length > 1 && !STOP.has(w))
    .map((w) => (w.length > 5 ? w.slice(0, 5) : w));
}

// Divide ogni capitolo in frammenti di circa 140 parole, senza mai mescolare capitoli diversi
export function chunkWork(w: Work, target = 140): Chunk[] {
  const out: Chunk[] = [];
  for (const ch of w.chapters) {
    let buf: string[] = [], words = 0, k = 0;
    const flush = () => { if (buf.length) { out.push({ id: `${ch.n}-${k++}`, chapter: ch.n, text: buf.join("\n") }); buf = []; words = 0; } };
    for (const p of ch.text.split(/\n+/).map((x) => x.trim()).filter(Boolean)) {
      const wc = p.split(/\s+/).length;
      if (wc > target * 2) {
        flush();
        let cur: string[] = [], cw = 0;
        for (const s of p.match(/[^.!?…]+[.!?…]*\s*/g) || [p]) {
          const n = s.split(/\s+/).length;
          if (cw + n > target && cur.length) { buf = [cur.join(" ").trim()]; flush(); cur = []; cw = 0; }
          cur.push(s); cw += n;
        }
        if (cur.length) { buf = [cur.join(" ").trim()]; flush(); }
      } else {
        if (words + wc > target) flush();
        buf.push(p); words += wc;
      }
    }
    flush();
  }
  return out;
}

// SPOILER SHIELD: unico punto in cui si decide cosa l'AI può vedere.
export function applyShield(chunks: Chunk[], currentChapter: number): Chunk[] {
  return chunks.filter((c) => c.chapter <= currentChapter);
}

// Ricerca BM25 eseguita SOLO sui frammenti già filtrati (anche le statistiche escludono i capitoli nascosti)
export function search(chunks: Chunk[], query: string, currentChapter: number, k = 5) {
  const visible = applyShield(chunks, currentChapter);
  const q = [...new Set(tokenize(query))];
  const docs = visible.map((c) => tokenize(c.text));
  const N = docs.length || 1;
  const avg = docs.reduce((s, d) => s + d.length, 0) / N || 1;
  const df = new Map<string, number>();
  for (const d of docs) for (const t of new Set(d)) df.set(t, (df.get(t) || 0) + 1);
  const k1 = 1.4, b = 0.75;
  const hits: Hit[] = visible.map((c, i) => {
    const tf = new Map<string, number>();
    docs[i].forEach((t) => tf.set(t, (tf.get(t) || 0) + 1));
    let score = 0;
    for (const t of q) {
      const f = tf.get(t); if (!f) continue;
      const n = df.get(t) || 0;
      score += Math.log(1 + (N - n + 0.5) / (n + 0.5)) * (f * (k1 + 1)) / (f + k1 * (1 - b + b * docs[i].length / avg));
    }
    return { ...c, score };
  }).filter((h) => h.score > 0).sort((a, b2) => b2.score - a.score).slice(0, k);
  return { hits, visible: visible.length, hidden: chunks.length - visible.length };
}
