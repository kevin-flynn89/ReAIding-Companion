"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { listBooks, removeWork, setProgress, type BookMeta } from "@/lib/library";
import Cover from "../copertina";
import { Empty, Icon, TopBar, Wavy } from "../ui";
import { t } from "@/lib/i18n";

export default function Libreria() {
  const [works, setWorks] = useState<BookMeta[] | null>(null);
  const refresh = () => listBooks().then(setWorks);
  useEffect(() => { refresh(); }, []);

  async function setRead(w: BookMeta, n: number) {
    if (n > w.maxRead + 1 && !window.confirm(t("Segni come letti i capitoli fino al {n}.\n\nL'AI potrà usare e rivelarti tutto ciò che succede fino a lì. Confermi?", { n }))) { refresh(); return; }
    await setProgress(w.id, n, n); // imposta insieme segnalibro e limite dello Shield
    refresh();
  }
  async function elimina(w: BookMeta) {
    if (window.confirm(t("Eliminare \"{title}\" dalla libreria?", { title: w.title }))) { await removeWork(w.id); refresh(); }
  }

  return (
    <main>
      <TopBar title={t("Libreria")} sub={works ? t(works.length === 1 ? "{n} libro su questo dispositivo" : "{n} libri su questo dispositivo", { n: works.length }) : undefined}
        actions={<Link href="/aggiungi-file" aria-label={t("Aggiungi un libro")} className="fab bg-tertiary-container text-on-tertiary-container"><Icon name="add" /></Link>} />
      {works === null && <p className="mt-6 text-sm text-on-surface-variant">{t("Caricamento...")}</p>}
      {works?.length === 0 && (
        <Empty icon="book" title={t("Nessun libro")}>
          <p>{t("Aggiungi il tuo primo libro per iniziare a leggere.")}</p>
          <Link href="/aggiungi-file" className="btn btn-filled mt-6"><Icon name="add" className="h-5 w-5" />{t("Aggiungi un libro")}</Link>
        </Empty>
      )}
      <ul className="stagger mt-2 grid gap-4 md:grid-cols-2">
        {works?.map((w) => {
          const read = Math.min(w.maxRead, w.chapterCount);
          return (
            <li key={w.id} className="card flex flex-col gap-4">
              <div className="flex gap-4">
                <Cover work={w} ribbon={w.current > 1} className="h-36 w-24" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <h2 className="font-serif text-xl font-bold leading-snug">{w.title}</h2>
                  <p className="truncate text-sm text-on-surface-variant">{w.author || t("Autore non indicato")}</p>
                  <div className="mt-auto pt-3">
                    <p className="text-xs font-semibold text-on-surface-variant">{t("Capitolo {n} di {total}", { n: w.current, total: w.chapterCount })}</p>
                    <div className="mt-1"><Wavy value={w.current} max={w.chapterCount} /></div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Link href={`/lettore?id=${w.id}`} className="btn btn-filled col-span-2">{w.current > 1 ? t("Continua") : t("Inizia")}</Link>
                <Link href={`/chat?id=${w.id}`} className="btn btn-tonal btn-sm px-3 text-[13px]"><Icon name="chat" className="h-4 w-4" />{t("Chiedi all'AI")}</Link>
                <Link href={`/memoria?id=${w.id}`} className="btn btn-outlined btn-sm px-3"><Icon name="bulb" className="h-4 w-4" />{t("Memoria")}</Link>
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-outline-variant pt-3">
                <label className="flex items-center gap-2 text-sm">
                  <span className="text-on-surface-variant">{t("Ho letto fino al cap.")}</span>
                  <select value={Math.min(w.maxRead, w.chapterCount)} onChange={(e) => setRead(w, Number(e.target.value))} className="select min-h-[40px] py-1">
                    {Array.from({ length: w.chapterCount }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                  </select>
                </label>
                <button onClick={() => elimina(w)} aria-label={t("Elimina {title}", { title: w.title })} className="icon-btn text-error"><Icon name="trash" /></button>
              </div>
              <p className="flex items-start gap-2 text-xs text-on-surface-variant">
                <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0" />
                {t(read === 1 ? "Spoiler Shield: l'AI usa {read} capitolo e ne tiene nascosti {hidden}." : "Spoiler Shield: l'AI usa {read} capitoli e ne tiene nascosti {hidden}.", { read, hidden: w.chapterCount - read })}
              </p>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
