import type { Work } from "@/lib/library";

// Copertina del libro; se manca ne disegna una colorata con l'iniziale del titolo.
// "segnalibro" = piccolo nastro ambra: il libro è già iniziato.
export default function Cover({ work, className = "", ribbon = false }: { work: Pick<Work, "title" | "cover">; className?: string; ribbon?: boolean }) {
  const hue = [...work.title].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div className={`relative shrink-0 overflow-hidden rounded-2xl shadow-lg ${className}`}>
      {work.cover ? <img src={work.cover} alt="" className="h-full w-full object-cover" /> : (
        <div aria-hidden className="flex h-full w-full items-center justify-center text-white" style={{ background: `linear-gradient(160deg, hsl(${hue} 38% 38%), hsl(${(hue + 30) % 360} 40% 22%))`, fontFamily: "Georgia, serif" }}>
          <span className="text-5xl font-bold">{work.title.trim().charAt(0).toUpperCase()}</span>
        </div>
      )}
      {ribbon && <span className="ribbon" aria-hidden />}
    </div>
  );
}
