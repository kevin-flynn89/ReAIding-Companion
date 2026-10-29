"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { Blob, Icon, Wordmark, type IconName, type ShapeName } from "./ui";
import { t } from "@/lib/i18n";

const KEY = "rc_onboarded";
export const onboardingDone = () => { try { return localStorage.getItem(KEY) === "1"; } catch { return true; } };
const markDone = () => { try { localStorage.setItem(KEY, "1"); } catch { /* ignora */ } };

const SLIDES: { icon: IconName; shape: ShapeName; title: string; text: string }[] = [
  { icon: "shield", shape: "cookie", title: "Leggi e chiedi, senza spoiler", text: "reAIding companion è il compagno di lettura che risponde alle tue domande sul libro usando solo ciò che hai già letto. Lo chiamiamo Spoiler Shield: l'AI non vede i capitoli che non hai ancora raggiunto." },
  { icon: "book", shape: "flower", title: "Aggiungi il tuo libro", text: "Carica un file EPUB o MOBI senza protezione DRM. Il libro resta sul tuo dispositivo: non lo carichiamo da nessuna parte. Poi leggi nell'app e il punto di lettura avanza da solo." },
  { icon: "spark", shape: "burst", title: "Collega un'AI", text: "In Opzioni hai due strade: inserire la tua chiave AI (Anthropic, OpenAI o Gemini), oppure scaricare un modello che gira sul telefono, senza chiave e senza costi. Tutto gratuito, senza account." },
];

// Guida di benvenuto in 3 schermate. Si mostra al primo avvio (libreria vuota) e si può rivedere da Aiuto.
export default function Onboarding({ onClose }: { onClose: () => void }) {
  const [i, setI] = useState(0);
  const s = SLIDES[i]; const last = i === SLIDES.length - 1;
  const chiudi = () => { markDone(); onClose(); };
  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === "Escape") chiudi(); }; window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, []);

  const [ok, setOk] = useState(false);
  useEffect(() => setOk(true), []);
  if (!ok) return null;
  // Portale su <body>: così sta sopra la barra di navigazione, qualunque sia il contenitore
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={t("Benvenuto")} className="fixed inset-0 z-[100] flex flex-col overflow-y-auto bg-surface px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <div className="flex items-center justify-between">
          <Wordmark />
          {!last && <button onClick={chiudi} className="btn btn-text btn-sm">{t("Salta")}</button>}
        </div>
        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
          <Blob icon={s.icon} shape={s.shape} tone="primary" className="h-40 w-40" iconClass="h-16 w-16" />
          <h1 className="mt-8 font-serif text-3xl font-bold leading-tight" aria-live="polite">{t(s.title)}</h1>
          <p className="mt-4 text-[17px] leading-relaxed text-on-surface-variant">{t(s.text)}</p>
        </div>
        <div className="mb-5 flex justify-center gap-2" aria-label={t("Schermata {i} di {n}", { i: i + 1, n: SLIDES.length })}>
          {SLIDES.map((_, k) => <span key={k} className={`h-2.5 rounded-full transition-all ${k === i ? "w-8 bg-primary" : "w-2.5 bg-outline-variant"}`} />)}
        </div>
        {!last ? (
          <div className="flex gap-3">
            {i > 0 && <button onClick={() => setI(i - 1)} className="btn btn-outlined flex-1"><Icon name="prev" className="h-5 w-5" />{t("Indietro")}</button>}
            <button onClick={() => setI(i + 1)} className="btn btn-filled flex-1">{t("Avanti")}<Icon name="next" className="h-5 w-5" /></button>
          </div>
        ) : (
          <div className="grid gap-3">
            <Link href="/aggiungi-file" onClick={chiudi} className="btn btn-filled"><Icon name="add" className="h-5 w-5" />{t("Aggiungi il primo libro")}</Link>
            <Link href="/impostazioni" onClick={chiudi} className="btn btn-tonal"><Icon name="spark" className="h-5 w-5" />{t("Collega un'AI")}</Link>
            <div className="flex gap-3">
              <button onClick={() => setI(i - 1)} className="btn btn-text flex-1">{t("Indietro")}</button>
              <button onClick={chiudi} className="btn btn-text flex-1">{t("Più tardi")}</button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
