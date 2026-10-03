"use client";
import { useState } from "react";
import Link from "next/link";
import { API_URL } from "@/lib/config";

type Chapter = { number: number; title: string; url: string };
type Result = {
  status: string; message?: string; title?: string; author?: string; description?: string;
  cover?: string | null; domain?: string; chapterCount?: number; chapters?: Chapter[];
};

export default function Importa() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<Result | null>(null);

  async function analizza() {
    setLoading(true); setRes(null);
    try {
      const r = await fetch(`${API_URL}/import?url=${encodeURIComponent(url)}`);
      setRes(await r.json());
    } catch {
      setRes({ status: "error", message: "Impossibile contattare il backend. Controlla l'indirizzo in lib/config.ts." });
    }
    setLoading(false);
  }

  return (
    <main>
      <Link href="/" className="text-sm text-segnalibro">Torna alla home</Link>
      <h1 className="mt-3 text-3xl font-bold">Aggiungi opera da link</h1>
      <input
        value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://esempio.com/manga/nome-opera"
        className="mt-4 w-full rounded border border-inchiostro/30 bg-white p-3 text-sm"
      />
      <button onClick={analizza} disabled={!url || loading}
        className="mt-3 rounded bg-segnalibro px-5 py-3 text-sm font-semibold text-white disabled:opacity-40">
        {loading ? "Analisi in corso..." : "Analizza link"}
      </button>

      {res && res.status !== "ok" && (
        <p className="mt-5 border-l-4 border-red-500 bg-white p-3 text-sm">{res.message}</p>
      )}
      {res && res.status === "ok" && (
        <section className="mt-6 bg-white p-4">
          <div className="flex gap-3">
            {res.cover && <img src={res.cover} alt="" className="h-28 w-20 object-cover" />}
            <div>
              <h2 className="text-xl font-bold">{res.title}</h2>
              <p className="text-sm">{res.author || "Autore non trovato"} · {res.domain}</p>
            </div>
          </div>
          {res.description && <p className="mt-3 text-sm">{res.description}</p>}
          <p className="mt-3 text-sm font-semibold">Capitoli trovati: {res.chapterCount}</p>
          <ul className="mt-2 max-h-48 overflow-auto text-sm">
            {res.chapters?.slice(0, 50).map((c) => <li key={c.url} className="py-1">Cap. {c.number}</li>)}
          </ul>
        </section>
      )}
    </main>
  );
}
