"use client";
import { useState } from "react";
import Link from "next/link";
import { applySpoilerShield, demoChunks } from "@/lib/spoiler";

export default function Home() {
  const [chapter, setChapter] = useState(3);
  const visibili = applySpoilerShield(demoChunks, chapter);

  return (
    <main>
      <h1 className="text-3xl font-bold">AI Reading Companion</h1>
      <p className="mt-2 text-sm">Dimmi dove sei arrivato: l'AI userà solo ciò che hai già letto.</p>

      <Link href="/importa" className="mt-5 inline-block rounded bg-segnalibro px-5 py-3 text-sm font-semibold text-white">
        Aggiungi opera da link
      </Link>

      <div className="mt-3 flex gap-3">
        <Link href="/aggiungi-file" className="rounded border border-segnalibro px-4 py-2 text-sm font-semibold text-segnalibro">Aggiungi da file</Link>
        <Link href="/libreria" className="rounded border border-segnalibro px-4 py-2 text-sm font-semibold text-segnalibro">Libreria</Link>
      </div>

      <section className="mt-8">
        <h2 className="text-xl font-bold">Prova lo Spoiler Shield</h2>
        <label className="mt-3 block text-sm" htmlFor="cap">
          Capitolo corrente: <strong>{chapter}</strong>
        </label>
        <input
          id="cap" type="range" min={1} max={10} value={chapter}
          onChange={(e) => setChapter(Number(e.target.value))}
          className="mt-2 w-full accent-segnalibro"
        />
        <ul className="mt-4 space-y-2">
          {visibili.map((c) => (
            <li key={c.id} className="border-l-4 border-segnalibro bg-white p-3 text-sm">
              <span className="font-semibold">Cap. {c.chapter}:</span> {c.text}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs">
          {demoChunks.length - visibili.length} contenuti nascosti perché appartengono a capitoli successivi.
        </p>
      </section>
    </main>
  );
}
