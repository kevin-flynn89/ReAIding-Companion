import { TopBar } from "../ui";
import { CONTACT_EMAIL, ISSUES_URL, LEGAL_UPDATED, PUBLISHER } from "@/lib/legal";

const who = PUBLISHER || "lo sviluppatore dell'app";

export default function Privacy() {
  return (
    <main>
      <TopBar title="Privacy" sub={`Aggiornata il ${LEGAL_UPDATED}`} back="/impostazioni" backLabel="Torna alle Opzioni" />
      <div className="mt-4 space-y-4 text-[15px] leading-relaxed">
        <section className="card">
          <h2 className="text-lg font-bold">In breve</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>I tuoi libri, le chat e la memoria restano sul tuo dispositivo.</li>
            <li>{who[0].toUpperCase() + who.slice(1)} non ha un server: non riceve né conserva nessun tuo dato.</li>
            <li>L'AI funziona con la chiave che inserisci tu: i passaggi del libro vanno direttamente dal tuo dispositivo al provider che hai scelto. In alternativa puoi usare un piccolo modello scaricato sul telefono: in quel caso il testo non esce dal dispositivo.</li>
            <li>La sincronizzazione con Google Drive è facoltativa e usa solo una cartella nascosta del tuo Drive.</li>
            <li>Nessuna pubblicità, nessun tracciamento, nessuna statistica d'uso.</li>
          </ul>
        </section>

        <section className="card">
          <h2 className="text-lg font-bold">Chi è il titolare</h2>
          <p className="mt-2">reAIding companion è pubblicata da {who}. L'app è gratuita e funziona nel tuo browser. Per domande sulla privacy: {CONTACT_EMAIL ? <a className="font-semibold text-primary underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> : <>apri una segnalazione su <a className="font-semibold text-primary underline" href={ISSUES_URL} target="_blank" rel="noreferrer">GitHub</a></>}.</p>
        </section>

        <section className="card">
          <h2 className="text-lg font-bold">Cosa resta sul tuo dispositivo</h2>
          <p className="mt-2">Nel browser (archivio locale) l'app salva: i libri che aggiungi (testo e copertina), il capitolo a cui sei arrivato, le conversazioni, la memoria narrativa, l'indice di ricerca e le impostazioni. La chiave API del tuo provider AI è salvata solo qui, mai nei backup e mai su Drive. Se cancelli i dati del sito dal browser, tutto questo sparisce da quel dispositivo.</p>
          <p className="mt-2">Il modello di ricerca per significato viene scaricato una volta da Hugging Face e poi gira sul tuo dispositivo: il testo dei libri non gli viene inviato.</p>
        </section>

        <section className="card">
          <h2 className="text-lg font-bold">Cosa va al provider AI</h2>
          <p className="mt-2">Quando fai una domanda, crei la memoria o chiedi un riassunto, l'app invia al provider che hai scelto (Anthropic, OpenAI, Google Gemini o un servizio compatibile) la tua domanda, brevi passaggi del libro fino al capitolo che hai letto e le ultime battute della chat. L'invio parte dal tuo dispositivo con la tua chiave, senza passare da noi. Da quel momento valgono le regole e l'informativa del provider: leggile sul suo sito, perché possono prevedere conservazione dei dati o uso per migliorare i servizi. I costi, se ci sono, sono tra te e il provider.</p>
        </section>

        <section className="card">
          <h2 className="text-lg font-bold">AI sul dispositivo (facoltativa)</h2>
          <p className="mt-2">Se scegli "Sul dispositivo" nelle Opzioni, l'app scarica un piccolo modello di linguaggio (da huggingface.co, più un file di funzionamento da raw.githubusercontent.com) e lo salva nella memoria del browser. Dopo il download le domande vengono elaborate sul tuo telefono: il testo del libro e le tue domande non vengono inviati a nessuno. Puoi eliminare il modello in qualsiasi momento dalle Opzioni. Hugging Face e GitHub possono registrare dati tecnici di connessione (come l'indirizzo IP) al momento del download, secondo le proprie informative.</p>
        </section>

        <section className="card">
          <h2 className="text-lg font-bold">Google Drive (facoltativo)</h2>
          <p className="mt-2">Se premi "Sincronizza ora", l'app ti fa accedere con Google e chiede un solo permesso: usare la cartella nascosta dell'app nel tuo Drive. Non può leggere né modificare gli altri tuoi file, e gli altri file non vedono quella cartella. Vi vengono salvati libri, capitolo, chat e memoria, mai la chiave API. I dati restano nel tuo Google Drive e sono sotto il tuo controllo.</p>
          <p className="mt-2">Per interrompere: "Scollega Google" in Backup, oppure revoca il permesso da myaccount.google.com, sezione Sicurezza, "Accesso di terze parti". Per cancellare i dati già salvati, vai su Drive, Impostazioni, "Gestisci app", scegli reAIding companion e "Elimina dati nascosti dell'app".</p>
          <p className="mt-2">L'uso dei dati ricevuti da Google rispetta la Google API Services User Data Policy, compresi i requisiti di Uso Limitato: i dati servono solo a offrirti la sincronizzazione, non vengono venduti né usati per pubblicità.</p>
        </section>

        <section className="card">
          <h2 className="text-lg font-bold">Sito e servizi tecnici</h2>
          <p className="mt-2">Il sito è ospitato su GitHub Pages: come ogni sito, GitHub può registrare dati tecnici di connessione (come l'indirizzo IP) secondo la propria informativa. L'app non usa cookie di tracciamento. Lo script di accesso di Google viene caricato solo quando usi la sincronizzazione.</p>
        </section>

        <section className="card">
          <h2 className="text-lg font-bold">I tuoi diritti</h2>
          <p className="mt-2">Poiché i dati sono tuoi e restano sui tuoi dispositivi o nel tuo Drive, puoi vederli, esportarli (Backup), correggerli ed eliminarli quando vuoi: elimina i libri dalla Libreria, usa "Rimuovi chiave" in Opzioni o cancella i dati del sito dal browser. Hai inoltre i diritti previsti dal GDPR, incluso il reclamo al Garante per la protezione dei dati personali.</p>
        </section>

        <section className="card">
          <h2 className="text-lg font-bold">Modifiche</h2>
          <p className="mt-2">Se questa informativa cambia, aggiorno la data in alto. Le modifiche importanti verranno segnalate nell'app.</p>
        </section>
      </div>
    </main>
  );
}
