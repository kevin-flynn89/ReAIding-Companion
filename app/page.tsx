"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getLastOpened, listWorks, type Work } from "@/lib/library";
import Cover from "./copertina";
import { InstallButton } from "./pwa";
import { Empty, Icon, TopBar } from "./ui";

const pct = (w: Work) => Math.round((w.current / Math.max(1, w.chapters.length)) * 100);

export default function Home() {
  const [works, setWorks] = useState<Work[] | null>(null);
  const [last, setLast] = useState<string | null>(null);

  useEffect(() => { listWorks().then(setWorks); getLastOpened().then(setLast); }, []);

  const cont = works?.find((w) => w.id === last) ?? works?.[0];
  const others = (works || []).filter((w) => w.id !== cont?.id).slice(0, 10);

  return (
    <main>
      <TopBar title="Reading AI" sub="Leggi, e chiedi senza spoiler" />

      {works === null && <p className="mt-6 text-sm text-on-surface-variant">Caricamento...</p>}

      {works !== null && !cont && (
        <Empty icon="book" title="La tua libreria è vuota">
          <p>Aggiungi un libro EPUB o MOBI senza protezione DRM. Resta sul tuo dispositivo.</p>
          <Link href="/aggiungi-file" className="btn btn-filled mt-6"><Icon name="add" className="h-5 w-5" />Aggiungi un libro</Link>
        </Empty>
      )}

      {cont && (
        <section aria-labelledby="cont" className="mt-2 overflow-hidden rounded-[28px] bg-primary-container p-5 text-on-primary-container md:p-6">
          <h2 id="cont" className="text-sm font-medium opacity-80">Continua a leggere</h2>
          <div className="mt-3 flex gap-5">
            <Cover work={cont} ribbon={cont.current > 1} className="h-44 w-[7.5rem] md:h-52 md:w-36" />
            <div className="flex min-w-0 flex-1 flex-col">
              <p className="font-serif text-2xl font-semibold leading-tight">{cont.title}</p>
              <p className="mt-1 truncate text-sm opacity-80">{cont.author || "Autore non indicato"}</p>
              <div className="mt-auto pt-4">
                <p className="text-xs font-medium">Capitolo {cont.current} di {cont.chapters.length}</p>
                <div className="progress mt-2" role="progressbar" aria-valuenow={cont.current} aria-valuemin={1} aria-valuemax={cont.chapters.length}><span style={{ width: `${pct(cont)}%` }} /></div>
              </div>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={`/lettore?id=${cont.id}`} className="btn btn-filled flex-1 whitespace-nowrap px-4 sm:flex-none">{cont.current > 1 ? "Continua" : "Inizia a leggere"}</Link>
            <Link href={`/chat?id=${cont.id}`} className="btn flex-1 whitespace-nowrap border border-on-primary-container/40 px-4 text-on-primary-container hover:bg-on-primary-container/10 sm:flex-none"><Icon name="chat" className="h-5 w-5" />Chiedi all'AI</Link>
          </div>
        </section>
      )}

      {others.length > 0 && (
        <section aria-labelledby="altri" className="mt-8">
          <h2 id="altri" className="px-1 text-base font-semibold">Altri libri</h2>
          <ul className="-mx-4 mt-3 flex gap-4 overflow-x-auto px-4 pb-2 md:-mx-8 md:px-8">
            {others.map((w) => (
              <li key={w.id} className="w-28 shrink-0">
                <Link href={`/lettore?id=${w.id}`} className="block rounded-xl focus-visible:outline-offset-4">
                  <Cover work={w} ribbon={w.current > 1} className="h-40 w-28" />
                  <p className="mt-2 line-clamp-2 text-sm font-medium leading-snug">{w.title}</p>
                  <div className="progress mt-2"><span style={{ width: `${pct(w)}%` }} /></div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {cont && (
        <section className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link href={`/memoria?id=${cont.id}`} className="card flex items-center gap-4 transition hover:bg-surface-high">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-tertiary-container text-on-tertiary-container"><Icon name="bulb" /></span>
            <span><span className="block font-medium">Memoria narrativa</span><span className="block text-sm text-on-surface-variant">Personaggi, luoghi e misteri finora</span></span>
          </Link>
          <Link href="/aggiungi-file" className="card flex items-center gap-4 transition hover:bg-surface-high">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container"><Icon name="add" /></span>
            <span><span className="block font-medium">Aggiungi un libro</span><span className="block text-sm text-on-surface-variant">File EPUB o MOBI</span></span>
          </Link>
        </section>
      )}

      <InstallButton />
      <p className="mt-8 text-center text-xs text-on-surface-variant"><Link href="/domande" className="underline">Prova le domande</Link> (strumento di test)</p>
    </main>
  );
}
