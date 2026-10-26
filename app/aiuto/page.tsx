import Link from "next/link";
import { TopBar } from "../ui";

const faq: { q: string; a: React.ReactNode }[] = [
  { q: "Come funziona reAIding companion?", a: <>Aggiungi un libro (EPUB o MOBI senza protezione DRM), leggilo qui e ogni tanto fai una domanda all'AI. L'app sa fino a che capitolo sei arrivato e usa <b>solo quella parte del libro</b> per rispondere: è lo Spoiler Shield. Il libro resta sul tuo dispositivo.</> },
  { q: "Cosa devo fare per usare l'AI?", a: <>Hai due strade, entrambe in <Link href="/impostazioni" className="font-semibold text-primary underline">Opzioni</Link>. <b>1) Chiave personale:</b> crei una chiave sul sito di un provider (Anthropic, OpenAI, Google Gemini o altro compatibile) e la incolli nell'app. <b>2) Sul dispositivo:</b> scarichi un piccolo modello che gira sul telefono, senza chiave e senza costi. È più lento e meno preciso.</> },
  { q: "Come ottengo una chiave?", a: <>Si crea sul sito del provider, con il tuo account: <a className="font-semibold text-primary underline" href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">Google Gemini</a>, <a className="font-semibold text-primary underline" href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer">Anthropic</a>, <a className="font-semibold text-primary underline" href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer">OpenAI</a>. Poi la incolli in Opzioni e premi "Salva e prova". Condizioni e costi dipendono da ogni provider: controlla il suo sito. La chiave resta solo sul tuo dispositivo.</> },
  { q: "Quanto costa l'app?", a: <>L'app è gratuita. Se usi una chiave personale, l'eventuale costo è quello del tuo provider. Con il modello sul dispositivo non c'è nessun costo.</> },
  { q: "Cosa significa «Fino al punto in cui sei arrivato questo non è ancora stato spiegato»?", a: <>L'AI non ha trovato la risposta nei capitoli che hai letto, e per evitare spoiler non guarda oltre. Se vai avanti nella lettura, la stessa domanda potrà avere risposta.</> },
  { q: "Come dico all'app fin dove ho letto?", a: <>Leggendo nell'app il capitolo avanza da solo. In <Link href="/libreria" className="font-semibold text-primary underline">Libreria</Link> puoi scegliere "Ho letto fino al capitolo…". Se salti in avanti, l'app ti chiede conferma, perché da lì in poi l'AI potrà rivelarti quei capitoli. Se torni indietro a rileggere, il limite non si abbassa.</> },
  { q: "Cos'è la memoria narrativa?", a: <>Una scheda con personaggi, luoghi, oggetti, eventi e misteri dei capitoli letti, costruita dall'AI capitolo per capitolo. Serve a ricordare la storia e rende le risposte migliori. Richiede un'AI esterna (con chiave): il modello sul dispositivo è troppo piccolo.</> },
  { q: "La prima volta l'app «analizza il libro»: è normale?", a: <>Sì. La prima volta scarica un piccolo modello di ricerca e prepara il libro fino al capitolo letto. Può richiedere un po' (meglio con il Wi‑Fi) e si può interrompere: riparte da dove era arrivata.</> },
  { q: "Dove sono i miei libri e le mie chat?", a: <>Sul tuo dispositivo, nel browser. Per averli su più dispositivi usa <Link href="/backup" className="font-semibold text-primary underline">Backup</Link>: puoi sincronizzare con il tuo Google Drive (cartella nascosta dell'app) oppure scaricare un file di backup e ricaricarlo su un altro dispositivo. La chiave AI non viene mai salvata nei backup.</> },
  { q: "Posso aprire libri comprati con protezione DRM?", a: <>No. L'app apre solo file senza DRM, e non serve a rimuoverlo. Usa libri che possiedi legittimamente o liberi da diritti.</> },
  { q: "L'AI non risponde o dà errore. Cosa faccio?", a: <>Vai in <Link href="/impostazioni" className="font-semibold text-primary underline">Opzioni</Link> e premi "Salva e prova": il messaggio ti dice cosa non va (chiave sbagliata, credito finito, modello non trovato, rete). Se il nome del modello è sbagliato, svuota il campo: l'app sceglie da sola.</> },
  { q: "Come installo l'app sul telefono?", a: <>Apri il sito con Chrome, tocca il menu (i tre puntini) e scegli "Installa app" o "Aggiungi a schermata Home". Poi si apre come una normale app, anche senza connessione per i libri già aggiunti.</> },
];

export default function Aiuto() {
  return (
    <main>
      <TopBar title="Aiuto" sub="Le domande più frequenti" back="/" backLabel="Torna alla home" />
      <div className="mt-4 space-y-2">
        {faq.map((f) => (
          <details key={f.q} className="card group">
            <summary className="cursor-pointer list-none text-[15px] font-bold leading-snug">{f.q}</summary>
            <div className="mt-2 text-[15px] leading-relaxed text-on-surface-variant">{f.a}</div>
          </details>
        ))}
      </div>
      <p className="mt-6 text-sm"><Link href="/?guida=1" className="font-semibold text-primary underline">Rivedi la guida di benvenuto</Link></p>
      <p className="mt-3 text-sm text-on-surface-variant">Non trovi la risposta? Leggi anche <Link href="/privacy" className="font-semibold text-primary underline">Privacy</Link> e <Link href="/condizioni" className="font-semibold text-primary underline">Condizioni d'uso</Link>.</p>
    </main>
  );
}
