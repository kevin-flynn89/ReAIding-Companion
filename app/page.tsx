"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getLastOpened, listWorks, type Work } from "@/lib/library";
import Cover from "./copertina";
import { InstallButton } from "./pwa";

export default function Home() {
  const [works, setWorks] = useState<Work[] | null>(null);
  const [last, setLast] = useState<string | null>(null);

  useEffect(() => { listWorks().then(setWorks); getLastOpened().then(setLast); }, []);

  const cont = works?.find((w) => w.id === last) ?? works?.[0];
  const others = (works || []).filter((w) => w.id !== cont?.id).slice(0, 6);

  return (
    <main>
      <h1 className="text-3xl font-bold">AI Reading Companion</h1>
      <p className="mt-2 text-sm">Leggi, e chiedi all'AI: userà solo ciò che hai già letto.</p>

      {works === null && <p className="mt-6 text-sm">Caricamento...</p>}

      {works !== null && !cont && (
        <section className="mt-6 bg-white p-5">
          <h2 className="text-lg font-bold">Inizia da qui</h2>
          <p className="mt-2 text-sm">Aggiungi il tuo primo libro (EPUB o MOBI senza protezione DRM). Resta sul tuo dispositivo.</p>
          <Link href="/aggiungi-file" className="mt-4 inline-block rounded bg-segnalibro px-5 py-3 text-sm font-semibold text-white">Aggiungi un libro</Link>
        </section>
      )}

      {cont && (
        <section className="mt-6 bg-white p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide">Continua a leggere</h2>
          <div className="mt-3 flex gap-4">
            <Cover work={cont} className="h-36 w-24 shrink-0 rounded" />
            <div className="min-w-0">
              <p className="text-lg font-bold leading-snug">{cont.title}</p>
              <p className="text-xs">{cont.author || "Autore non indicato"}</p>
              <p className="mt-3 text-xs">Capitolo {cont.current} di {cont.chapters.length}</p>
              <div className="mt-1 h-2 w-full rounded bg-carta" role="progressbar" aria-valuenow={cont.current} aria-valuemin={1} aria-valuemax={cont.chapters.length}>
                <div className="h-2 rounded bg-segnalibro" style={{ width: `${Math.round((cont.current / cont.chapters.length) * 100)}%` }} />
              </div>
              <Link href={`/lettore?id=${cont.id}`} className="mt-4 inline-block rounded bg-segnalibro px-4 py-2 text-sm font-semibold text-white">Continua</Link>
            </div>
          </div>
        </section>
      )}

      {others.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide">Altri libri</h2>
          <ul className="mt-3 flex gap-3 overflow-x-auto pb-2">
            {others.map((w) => (
              <li key={w.id} className="w-24 shrink-0">
                <Link href={`/lettore?id=${w.id}`}>
                  <Cover work={w} className="h-36 w-24 rounded" />
                  <p className="mt-1 line-clamp-2 text-xs">{w.title}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/aggiungi-file" className="rounded border border-segnalibro px-4 py-2 text-sm font-semibold text-segnalibro">Aggiungi un libro</Link>
        <Link href="/libreria" className="rounded border border-segnalibro px-4 py-2 text-sm font-semibold text-segnalibro">Libreria</Link>
        <Link href="/backup" className="rounded border border-segnalibro px-4 py-2 text-sm font-semibold text-segnalibro">Backup</Link>
        <Link href="/domande" className="rounded border border-segnalibro px-4 py-2 text-sm font-semibold text-segnalibro">Prova le domande</Link>
      </div>
      <InstallButton />
    </main>
  );
}
