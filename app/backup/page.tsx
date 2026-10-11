"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { listWorks, type Work } from "@/lib/library";
import { backupName, importBackup, makeBackup } from "@/lib/backup";

export default function Backup() {
  const [works, setWorks] = useState<Work[] | null>(null);
  const [sel, setSel] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { listWorks().then((w) => { setWorks(w); setSel(w.map((x) => x.id)); }); }, []);

  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  async function esporta(condividi: boolean) {
    setBusy(true); setMsg(null);
    try {
      const blob = await makeBackup(sel);
      const file = new File([blob], backupName(), { type: "application/json" });
      const nav = navigator as Navigator & { canShare?: (d: any) => boolean };
      if (condividi && nav.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: "Backup AI Reading Companion" });
          setMsg({ ok: true, text: "Backup condiviso. Salvalo in un posto sicuro (es. Drive)." });
        } catch (e: any) {
          if (e?.name !== "AbortError") throw e; // annullato dall'utente: nessun errore
        }
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = file.name; document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
        setMsg({ ok: true, text: `File "${file.name}" scaricato nella cartella Download.` });
      }
    } catch (e: any) {
      setMsg({ ok: false, text: e?.message || "Non sono riuscito a creare il backup." });
    } finally { setBusy(false); }
  }

  async function importa(f: File | undefined) {
    if (!f) return;
    setBusy(true); setMsg(null);
    try {
      const r = await importBackup(f);
      setWorks(await listWorks());
      const parts = [];
      if (r.added) parts.push(`${r.added} libri aggiunti`);
      if (r.updated) parts.push(`${r.updated} già presenti (progresso e chat uniti)`);
      if (r.skipped) parts.push(`${r.skipped} non validi, saltati`);
      setMsg({ ok: true, text: parts.join(", ") || "Il file non contiene libri." });
    } catch (e: any) {
      setMsg({ ok: false, text: e?.message || "Importazione non riuscita." });
    } finally { setBusy(false); if (fileRef.current) fileRef.current.value = ""; }
  }

  const btn = "w-full rounded px-4 py-4 text-base font-semibold disabled:opacity-50";

  return (
    <main>
      <Link href="/" className="text-sm text-segnalibro">Torna alla home</Link>
      <h1 className="mt-3 text-2xl font-bold">Backup e trasferimento</h1>
      <p className="mt-2 text-sm">Salva i tuoi libri, il punto di lettura e le chat in un file. Con lo stesso file puoi portarli su un altro dispositivo o ripristinarli.</p>

      {msg && (
        <p role="status" className={`mt-4 rounded p-3 text-sm ${msg.ok ? "bg-white text-inchiostro" : "bg-red-100 text-red-900"}`}>{msg.text}</p>
      )}

      <section className="mt-6 bg-white p-4">
        <h2 className="text-lg font-bold">Salva un backup</h2>
        {works === null && <p className="mt-2 text-sm">Caricamento...</p>}
        {works !== null && works.length === 0 && <p className="mt-2 text-sm">Non hai ancora libri da salvare.</p>}
        {works !== null && works.length > 0 && (
          <>
            <ul className="mt-3 space-y-1">
              {works.map((w) => (
                <li key={w.id}>
                  <label className="flex min-h-[44px] items-center gap-3 text-sm">
                    <input type="checkbox" className="h-5 w-5" checked={sel.includes(w.id)} onChange={() => toggle(w.id)} />
                    <span className="min-w-0 flex-1 truncate">{w.title}</span>
                  </label>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-3">
              <button disabled={busy || sel.length === 0} onClick={() => esporta(true)} className={`${btn} bg-segnalibro text-white`}>
                {busy ? "Attendi..." : "Condividi / salva backup"}
              </button>
              <button disabled={busy || sel.length === 0} onClick={() => esporta(false)} className={`${btn} border border-segnalibro text-segnalibro`}>
                Scarica come file
              </button>
            </div>
            <p className="mt-3 text-xs">Nel menu di condivisione scegli Drive, WhatsApp, Telegram, email... Non include l'indice della "ricerca avanzata": si rigenera da solo.</p>
          </>
        )}
      </section>

      <section className="mt-6 bg-white p-4">
        <h2 className="text-lg font-bold">Ripristina da un backup</h2>
        <p className="mt-2 text-sm">Scegli il file .json salvato. I libri nuovi vengono aggiunti; quelli già presenti non vengono sovrascritti (si tiene il capitolo più avanzato e si uniscono le chat).</p>
        <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={(e) => importa(e.target.files?.[0])} />
        <button disabled={busy} onClick={() => fileRef.current?.click()} className={`${btn} mt-4 border border-segnalibro text-segnalibro`}>
          Scegli il file di backup
        </button>
      </section>
    </main>
  );
}
