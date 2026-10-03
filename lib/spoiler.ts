// SPOILER SHIELD: il filtro si applica PRIMA che i testi arrivino all'AI.
export type Chunk = { id: number; chapter: number; text: string };

export function applySpoilerShield(chunks: Chunk[], currentChapter: number): Chunk[] {
  return chunks.filter((c) => c.chapter <= currentChapter);
}

// Dati demo (verranno sostituiti da Supabase)
export const demoChunks: Chunk[] = [
  { id: 1, chapter: 1, text: "Marco e Luca sono amici d'infanzia e vivono nello stesso quartiere." },
  { id: 2, chapter: 3, text: "Luca nasconde a Marco una lettera trovata in soffitta." },
  { id: 3, chapter: 5, text: "Marco scopre la lettera e litiga con Luca." },
  { id: 4, chapter: 9, text: "Il contenuto della lettera rivela il vero motivo del litigio." },
];
