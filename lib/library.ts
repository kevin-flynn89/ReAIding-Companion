import { get, set, del } from "idb-keyval";

export type Chapter = { n: number; title: string; text: string };
export type Work = {
  id: string; title: string; author: string; kind: string; cover?: string;
  chapters: Chapter[]; current: number; createdAt: number;
};
// Scheda leggera di un libro (senza il testo): serve per aprire in fretta home e libreria
export type BookMeta = Omit<Work, "chapters"> & { chapterCount: number };

// Archivio: "rc_meta" = elenco leggero dei libri; "book_<id>" = testo di UN libro (si legge solo quando serve).
// Prima di questa versione tutti i libri stavano insieme in "rc_works": viene convertito da solo, una volta.
const OLD = "rc_works";
const META = "rc_meta";
const book = (id: string) => `book_${id}`;
const PROG = "rc_progress"; // progressi: file piccolo, così sfogliare le pagine non riscrive tutto il libro
const LAST = "rc_last";

let ready: Promise<void> | null = null;
function migrate(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      const old = (await get(OLD)) as Work[] | undefined;
      if (!old) return;
      const metas: BookMeta[] = [];
      for (const w of old) {
        await set(book(w.id), w.chapters);
        const { chapters, ...rest } = w;
        metas.push({ ...rest, chapterCount: chapters.length });
      }
      const existing = ((await get(META)) as BookMeta[]) || [];
      const ids = new Set(existing.map((m) => m.id));
      await set(META, [...existing, ...metas.filter((m) => !ids.has(m.id))]);
      await del(OLD); // solo dopo aver scritto tutto: se si interrompe, riparte da capo senza perdere nulla
    })().catch((e) => { ready = null; throw e; });
  }
  return ready;
}

async function progress(): Promise<Record<string, number>> {
  return ((await get(PROG)) as Record<string, number>) || {};
}
export async function setProgress(id: string, n: number) {
  const p = await progress(); p[id] = n; await set(PROG, p);
}
export async function setLastOpened(id: string) { await set(LAST, id); }
export async function getLastOpened(): Promise<string | null> { return ((await get(LAST)) as string) || null; }

// Elenco veloce (senza testi)
export async function listBooks(): Promise<BookMeta[]> {
  await migrate();
  const metas = ((await get(META)) as BookMeta[]) || [];
  const p = await progress();
  return metas.map((m) => ({ ...m, current: p[m.id] ?? m.current }));
}
// Un libro completo, con il testo
export async function getWork(id: string | null): Promise<Work | null> {
  if (!id) return null;
  const meta = (await listBooks()).find((m) => m.id === id);
  if (!meta) return null;
  const chapters = ((await get(book(id))) as Chapter[]) || [];
  const { chapterCount, ...rest } = meta;
  return { ...rest, chapters };
}
export async function saveWork(w: Work) {
  await migrate();
  await set(book(w.id), w.chapters);
  const { chapters, ...rest } = w;
  const all = (((await get(META)) as BookMeta[]) || []).filter((x) => x.id !== w.id);
  await set(META, [{ ...rest, chapterCount: chapters.length }, ...all]);
  await setProgress(w.id, w.current);
}
export async function removeWork(id: string) {
  await migrate();
  await set(META, (((await get(META)) as BookMeta[]) || []).filter((x) => x.id !== id));
  const p = await progress(); delete p[id]; await set(PROG, p);
  await del(book(id));
  await del(`emb_${id}`);
  await del(`chat_${id}`);
  await del(`mem_${id}`);
}
export async function clearAll() { await del(OLD); await del(META); await del(PROG); await del(LAST); }
