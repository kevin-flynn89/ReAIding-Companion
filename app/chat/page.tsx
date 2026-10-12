"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { listWorks, type Work } from "@/lib/library";
import { chunkWork } from "@/lib/rag";
import Conversazione from "../conversazione";
import { Empty, Icon, TopBar } from "../ui";

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

  if (state === "loading") return <main><TopBar title="Chat" back="/libreria" backLabel="Libreria" /><p className="mt-4 text-sm text-on-surface-variant">Caricamento...</p></main>;
  if (state === "missing" || !work) return (
    <main>
      <TopBar title="Chat" back="/libreria" backLabel="Libreria" />
      <Empty icon="chat" title="Libro non trovato"><p>Aprilo dalla libreria.</p><Link href="/libreria" className="btn btn-filled mt-6">Vai alla libreria</Link></Empty>
    </main>
  );

  return (
    <main className="flex h-dvh flex-col pb-3">
      <TopBar title={work.title} sub={`Chiedi all'AI · sei al capitolo ${work.current}`} back="/libreria" backLabel="Libreria"
        actions={<>
          <Link href={`/memoria?id=${work.id}`} aria-label="Memoria narrativa" className="icon-btn"><Icon name="bulb" /></Link>
          <Link href={`/lettore?id=${work.id}`} aria-label="Torna a leggere" className="icon-btn"><Icon name="book" /></Link>
        </>} />
      <div className="mt-2 min-h-0 flex-1">
        <Conversazione work={work} current={work.current} chunks={chunks} fill />
      </div>
    </main>
  );
}
