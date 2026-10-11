import type { Work } from "@/lib/library";

// Copertina del libro; se manca ne disegna una colorata con l'iniziale del titolo
export default function Cover({ work, className = "" }: { work: Pick<Work, "title" | "cover">; className?: string }) {
  if (work.cover) return <img src={work.cover} alt="" className={`object-cover ${className}`} />;
  const hue = [...work.title].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div aria-hidden className={`flex items-center justify-center text-white ${className}`}
      style={{ background: `hsl(${hue} 35% 32%)`, fontFamily: "Georgia, serif" }}>
      <span className="text-3xl">{work.title.trim().charAt(0).toUpperCase()}</span>
    </div>
  );
}
