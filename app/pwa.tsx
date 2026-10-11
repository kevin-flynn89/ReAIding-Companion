"use client";
import { useEffect, useState } from "react";

const base = process.env.NEXT_PUBLIC_BASE_PATH || "";

// Registra il service worker (uso offline)
export function RegisterSW() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register(`${base}/sw.js`, { scope: `${base}/` }).catch(() => {});
    }
  }, []);
  return null;
}

// Pulsante "Installa l'app" (Android/Chrome); su iPhone mostra le istruzioni
export function InstallButton() {
  const [ev, setEv] = useState<any>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone;
    if (standalone) { setInstalled(true); return; }
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    const onPrompt = (e: Event) => { e.preventDefault(); setEv(e); };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, []);

  if (installed) return null;
  if (ev) return (
    <button onClick={async () => { ev.prompt(); await ev.userChoice; setEv(null); }}
      className="mt-4 rounded border border-segnalibro px-4 py-2 text-sm font-semibold text-segnalibro">
      Installa l'app
    </button>
  );
  if (ios) return <p className="mt-4 text-xs">Per installarla: tocca Condividi, poi "Aggiungi alla schermata Home".</p>;
  return null;
}
