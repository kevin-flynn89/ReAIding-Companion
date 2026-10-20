import { TopBar } from "../ui";
import { LEGAL_UPDATED, PUBLISHER } from "@/lib/legal";

const who = PUBLISHER || "lo sviluppatore";

export default function Condizioni() {
  return (
    <main>
      <TopBar title="Condizioni d'uso" sub={`Aggiornate il ${LEGAL_UPDATED}`} back="/impostazioni" backLabel="Torna alle Opzioni" />
      <div className="mt-4 space-y-4 text-[15px] leading-relaxed">
        <section className="card">
          <h2 className="text-lg font-bold">Cos'è reAIding companion</h2>
          <p className="mt-2">Un compagno di lettura gratuito: ti aiuta a ricordare e capire il libro che stai leggendo, usando solo le parti che hai già letto. Usandolo accetti queste condizioni.</p>
        </section>

        <section className="card">
          <h2 className="text-lg font-bold">I libri sono tuoi</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Aggiungi solo libri che possiedi legittimamente, o che sono liberi da diritti, per uso personale.</li>
            <li>L'app non fornisce, non ospita e non distribuisce libri: i file restano sul tuo dispositivo.</li>
            <li>L'app non apre file protetti da DRM e non va aggirata nessuna protezione tecnica. Non usarla per rimuoverla.</li>
            <li>Non condividere con altri contenuti protetti da diritto d'autore attraverso backup o sincronizzazione.</li>
          </ul>
        </section>

        <section className="card">
          <h2 className="text-lg font-bold">Chiave AI e costi</h2>
          <p className="mt-2">L'AI richiede una chiave del tuo provider. La chiave è tua: custodiscila, non condividerla e rimuovila dall'app se non la usi più. I costi di utilizzo, i limiti e le regole del provider restano sotto la tua responsabilità; controlla il suo pannello di consumo. Se usi un servizio compatibile indicato da te, fidati solo di indirizzi che conosci.</p>
        </section>

        <section className="card">
          <h2 className="text-lg font-bold">Le risposte dell'AI</h2>
          <p className="mt-2">Le risposte possono contenere errori, omissioni o interpretazioni sbagliate, e lo Spoiler Shield riduce ma non può garantire in assoluto l'assenza di anticipazioni, ad esempio se il libro è diviso male in capitoli. Non sono consulenza professionale. Verifica sempre sul testo ciò che è importante.</p>
        </section>

        <section className="card">
          <h2 className="text-lg font-bold">Dati e backup</h2>
          <p className="mt-2">I dati stanno sul tuo dispositivo e, se vuoi, nel tuo Google Drive. Fai ogni tanto un backup: cancellare i dati del browser o disinstallare l'app può far perdere la libreria. Vedi anche la pagina Privacy.</p>
        </section>

        <section className="card">
          <h2 className="text-lg font-bold">Uso corretto</h2>
          <p className="mt-2">Non usare l'app per violare la legge o i diritti altrui, né per interferire con il suo funzionamento. Sei responsabile dell'uso che ne fai.</p>
        </section>

        <section className="card">
          <h2 className="text-lg font-bold">Nessuna garanzia</h2>
          <p className="mt-2">L'app è offerta gratuitamente "così com'è", senza garanzie di continuità o assenza di errori, e può cambiare o essere interrotta. Nei limiti consentiti dalla legge, {who} non risponde di perdite di dati, costi addebitati dal tuo provider o danni derivanti dall'uso. Restano salvi i diritti che la legge non permette di escludere.</p>
        </section>

        <section className="card">
          <h2 className="text-lg font-bold">Modifiche e legge applicabile</h2>
          <p className="mt-2">Posso aggiornare queste condizioni; la data in alto indica l'ultima versione. Continuando a usare l'app accetti la versione aggiornata. Si applica la legge italiana.</p>
        </section>
      </div>
    </main>
  );
}
