"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getLastOpened, listBooks, type BookMeta } from "@/lib/library";
import Cover from "./copertina";
import { InstallButton } from "./pwa";
import Onboarding, { onboardingDone } from "./onboarding";
import { useAiReady } from "@/lib/aiconfig";
import { Blob, Empty, Icon, ShapeBg, TopBar, Wavy, Wordmark } from "./ui";
import { t } from "@/lib/i18n";

const saluto = () => { const h = new Date().getHours(); return h < 6 ? t("Buona notte") : h < 13 ? t("Buongiorno") : h < 19 ? t("Buon pomeriggio") : t("Buonasera"); };

export default function Home() {
  const [works, setWorks] = useState<BookMeta[] | null>(null);
  const [last, setLast] = useState<string | null>(null);
  const ready = useAiReady();
  const [guida, setGuida] = useState(false);

  useEffect(() => {
    getLastOpened().then(setLast);
    listBooks().then((w) => {
      setWorks(w);
      // Guida di benvenuto: primo avvio con libreria vuota, oppure richiesta da Aiuto (?guida=1)
      const richiesta = new URLSearchParams(window.location.search).get("guida") === "1";
      if (richiesta || (w.length === 0 && !onboardingDone())) setGuida(true);
    });
  }, []);

  const cont = works?.find((w) => w.id === last) ?? works?.[0];
  const others = (works || []).filter((w) => w.id !== cont?.id).slice(0, 10);

  return (
    <main>
      {guida && <Onboarding onClose={() => setGuida(false)} />}
      <TopBar title={<Wordmark />} sub={`${saluto()}! ${t("Leggi, e chiedi senza spoiler.")}`} />

      {ready === false && (
        <Link href="/impostazioni" className="card card-lift mb-4 flex items-center gap-4 bg-tertiary-container text-on-tertiary-container">
          <Blob icon="spark" shape="burst" tone="solid" className="h-14 w-14" />
          <span><span className="block text-lg font-bold">{t("Collega la tua AI")}</span><span className="block text-sm">{t("Usa la tua chiave oppure scarica un modello sul telefono, per fare domande.")}</span></span>
        </Link>
      )}

      {works === null && <p className="mt-6 text-sm text-on-surface-variant">{t("Caricamento...")}</p>}

      {works !== null && !cont && (
        <Empty icon="book" title={t("La tua libreria è vuota")}>
          <p>{t("Aggiungi un libro EPUB o MOBI senza protezione DRM. Resta sul tuo dispositivo.")}</p>
          <ol className="mt-5 space-y-2 text-left text-sm">
            <li className="flex gap-3"><span className="font-bold text-primary">1.</span><span>{t("Aggiungi il tuo primo libro.")}</span></li>
            <li className="flex gap-3"><span className="font-bold text-primary">2.</span><span>{t("Collega un'AI in Opzioni: la tua chiave oppure un modello sul telefono.")}</span></li>
            <li className="flex gap-3"><span className="font-bold text-primary">3.</span><span>{t("Leggi e chiedi: l'AI non ti fa spoiler.")}</span></li>
          </ol>
          <Link href="/aggiungi-file" className="btn btn-filled mt-6"><Icon name="add" className="h-5 w-5" />{t("Aggiungi un libro")}</Link>
        </Empty>
      )}

      {cont && (
        <section aria-labelledby="cont" className="on-container relative mt-2 overflow-hidden rounded-[40px] bg-primary-container p-6 text-on-primary-container md:p-8">
          <ShapeBg shape="cookie" className="pointer-events-none absolute -right-14 -top-14 h-48 w-48 rotate-12 text-tertiary-container opacity-60 dark:opacity-30" />
          <ShapeBg shape="flower" className="pointer-events-none absolute -bottom-16 -left-10 h-44 w-44 text-secondary-container opacity-50" />
          <h2 id="cont" className="relative text-sm font-bold uppercase tracking-wider opacity-80">{t("Continua a leggere")}</h2>
          <div className="relative mt-4 flex gap-5">
            <Cover work={cont} ribbon={cont.current > 1} className="h-44 w-[7.5rem] md:h-52 md:w-36" />
            <div className="flex min-w-0 flex-1 flex-col">
              <p className="font-serif text-[1.7rem] font-bold leading-[1.1]">{cont.title}</p>
              <p className="mt-1 truncate text-sm opacity-80">{cont.author || t("Autore non indicato")}</p>
              <div className="mt-auto pt-4">
                <p className="mb-1 text-xs font-bold">{t("Capitolo {n} di {total}", { n: cont.current, total: cont.chapterCount })}</p>
                <Wavy value={cont.current} max={cont.chapterCount} label={t("Avanzamento nel libro")} />
              </div>
            </div>
          </div>
          <div className="relative mt-6 flex flex-wrap gap-3">
            <Link href={`/lettore?id=${cont.id}`} className="btn btn-filled flex-1 whitespace-nowrap px-4 sm:flex-none">{cont.current > 1 ? t("Continua") : t("Inizia a leggere")}</Link>
            <Link href={`/chat?id=${cont.id}`} className="btn btn-tonal flex-1 whitespace-nowrap px-4 sm:flex-none"><Icon name="chat" className="h-5 w-5" />{t("Chiedi all'AI")}</Link>
          </div>
        </section>
      )}

      {others.length > 0 && (
        <section aria-labelledby="altri" className="mt-8">
          <h2 id="altri" className="px-1 text-xl font-bold">{t("Altri libri")}</h2>
          <ul className="-mx-4 mt-3 flex gap-4 overflow-x-auto px-4 pb-2 md:-mx-8 md:px-8">
            {others.map((w) => (
              <li key={w.id} className="w-28 shrink-0">
                <Link href={`/lettore?id=${w.id}`} className="card-lift block rounded-2xl focus-visible:outline-offset-4">
                  <Cover work={w} ribbon={w.current > 1} className="h-40 w-28" />
                  <p className="mt-2 line-clamp-2 text-sm font-medium leading-snug">{w.title}</p>
                  <div className="progress mt-2"><span style={{ width: `${Math.round((w.current / Math.max(1, w.chapterCount)) * 100)}%` }} /></div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {cont && (
        <section className="stagger mt-8 grid gap-3 sm:grid-cols-2">
          <Link href={`/memoria?id=${cont.id}`} className="card card-lift flex items-center gap-4 hover:bg-surface-high">
            <Blob icon="bulb" shape="burst" tone="tertiary" className="h-14 w-14" />
            <span><span className="block text-lg font-bold">{t("Memoria narrativa")}</span><span className="block text-sm text-on-surface-variant">{t("Personaggi, luoghi e misteri finora")}</span></span>
          </Link>
          <Link href="/aggiungi-file" className="card card-lift flex items-center gap-4 hover:bg-surface-high">
            <Blob icon="add" shape="clover" tone="primary" className="h-14 w-14" />
            <span><span className="block text-lg font-bold">{t("Aggiungi un libro")}</span><span className="block text-sm text-on-surface-variant">{t("File EPUB o MOBI")}</span></span>
          </Link>
        </section>
      )}

      <InstallButton />
      <p className="mt-8 text-center text-sm"><Link href="/aiuto" className="font-semibold text-primary underline">{t("Come funziona? Aiuto")}</Link></p>
    </main>
  );
}
