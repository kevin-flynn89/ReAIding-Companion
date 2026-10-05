"use client";
import { useState } from "react";
import Link from "next/link";
import { parseEpub, parseTxt, type Parsed } from "@/lib/parsers";
import { saveWork } from "@/lib/library";

export default function AggiungiFile() {
  const [p, setP] = useState<Parsed | null>(null);
  const [kind, setKind] = useState("libro");
  const [msg, setMsg] = useState("");
  const [saved, setSaved] = useState(false);

  async function onFile(f: File | undefined) {
    if (!f) return;
    setMsg("Lettura in corso..."); setP(null); setSaved(false);
    try {
      const name = f.name.toLowerCase();
      if (name.endsWith(".epub")) setP(await parseEpub(f));
      else if (name.endsWith(".txt")) setP(parseTxt(await f.text(), f.name));
      else { setMsg("Per ora sono supportati EPUB e TXT. Il PDF arriva al prossimo passo."); return; }
      setMsg("");
    } catch {
      setMsg("Non sono riuscito a leggere questo file.");
    }
  }

  async function salva() {
    if (!p) return;
    await saveWork({ id: crypto.randomUUID(), title: p.title, author: p.author, kind, chapters: p.chapters, current: 1, createdAt: Date.now() });
    setSaved(true);
  }

  return (
    <main>
      <Link href="/" className="text-sm text-segnalibro">Torna alla home</Link>
      <h1 className="mt-3 text-3xl font-bold">Aggiungi da file</h1>
      <p className="mt-2 text-sm">Scegli un file EPUB o TXT. Resta sul tuo dispositivo.</p>
      <input type="file" accept=".epub,.txt" onChange={(e) => onFile(e.target.files?.[0])} className="mt-4 block w-full text-sm" />
      {msg && <p className="mt-4 text-sm">{msg}</p>}
      {p && (
        <section className="mt-6 bg-white p-4">
          <h2 className="text-xl font-bold">{p.title}</h2>
          <p className="text-sm">{p.author || "Autore non trovato"} · {p.chapters.length} capitoli</p>
          <label className="mt-3 block text-sm">Tipo
            <select value={kind} onChange={(e) => setKind(e.target.value)} className="ml-2 border p-1">
              <option>libro</option><option>manga</option><option>manhwa</option><option>fumetto</option><option>light novel</option>
            </select>
          </label>
          <ul className="mt-3 max-h-40 overflow-auto text-sm">
            {p.chapters.slice(0, 30).map((c) => <li key={c.n} className="py-0.5">{c.n}. {c.title.slice(0, 50)}</li>)}
          </ul>
          {p.chapters.length === 0 && <p className="mt-2 text-sm">Nessun testo trovato nel file.</p>}
          <button onClick={salva} disabled={saved || p.chapters.length === 0}
            className="mt-4 rounded bg-segnalibro px-5 py-3 text-sm font-semibold text-white disabled:opacity-40">
            {saved ? "Salvato" : "Salva in libreria"}
          </button>
          {saved && <Link href="/libreria" className="ml-4 text-sm text-segnalibro">Vai alla libreria</Link>}
        </section>
      )}
    </main>
  );
}
