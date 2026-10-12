"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { listWorks, removeWork, saveWork, type Work } from "@/lib/library";
import Cover from "../copertina";
import { Empty, Icon, TopBar } from "../ui";

export default function Libreria() {
  const [works, setWorks] = useState<Work[] | null>(null);
  const refresh = () => listWorks().then(setWorks);
  useEffect(() => { refresh(); }, []);

  async function setCurrent(w: Work, n: number) { await saveWork({ ...w, current: n }); refresh(); }
  async function elimina(w: Work) {
    if (window.confirm(`Eliminare "${w.title}" dalla libreria?`)) { await removeWork(w.id); refresh(); }
  }

  return (
    <main>
      <TopBar title="Libreria" sub={works ? `${works.length} ${works.length === 1 ? "libro" : "libri"} su questo dispositivo` : undefined}
        actions={<Link href="/aggiungi-file" aria-label="Aggiungi un libro" className="icon-btn text-primary"><Icon name="add" /></Link>} />
      {works === null && <p className="mt-6 text-sm text-on-surface-variant">Caricamento...</p>}
      {works?.length === 0 && (
        <Empty icon="book" title="Nessun libro">
          <p>Aggiungi il tuo primo libro per iniziare a leggere.</p>
          <Link href="/aggiungi-file" className="btn btn-filled mt-6"><Icon name="add" className="h-5 w-5" />Aggiungi un libro</Link>
        </Empty>
      )}
      <ul className="mt-2 grid gap-4 md:grid-cols-2">
        {works?.map((w) => {
          const read = w.chapters.filter((c) => c.n <= w.current).length;
          return (
            <li key={w.id} className="card flex flex-col gap-4">
              <div className="flex gap-4">
                <Cover work={w} ribbon={w.current > 1} className="h-36 w-24" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <h2 className="font-serif text-lg font-semibold leading-snug">{w.title}</h2>
                  <p className="truncate text-sm text-on-surface-variant">{w.author || "Autore non indicato"}</p>
                  <div className="mt-auto pt-3">
                    <p className="text-xs text-on-surface-variant">Capitolo {w.current} di {w.chapters.length}</p>
                    <div className="progress mt-1.5"><span style={{ width: `${Math.round((w.current / Math.max(1, w.chapters.length)) * 100)}%` }} /></div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Link href={`/lettore?id=${w.id}`} className="btn btn-filled btn-sm col-span-2">{w.current > 1 ? "Continua" : "Inizia"}</Link>
                <Link href={`/chat?id=${w.id}`} className="btn btn-tonal btn-sm px-3"><Icon name="chat" className="h-4 w-4" />Chiedi all'AI</Link>
                <Link href={`/memoria?id=${w.id}`} className="btn btn-outlined btn-sm px-3"><Icon name="bulb" className="h-4 w-4" />Memoria</Link>
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-outline-variant pt-3">
                <label className="flex items-center gap-2 text-sm">
                  <span className="text-on-surface-variant">Sono al cap.</span>
                  <select value={w.current} onChange={(e) => setCurrent(w, Number(e.target.value))} className="select min-h-[40px] py-1">
                    {w.chapters.map((c) => <option key={c.n} value={c.n}>{c.n}</option>)}
                  </select>
                </label>
                <button onClick={() => elimina(w)} aria-label={`Elimina ${w.title}`} className="icon-btn text-error"><Icon name="trash" /></button>
              </div>
              <p className="flex items-start gap-2 text-xs text-on-surface-variant">
                <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0" />
                Spoiler Shield: l'AI usa {read} {read === 1 ? "capitolo" : "capitoli"} e ne tiene nascosti {w.chapters.length - read}.
              </p>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
