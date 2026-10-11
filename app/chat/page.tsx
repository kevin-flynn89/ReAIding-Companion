"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { listWorks, type Work } from "@/lib/library";
import { chunkWork } from "@/lib/rag";
import Conversazione from "../conversazione";

export default function Chat() {
  const [work, setWork] = useState<Work | null>(null);
  const [state, setState] = useState<"loading" | "missing" | "ok">("loading");

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    listWorks().then((ws) => {
      const w = ws.find((x) => x.id === id);
      if (!w) { setState("missing"); return; }
      setWork(w); setState("ok");
    });
  }, []);

  const chunks = useMemo(() => (work ? chunkWork(work) : []), [work]);

  if (state === "loading") return <main><p className="text-sm">Caricamento...</p></main>;
  if (state === "missing" || !work) return (
    <main>
      <Link href="/libreria" className="text-sm text-segnalibro">Vai alla libreria</Link>
      <p className="mt-4 text-sm">Libro non trovato. Aprilo dalla libreria.</p>
    </main>
  );

  return (
    <main>
      <Link href="/libreria" className="text-sm text-segnalibro">Libreria</Link>
      <h1 className="mt-3 text-2xl font-bold leading-snug">{work.title}</h1>
      <p className="text-xs">Sei al capitolo {work.current} di {work.chapters.length} ·{" "}
        <Link href={`/lettore?id=${work.id}`} className="text-segnalibro">Torna a leggere</Link></p>
      <div className="mt-4 bg-white p-3">
        <Conversazione work={work} current={work.current} chunks={chunks} maxHeight="60vh" />
      </div>
    </main>
  );
}
