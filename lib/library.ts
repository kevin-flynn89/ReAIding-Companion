import { get, set, del } from "idb-keyval";

export type Chapter = { n: number; title: string; text: string };
export type Work = {
  id: string; title: string; author: string; kind: string;
  chapters: Chapter[]; current: number; createdAt: number;
};

const KEY = "rc_works";
const PROG = "rc_progress"; // progressi: file piccolo, così sfogliare le pagine non riscrive tutto il libro
const LAST = "rc_last";

async function progress(): Promise<Record<string, number>> {
  return ((await get(PROG)) as Record<string, number>) || {};
}
export async function setProgress(id: string, n: number) {
  const p = await progress(); p[id] = n; await set(PROG, p);
}
export async function setLastOpened(id: string) { await set(LAST, id); }
export async function getLastOpened(): Promise<string | null> { return ((await get(LAST)) as string) || null; }

export async function listWorks(): Promise<Work[]> {
  const works = ((await get(KEY)) as Work[]) || [];
  const p = await progress();
  return works.map((w) => ({ ...w, current: p[w.id] ?? w.current }));
}
export async function saveWork(w: Work) {
  const all = (((await get(KEY)) as Work[]) || []).filter((x) => x.id !== w.id);
  await set(KEY, [w, ...all]);
  await setProgress(w.id, w.current);
}
export async function removeWork(id: string) {
  await set(KEY, (((await get(KEY)) as Work[]) || []).filter((x) => x.id !== id));
  const p = await progress(); delete p[id]; await set(PROG, p);
  await del(`emb_${id}`);
}
export async function clearAll() { await del(KEY); await del(PROG); await del(LAST); }
