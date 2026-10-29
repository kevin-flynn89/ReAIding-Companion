"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getWork, type Work } from "@/lib/library";
import { Empty, Icon, TopBar, AiChip } from "../ui";
import { buildCard, buildMemory, clearMem, loadMem, type Card, type Item, type MemStore } from "@/lib/memory";
import { t } from "@/lib/i18n";

type Tab = "personaggi" | "luoghi" | "oggetti" | "misteri" | "eventi";
const TABS: { id: Tab; label: string }[] = [
  { id: "personaggi", label: "Personaggi" }, { id: "luoghi", label: "Luoghi" }, { id: "oggetti", label: "Oggetti" },
  { id: "misteri", label: "Misteri" }, { id: "eventi", label: "Eventi" },
]; // le etichette si traducono al momento di mostrarle

export default function Memoria() {
  const [work, setWork] = useState<Work | null>(null);
  const [state, setState] = useState<"loading" | "missing" | "ok">("loading");
  const [mem, setMem] = useState<MemStore>({});
  const [tab, setTab] = useState<Tab>("personaggi");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const stop = useRef(false);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    getWork(id).then(async (w) => {
      if (!w) { setState("missing"); return; }
      setWork(w); setMem(await loadMem(w.id)); setState("ok");
    });
  }, []);

  if (state === "loading") return <main><TopBar title={t("Memoria")} back="/libreria" backLabel={t("Libreria")} /><p className="mt-4 text-sm text-on-surface-variant">{t("Caricamento...")}</p></main>;
  if (state === "missing" || !work) return (
    <main>
      <TopBar title={t("Memoria")} back="/libreria" backLabel={t("Libreria")} />
      <Empty icon="bulb" title={t("Libro non trovato")}><p>{t("Aprilo dalla libreria.")}</p><Link href="/libreria" className="btn btn-filled mt-6">{t("Vai alla libreria")}</Link></Empty>
    </main>
  );

  const current = work.maxRead; // limite Spoiler Shield: fin dove hai letto
  const card: Card = buildCard(mem, current); // SOLO capitoli <= capitolo corrente
  const missing = work.chapters.filter((c) => c.n <= current && !mem[c.n]).length;

  async function aggiorna() {
    if (!work) return;
    stop.current = false; setBusy(true); setError(""); setStatus("");
    const r = await buildMemory(work, current, setStatus, () => stop.current);
    setMem(await loadMem(work.id));
    if (r.error) setError(r.error + " " + t("I capitoli già analizzati sono stati salvati: puoi riprovare più tardi."));
    setStatus(stop.current ? t("Interrotto. Quello fatto è salvato.") : r.error ? "" : t("Fatto: {n} capitoli analizzati.", { n: r.done }));
    setBusy(false);
  }
  async function azzera() {
    if (!work || !window.confirm(t("Cancellare la memoria narrativa di questo libro? Dovrai rianalizzare i capitoli."))) return;
    await clearMem(work.id); setMem({}); setStatus("");
  }

  const list = (items: Item[], vuoto: string) =>
    items.length === 0 ? <p className="mt-4 text-sm text-on-surface-variant">{vuoto}</p> : (
      <ul className="mt-3 space-y-3">
        {items.map((it) => (
          <li key={it.nome} className="card">
            <p className="font-semibold">{it.nome} <span className="ml-1 text-xs font-normal text-on-surface-variant">{t("dal cap. {n}", { n: it.first })}</span></p>
            <ul className="mt-1 space-y-1 text-sm">
              {it.note.slice(-3).map((n, i) => <li key={i}><span className="text-xs text-on-surface-variant">{t("Cap. {n}", { n: n.n })}</span> {n.testo}</li>)}
            </ul>
          </li>
        ))}
      </ul>
    );

  const lineList = (items: { n: number; testo: string }[], vuoto: string) =>
    items.length === 0 ? <p className="mt-4 text-sm text-on-surface-variant">{vuoto}</p> : (
      <ul className="mt-3 space-y-2">
        {items.map((e, i) => <li key={i} className="card py-3 text-sm"><span className="text-xs font-semibold text-primary">{t("Cap. {n}", { n: e.n })}</span><br />{e.testo}</li>)}
      </ul>
    );

  return (
    <main>
      <TopBar title={t("Memoria")} sub={work.title} back="/libreria" backLabel={t("Libreria")}
        actions={<Link href={`/lettore?id=${work.id}`} aria-label={t("Torna a leggere")} className="icon-btn"><Icon name="book" /></Link>} />
      <p className="banner mt-2 flex items-start gap-3">
        <Icon name="shield" className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <span>{t("Hai letto fino al capitolo {n} di {total}. La scheda mostra solo ciò che hai letto fino a qui: il resto resta nascosto.", { n: current, total: work.chapters.length })}</span>
      </p>

      <div className="mt-4 space-y-3">
        {!busy ? (
          <button onClick={aggiorna} disabled={missing === 0} className="btn btn-filled w-full">
            <Icon name="spark" className="h-5 w-5" />{missing === 0 ? t("Memoria aggiornata") : t(missing === 1 ? "Aggiorna memoria ({n} capitolo)" : "Aggiorna memoria ({n} capitoli)", { n: missing })}
          </button>
        ) : (
          <button onClick={() => { stop.current = true; }} className="btn btn-outlined w-full">{t("Ferma")}</button>
        )}
        {busy && <div className="progress" aria-hidden><span className="animate-pulse" style={{ width: "100%" }} /></div>}
        <AiChip />
        {status && <p role="status" className="text-sm text-on-surface-variant">{status}</p>}
        {error && <p role="alert" className="banner-error">{error}</p>}
      </div>

      <div className="-mx-1 mt-6 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist">
        {TABS.map((tb) => (
          <button key={tb.id} role="tab" aria-selected={tab === tb.id} onClick={() => setTab(tb.id)} className="chip">{t(tb.label)}</button>
        ))}
      </div>

      {card.analizzati === 0 ? (
        <p className="mt-4 text-sm text-on-surface-variant">{t("Nessun capitolo analizzato. Premi \"Aggiorna memoria\" per costruire la scheda dai capitoli che hai letto.")}</p>
      ) : (
        <>
          {tab === "personaggi" && list(card.personaggi, t("Nessun personaggio trovato finora."))}
          {tab === "luoghi" && list(card.luoghi, t("Nessun luogo trovato finora."))}
          {tab === "oggetti" && list(card.oggetti, t("Nessun oggetto importante trovato finora."))}
          {tab === "misteri" && (
            <>
              <p className="mt-3 text-xs text-on-surface-variant">{t("Domande aperte emerse nei capitoli letti. Alcune potrebbero essere già risolte più avanti nel tuo percorso di lettura.")}</p>
              {lineList(card.misteri, t("Nessun mistero aperto finora."))}
            </>
          )}
          {tab === "eventi" && lineList(card.eventi, t("Nessun evento registrato finora."))}
        </>
      )}

      {card.analizzati > 0 && <button onClick={azzera} className="btn btn-danger btn-sm mt-6"><Icon name="trash" className="h-4 w-4" />{t("Cancella la memoria di questo libro")}</button>}
      <p className="mt-4 text-xs text-on-surface-variant">{t("Le schede sono create dall'AI e possono contenere errori o omissioni. Anche la chat le usa per rispondere meglio (sempre solo fino al capitolo {n}).", { n: current })}</p>
    </main>
  );
}
