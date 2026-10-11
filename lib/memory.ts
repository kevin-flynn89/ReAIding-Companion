import { get, set, del } from "idb-keyval";
import { API_URL } from "./config";
import type { Work } from "./library";

// Memoria narrativa: una "scheda" per ogni capitolo analizzato, salvata sul dispositivo.
// SPOILER SHIELD: si analizzano solo capitoli <= capitolo corrente, e quando si mostra la scheda
// si usano solo i capitoli <= capitolo corrente (anche se in passato ne hai letti di più).
export type Entry = { nome: string; descrizione: string };
export type ChapterMem = {
  n: number; personaggi: Entry[]; luoghi: Entry[]; oggetti: Entry[]; eventi: string[]; misteri: string[];
};
export type MemStore = Record<number, ChapterMem>;

const key = (id: string) => `mem_${id}`;
export async function loadMem(id: string): Promise<MemStore> { return ((await get(key(id))) as MemStore) || {}; }
export async function saveMem(id: string, m: MemStore) { await set(key(id), m); }
export async function clearMem(id: string) { await del(key(id)); }

// Un capitolo lungo viene letto a pezzi (max 4, distribuiti lungo il capitolo) per limitare la quota usata
const PIECE = 6000, MAX_PIECES = 4;
export function pieces(text: string): string[] {
  const all: string[] = [];
  for (let i = 0; i < text.length; i += PIECE) all.push(text.slice(i, i + PIECE));
  if (all.length <= MAX_PIECES) return all;
  const step = all.length / MAX_PIECES;
  return Array.from({ length: MAX_PIECES }, (_, i) => all[Math.floor(i * step)]);
}

async function callExtract(title: string, chapter: number, current: number, text: string) {
  const r = await fetch(`${API_URL}/extract`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, chapter, current, text }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || d.status !== "ok") throw new Error(d.message || "L'AI non ha risposto.");
  return d.data as Omit<ChapterMem, "n">;
}

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, "").trim();

function mergeEntries(list: Entry[]): Entry[] {
  const map = new Map<string, Entry>();
  for (const e of list) {
    const k = norm(e.nome); if (!k) continue;
    const old = map.get(k);
    if (!old) map.set(k, e);
    else if (e.descrizione.length > old.descrizione.length) map.set(k, { ...old, descrizione: e.descrizione });
  }
  return [...map.values()];
}
const uniq = (a: string[]) => [...new Map(a.map((x) => [norm(x), x] as const)).values()];

export async function analyzeChapter(work: Work, n: number, current: number): Promise<ChapterMem> {
  if (n > current) throw new Error("Capitolo oltre quello corrente."); // barriera Shield lato app
  const ch = work.chapters.find((c) => c.n === n);
  if (!ch) throw new Error("Capitolo non trovato.");
  const parts: Omit<ChapterMem, "n">[] = [];
  for (const p of pieces(ch.text)) {
    let res: Omit<ChapterMem, "n"> | null = null, err: unknown;
    for (let t = 0; t < 2 && !res; t++) {
      try { res = await callExtract(work.title, n, current, p); } catch (e) { err = e; }
    }
    if (!res) throw err instanceof Error ? err : new Error("Analisi non riuscita.");
    parts.push(res);
  }
  return {
    n,
    personaggi: mergeEntries(parts.flatMap((p) => p.personaggi)),
    luoghi: mergeEntries(parts.flatMap((p) => p.luoghi)),
    oggetti: mergeEntries(parts.flatMap((p) => p.oggetti)),
    eventi: uniq(parts.flatMap((p) => p.eventi)).slice(0, 6),
    misteri: uniq(parts.flatMap((p) => p.misteri)).slice(0, 4),
  };
}

// Analizza i capitoli letti non ancora analizzati, uno alla volta; salva dopo ogni capitolo, si può interrompere
export async function buildMemory(
  work: Work, current: number, onStatus: (s: string) => void, shouldStop: () => boolean,
): Promise<{ done: number; error?: string }> {
  const mem = await loadMem(work.id);
  const todo = work.chapters.filter((c) => c.n <= current && !mem[c.n]).map((c) => c.n);
  let done = 0;
  for (const n of todo) {
    if (shouldStop()) break;
    onStatus(`Analizzo il capitolo ${n} (${done + 1} di ${todo.length})...`);
    try {
      mem[n] = await analyzeChapter(work, n, current);
      await saveMem(work.id, mem);
      done++;
    } catch (e: any) {
      return { done, error: e?.message || "Analisi interrotta." };
    }
  }
  return { done };
}

export type Item = { nome: string; first: number; note: { n: number; testo: string }[] };
export type Card = {
  personaggi: Item[]; luoghi: Item[]; oggetti: Item[];
  eventi: { n: number; testo: string }[]; misteri: { n: number; testo: string }[];
  analizzati: number;
};

function collect(mem: MemStore, current: number, pick: (c: ChapterMem) => Entry[]): Item[] {
  const map = new Map<string, Item>();
  for (const c of Object.values(mem).filter((c) => c.n <= current).sort((a, b) => a.n - b.n)) {
    for (const e of pick(c)) {
      const k = norm(e.nome); if (!k) continue;
      const it = map.get(k) || { nome: e.nome, first: c.n, note: [] };
      if (e.descrizione) it.note.push({ n: c.n, testo: e.descrizione });
      map.set(k, it);
    }
  }
  // i più presenti (più capitoli) prima, poi per primo capitolo
  return [...map.values()].sort((a, b) => b.note.length - a.note.length || a.first - b.first);
}

// Costruisce la scheda mostrabile: SOLO capitoli <= current
export function buildCard(mem: MemStore, current: number): Card {
  const vis = Object.values(mem).filter((c) => c.n <= current).sort((a, b) => a.n - b.n);
  return {
    personaggi: collect(mem, current, (c) => c.personaggi),
    luoghi: collect(mem, current, (c) => c.luoghi),
    oggetti: collect(mem, current, (c) => c.oggetti),
    eventi: vis.flatMap((c) => c.eventi.map((testo) => ({ n: c.n, testo }))),
    misteri: vis.flatMap((c) => c.misteri.map((testo) => ({ n: c.n, testo }))),
    analizzati: vis.length,
  };
}

// --- Appunti della scheda da dare all'AI insieme ai passaggi (sempre solo capitoli <= current) ---
export type Note = { chapter: number; text: string };

export function notesFor(mem: MemStore, current: number, query: string, spread: boolean): Note[] {
  const card = buildCard(mem, current); // già filtrata dallo Spoiler Shield
  const q = " " + norm(query) + " ";
  const notes: Note[] = [];
  const add = (it: Item, tipo: string) => {
    for (const n of it.note.slice(-3)) if (n.n <= current) notes.push({ chapter: n.n, text: `${it.nome} (${tipo}): ${n.testo}`.slice(0, 280) });
  };
  const mentioned = (it: Item) => norm(it.nome).split(" ").some((w) => w.length >= 3 && q.includes(" " + w + " "));
  for (const it of card.personaggi) if (mentioned(it)) add(it, "personaggio");
  for (const it of card.luoghi) if (mentioned(it)) add(it, "luogo");
  for (const it of card.oggetti) if (mentioned(it)) add(it, "oggetto");
  if (spread) {
    card.personaggi.slice(0, 6).forEach((it) => add(it, "personaggio"));
    card.misteri.slice(-5).forEach((m) => notes.push({ chapter: m.n, text: `Domanda aperta: ${m.testo}`.slice(0, 280) }));
  } else if (/mister|segret|domande? apert|irrisolt/.test(q)) {
    card.misteri.slice(-5).forEach((m) => notes.push({ chapter: m.n, text: `Domanda aperta: ${m.testo}`.slice(0, 280) }));
  }
  const seen = new Set<string>();
  return notes.filter((n) => n.chapter <= current && !seen.has(n.text) && seen.add(n.text)).slice(0, 16);
}
