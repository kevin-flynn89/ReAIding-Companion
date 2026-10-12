"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { listWorks, type Work } from "@/lib/library";
import { Icon, TopBar } from "../ui";
import { backupName, importBackup, makeBackup } from "@/lib/backup";

export default function Backup() {
  const [works, setWorks] = useState<Work[] | null>(null);
  const [sel, setSel] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { listWorks().then((w) => { setWorks(w); setSel(w.map((x) => x.id)); }); }, []);

  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  async function scarica() {
    setBusy(true); setMsg(null);
    try {
      const blob = await makeBackup(sel);
      const name = backupName();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      setMsg({ ok: true, text: `File "${name}" scaricato nella cartella Download.` });
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

  return (
    <main>
      <TopBar title="Backup" sub="Salva e trasferisci i tuoi libri" back="/" backLabel="Torna alla home" />
      <p className="mt-2 text-sm text-on-surface-variant">Salva libri, punto di lettura, chat e memoria in un file. Con lo stesso file li porti su un altro dispositivo o li ripristini.</p>

      {msg && <p role="status" className={`mt-4 ${msg.ok ? "banner" : "banner-error"}`}>{msg.text}</p>}

      <section className="card mt-6">
        <h2 className="text-lg font-semibold">Salva un backup</h2>
        {works === null && <p className="mt-2 text-sm text-on-surface-variant">Caricamento...</p>}
        {works !== null && works.length === 0 && <p className="mt-2 text-sm text-on-surface-variant">Non hai ancora libri da salvare.</p>}
        {works !== null && works.length > 0 && (
          <>
            <ul className="mt-2">
              {works.map((w) => (
                <li key={w.id}>
                  <label className="flex min-h-[48px] cursor-pointer items-center gap-4 rounded-xl px-1 text-[15px] hover:bg-on-surface/5">
                    <input type="checkbox" className="h-5 w-5 accent-[rgb(var(--c-primary))]" checked={sel.includes(w.id)} onChange={() => toggle(w.id)} />
                    <span className="min-w-0 flex-1 truncate">{w.title}</span>
                  </label>
                </li>
              ))}
            </ul>
            <button disabled={busy || sel.length === 0} onClick={scarica} className="btn btn-filled mt-4 w-full">
              <Icon name="download" className="h-5 w-5" />{busy ? "Attendi..." : "Scarica backup"}
            </button>
            <p className="mt-3 text-xs text-on-surface-variant">Il file finisce nella cartella Download. Non include l'indice della "ricerca avanzata": si rigenera da solo.</p>
          </>
        )}
      </section>

      <section className="card mt-4">
        <h2 className="text-lg font-semibold">Ripristina da un backup</h2>
        <p className="mt-2 text-sm text-on-surface-variant">Scegli il file .json salvato. I libri nuovi vengono aggiunti; quelli già presenti non vengono sovrascritti (si tiene il capitolo più avanzato e si uniscono le chat).</p>
        <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={(e) => importa(e.target.files?.[0])} />
        <button disabled={busy} onClick={() => fileRef.current?.click()} className="btn btn-outlined mt-4 w-full">
          <Icon name="upload" className="h-5 w-5" />Scegli il file di backup
        </button>
      </section>
    </main>
  );
}
