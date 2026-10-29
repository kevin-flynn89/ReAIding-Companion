"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getWork, type Work } from "@/lib/library";
import { chunkWork } from "@/lib/rag";
import Conversazione from "../conversazione";
import { Empty, Icon, TopBar } from "../ui";
import { t } from "@/lib/i18n";

export default function Chat() {
  const [work, setWork] = useState<Work | null>(null);
  const [state, setState] = useState<"loading" | "missing" | "ok">("loading");

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    getWork(id).then((w) => {
      if (!w) { setState("missing"); return; }
      setWork(w); setState("ok");
    });
  }, []);

  const chunks = useMemo(() => (work ? chunkWork(work) : []), [work]);

  if (state === "loading") return <main><TopBar title={t("Chat")} back="/libreria" backLabel={t("Libreria")} /><p className="mt-4 text-sm text-on-surface-variant">{t("Caricamento...")}</p></main>;
  if (state === "missing" || !work) return (
    <main>
      <TopBar title={t("Chat")} back="/libreria" backLabel={t("Libreria")} />
      <Empty icon="chat" title={t("Libro non trovato")}><p>{t("Aprilo dalla libreria.")}</p><Link href="/libreria" className="btn btn-filled mt-6">{t("Vai alla libreria")}</Link></Empty>
    </main>
  );

  return (
    <main className="flex h-dvh flex-col pb-3">
      <TopBar title={work.title} sub={t("Chiedi all'AI · letto fino al cap. {n}", { n: work.maxRead })} back="/libreria" backLabel={t("Libreria")}
        actions={<>
          <Link href={`/memoria?id=${work.id}`} aria-label={t("Memoria narrativa")} className="icon-btn"><Icon name="bulb" /></Link>
          <Link href={`/lettore?id=${work.id}`} aria-label={t("Torna a leggere")} className="icon-btn"><Icon name="book" /></Link>
        </>} />
      <div className="mt-2 min-h-0 flex-1">
        <Conversazione work={work} current={work.maxRead} chunks={chunks} fill />
      </div>
    </main>
  );
}
