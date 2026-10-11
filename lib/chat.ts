import { get, set, del } from "idb-keyval";

export type Msg = { role: "user" | "assistant"; text: string; chapter: number; ts: number };

const key = (id: string) => `chat_${id}`;

export async function loadChat(id: string): Promise<Msg[]> { return ((await get(key(id))) as Msg[]) || []; }
export async function saveChat(id: string, msgs: Msg[]) { await set(key(id), msgs.slice(-200)); }
export async function clearChat(id: string) { await del(key(id)); }

// SPOILER SHIELD sulla cronologia: all'AI arrivano solo i messaggi scritti quando eri
// al capitolo corrente o prima. Se torni indietro, le risposte "future" restano visibili
// a te nella chat ma non vengono più inviate all'AI.
export function historyFor(msgs: Msg[], current: number, maxMessages = 6): Msg[] {
  return msgs.filter((m) => m.chapter <= current).slice(-maxMessages);
}
