import JSZip from "jszip";
import type { Chapter } from "./library";

export type Parsed = { title: string; author: string; chapters: Chapter[] };

const clean = (s: string) => s.replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();

// TXT: cerca titoli come "Capitolo 3", "Chapter 3", "CAPÍTULO III"; altrimenti divide in sezioni
export function parseTxt(raw: string, fileName: string): Parsed {
  const text = clean(raw);
  const re = /^\s*((?:cap[ií]tulo|capitolo|chapter|parte)\s+[\dIVXLC]+[^\n]{0,60})$/gim;
  const marks: { i: number; t: string }[] = [];
  for (const m of text.matchAll(re)) marks.push({ i: m.index ?? 0, t: m[1].trim() });
  let chapters: Chapter[] = [];
  if (marks.length >= 2) {
    marks.forEach((m, k) => {
      const body = text.slice(m.i, k + 1 < marks.length ? marks[k + 1].i : undefined);
      chapters.push({ n: k + 1, title: m.t, text: body });
    });
  } else {
    const words = text.split(/\s+/);
    for (let i = 0, n = 1; i < words.length; i += 4000, n++)
      chapters.push({ n, title: "Sezione " + n, text: words.slice(i, i + 4000).join(" ") });
  }
  return { title: fileName.replace(/\.[^.]+$/, ""), author: "", chapters };
}

// EPUB: legge i file dell'indice (spine) nell'ordine di lettura
export async function parseEpub(file: File): Promise<Parsed> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const read = async (p: string) => (await zip.file(p)?.async("string")) || "";
  const dom = (s: string, t: DOMParserSupportedType = "application/xml") => new DOMParser().parseFromString(s, t);

  const container = dom(await read("META-INF/container.xml"));
  const opfPath = container.querySelector("rootfile")?.getAttribute("full-path") || "";
  const opf = dom(await read(opfPath));
  const base = opfPath.includes("/") ? opfPath.slice(0, opfPath.lastIndexOf("/") + 1) : "";

  const title = opf.getElementsByTagName("dc:title")[0]?.textContent?.trim() || file.name.replace(/\.epub$/i, "");
  const author = opf.getElementsByTagName("dc:creator")[0]?.textContent?.trim() || "";

  const manifest: Record<string, string> = {};
  Array.from(opf.getElementsByTagName("item")).forEach((it) => {
    manifest[it.getAttribute("id") || ""] = it.getAttribute("href") || "";
  });

  const chapters: Chapter[] = [];
  for (const ref of Array.from(opf.getElementsByTagName("itemref"))) {
    const href = manifest[ref.getAttribute("idref") || ""];
    if (!href) continue;
    const html = dom(await read(base + decodeURIComponent(href)), "text/html");
    const text = clean(html.body?.innerText || html.body?.textContent || "");
    if (text.length < 300) continue; // salta copertina, indice, note legali brevi
    const head = html.querySelector("h1, h2, h3, title")?.textContent?.trim();
    chapters.push({ n: chapters.length + 1, title: head || "Capitolo " + (chapters.length + 1), text });
  }
  return { title, author, chapters };
}
