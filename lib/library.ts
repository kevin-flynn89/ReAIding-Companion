import { get, set, del } from "idb-keyval";

export type Chapter = { n: number; title: string; text: string };
export type Work = {
  id: string; title: string; author: string; kind: string;
  chapters: Chapter[]; current: number; createdAt: number;
};

const KEY = "rc_works";

export async function listWorks(): Promise<Work[]> {
  return ((await get(KEY)) as Work[]) || [];
}
export async function saveWork(w: Work) {
  const all = (await listWorks()).filter((x) => x.id !== w.id);
  await set(KEY, [w, ...all]);
}
export async function removeWork(id: string) {
  await set(KEY, (await listWorks()).filter((x) => x.id !== id));
}
export async function clearAll() { await del(KEY); }
