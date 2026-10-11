"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { listWorks, removeWork, saveWork, type Work } from "@/lib/library";

export default function Libreria() {
  const [works, setWorks] = useState<Work[]>([]);
  const refresh = () => listWorks().then(setWorks);
  useEffect(() => { refresh(); }, []);

  async function setCurrent(w: Work, n: number) { await saveWork({ ...w, current: n }); refresh(); }
  async function elimina(w: Work) {
    if (window.confirm(`Eliminare "${w.title}" dalla libreria?`)) { await removeWork(w.id); refresh(); }
  }

  return (
    <main>
      <Link href="/" className="text-sm text-segnalibro">Torna alla home</Link>
      <h1 className="mt-3 text-3xl font-bold">Libreria</h1>
      {works.length === 0 && <p className="mt-4 text-sm">Nessuna opera salvata. Aggiungine una da file.</p>}
      <ul className="mt-4 space-y-4">
        {works.map((w) => (
          <li key={w.id} className="bg-white p-4">
            <h2 className="text-lg font-bold">{w.title}</h2>
            <p className="text-sm">{w.author || "Autore non indicato"} · {w.chapters.length} capitoli</p>
            <p className="mt-2 text-xs">Sei al capitolo {w.current} di {w.chapters.length}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Link href={`/lettore?id=${w.id}`} className="rounded bg-segnalibro px-4 py-2 text-sm font-semibold text-white">
                {w.current > 1 ? "Continua a leggere" : "Inizia a leggere"}
              </Link>
              <label className="text-xs">Vai al capitolo
                <select value={w.current} onChange={(e) => setCurrent(w, Number(e.target.value))} className="ml-2 border p-1">
                  {w.chapters.map((c) => <option key={c.n} value={c.n}>{c.n}</option>)}
                </select>
              </label>
            </div>
            <p className="mt-2 text-xs">
              Spoiler Shield: l'AI può usare {w.chapters.filter((c) => c.n <= w.current).length} capitoli
              e ne tiene nascosti {w.chapters.filter((c) => c.n > w.current).length}.
            </p>
            <button onClick={() => elimina(w)} className="mt-3 text-xs text-red-600">Elimina</button>
          </li>
        ))}
      </ul>
    </main>
  );
}
