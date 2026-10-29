"use client";
import { TopBar } from "../ui";
import { getLang } from "@/lib/i18n";
import { LEGAL_UPDATED, LEGAL_UPDATED_EN, PUBLISHER } from "@/lib/legal";

const who = PUBLISHER || "lo sviluppatore";

function CondizioniIt() {
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

const whoEn = PUBLISHER || "the developer";

function CondizioniEn() {
  return (
    <main>
      <TopBar title="Terms of use" sub={`Updated on ${LEGAL_UPDATED_EN}`} back="/impostazioni" backLabel="Back to Options" />
      <div className="mt-4 space-y-4 text-[15px] leading-relaxed">
        <section className="card">
          <h2 className="text-lg font-bold">What reAIding companion is</h2>
          <p className="mt-2">A free reading companion: it helps you remember and understand the book you are reading, using only the parts you have already read. By using it you accept these terms.</p>
        </section>

        <section className="card">
          <h2 className="text-lg font-bold">The books are yours</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Only add books that you legitimately own, or that are free of copyright, for personal use.</li>
            <li>The app does not provide, host or distribute books: the files stay on your device.</li>
            <li>The app does not open files protected by DRM, and no technical protection may be circumvented. Do not use it to remove one.</li>
            <li>Do not share copyrighted content with others through backup or syncing.</li>
          </ul>
        </section>

        <section className="card">
          <h2 className="text-lg font-bold">AI key and costs</h2>
          <p className="mt-2">The AI needs a key from your provider. The key is yours: keep it safe, do not share it and remove it from the app if you no longer use it. Usage costs, limits and the provider's rules are your responsibility; check its usage dashboard. If you use a compatible service that you specify, only trust addresses you know.</p>
        </section>

        <section className="card">
          <h2 className="text-lg font-bold">The AI's answers</h2>
          <p className="mt-2">Answers may contain errors, omissions or wrong interpretations, and the Spoiler Shield reduces but cannot absolutely guarantee the absence of spoilers, for example if the book is split into chapters badly. They are not professional advice. Always check important things against the text.</p>
        </section>

        <section className="card">
          <h2 className="text-lg font-bold">Data and backup</h2>
          <p className="mt-2">Data is kept on your device and, if you wish, in your Google Drive. Make a backup now and then: clearing browser data or uninstalling the app can lose your library. See also the Privacy page.</p>
        </section>

        <section className="card">
          <h2 className="text-lg font-bold">Proper use</h2>
          <p className="mt-2">Do not use the app to break the law or violate others' rights, or to interfere with how it works. You are responsible for how you use it.</p>
        </section>

        <section className="card">
          <h2 className="text-lg font-bold">No warranty</h2>
          <p className="mt-2">The app is offered free of charge "as is", with no guarantee of continuity or freedom from errors, and may change or be discontinued. To the extent permitted by law, {whoEn} is not liable for data loss, costs charged by your provider or damage arising from use. Rights that the law does not allow to be excluded remain unaffected.</p>
        </section>

        <section className="card">
          <h2 className="text-lg font-bold">Changes and applicable law</h2>
          <p className="mt-2">These terms may be updated; the date at the top shows the latest version. By continuing to use the app you accept the updated version. Italian law applies.</p>
        </section>
      </div>
    </main>
  );
}

export default function Condizioni() { return getLang() === "en" ? <CondizioniEn /> : <CondizioniIt />; }
