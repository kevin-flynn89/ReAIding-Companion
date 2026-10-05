import JSZip from "jszip";
import { initMobiFile, initKf8File } from "@lingo-reader/mobi-parser";
import type { Chapter } from "./library";

export type Parsed = { title: string; author: string; chapters: Chapter[] };

const clean = (s: string) => s.replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n[ \t]+/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

function htmlToText(html: string): { text: string; head?: string } {
  const doc = new DOMParser().parseFromString(html.replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div|h[1-6]|li|tr)>/gi, "$&\n"), "text/html");
  const head = doc.querySelector("h1, h2, h3")?.textContent?.trim();
  return { text: clean(doc.body?.textContent || ""), head };
}

// Se il libro arriva in un unico blocco, lo divide cercando "Capitolo N"; altrimenti per lunghezza
function splitText(raw: string): Chapter[] {
  const text = clean(raw);
  const re = /^\s*((?:cap[ií]tulo|capitolo|chapter|parte)\s+[\dIVXLC]+[^\n]{0,60})$/gim;
  const marks: { i: number; t: string }[] = [];
  for (const m of text.matchAll(re)) marks.push({ i: m.index ?? 0, t: m[1].trim() });
  if (marks.length >= 2)
    return marks.map((m, k) => ({ n: k + 1, title: m.t, text: text.slice(m.i, k + 1 < marks.length ? marks[k + 1].i : undefined) }));
  const words = text.split(/\s+/), out: Chapter[] = [];
  for (let i = 0, n = 1; i < words.length; i += 4000, n++)
    out.push({ n, title: "Sezione " + n, text: words.slice(i, i + 4000).join(" ") });
  return out;
}

function finalize(items: { text: string; head?: string }[]): Chapter[] {
  const kept = items.filter((x) => x.text.length >= 300);
  if (kept.length >= 2) return kept.map((x, k) => ({ n: k + 1, title: x.head || "Capitolo " + (k + 1), text: x.text }));
  return splitText(kept.map((x) => x.text).join("\n\n"));
}

export async function parseEpub(file: File): Promise<Parsed> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const read = async (p: string) => (await zip.file(p)?.async("string")) || "";
  const xml = (s: string) => new DOMParser().parseFromString(s, "application/xml");

  const opfPath = xml(await read("META-INF/container.xml")).querySelector("rootfile")?.getAttribute("full-path") || "";
  const opf = xml(await read(opfPath));
  const base = opfPath.includes("/") ? opfPath.slice(0, opfPath.lastIndexOf("/") + 1) : "";
  const title = opf.getElementsByTagName("dc:title")[0]?.textContent?.trim() || file.name.replace(/\.epub$/i, "");
  const author = opf.getElementsByTagName("dc:creator")[0]?.textContent?.trim() || "";

  const manifest: Record<string, string> = {};
  Array.from(opf.getElementsByTagName("item")).forEach((it) => { manifest[it.getAttribute("id") || ""] = it.getAttribute("href") || ""; });

  const items: { text: string; head?: string }[] = [];
  for (const ref of Array.from(opf.getElementsByTagName("itemref"))) {
    const href = manifest[ref.getAttribute("idref") || ""];
    if (href) items.push(htmlToText(await read(base + decodeURIComponent(href))));
  }
  return { title, author, chapters: finalize(items) };
}

// MOBI / AZW3 (senza DRM). I file protetti da DRM non vengono letti: non aggiro le protezioni.
export async function parseMobi(file: File): Promise<Parsed> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let book: any;
  try { book = await initMobiFile(bytes); } catch { book = await initKf8File(bytes); }
  const meta = book.getMetadata();
  const items: { text: string; head?: string }[] = [];
  for (const ch of book.getSpine()) {
    const loaded = book.loadChapter(ch.id);
    if (loaded?.html) items.push(htmlToText(loaded.html));
  }
  const author = Array.isArray(meta.author) ? meta.author.join(", ") : meta.author || "";
  book.destroy?.();
  return { title: meta.title || file.name.replace(/\.[^.]+$/, ""), author, chapters: finalize(items) };
}
