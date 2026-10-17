# reAIding companion

# 📚 ReAIding-Companion

**ReAIding-Companion** è un'applicazione web pensata come un *compagno di lettura intelligente*. Unisce la comodità di un lettore di eBook alla potenza dell'Intelligenza Artificiale, elaborando i dati **direttamente nel tuo browser** per garantire la massima privacy e velocità.

🔗 **[Prova la Demo Live su GitHub Pages](https://kevin-flynn89.github.io/reAIding-companion/)**

---

## ✨ Funzionalità Principali

- 📖 **Lettura Multi-Formato**: Carica, decomprimi e leggi i tuoi eBook preferiti (con supporto nativo per archivi e file `.mobi`).
- 🤖 **AI On-Device (Privacy-First)**: Grazie a *Transformers.js*, le funzioni AI (come assistenti alla lettura, riassunti o analisi del testo) vengono eseguite localmente sul tuo dispositivo. Nessun dato sensibile viene inviato a server esterni!
- 💾 **Salvataggio Locale**: I progressi di lettura, le preferenze e la cache dei modelli AI vengono memorizzati in modo sicuro tramite IndexedDB.
- 🎨 **UI Moderna e Responsive**: Un'interfaccia utente pulita, minimalista e ottimizzata per ogni dispositivo (desktop, tablet, mobile).
- ⚡ **Zero-Backend**: Essendo una Web App puramente client-side, puoi usarla offline (dopo il download iniziale dei modelli) e ospitarla gratuitamente su qualsiasi servizio di static hosting.

---

## 🛠️ Tecnologie Utilizzate

Il progetto è costruito con uno stack moderno e altamente performante:

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router) & React 18
- **Linguaggi**: TypeScript, JavaScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **AI & Machine Learning**: [@xenova/transformers](https://github.com/xenova/transformers.js) (Esecuzione di modelli ONNX nel browser)
- **Parsing Documenti**: [@lingo-reader/mobi-parser](https://www.npmjs.com/package/@lingo-reader/mobi-parser), [JSZip](https://stuk.github.io/jszip/)
- **Storage**: [idb-keyval](https://github.com/jakearchibald/idb-keyval) (Gestione semplificata di IndexedDB)

---

## 🚀 Come Iniziare (Sviluppo Locale)

Se vuoi esplorare il codice o contribuire al progetto, segui questi passaggi per configurare l'ambiente in locale.

### Prerequisiti
Assicurati di avere installato sul tuo sistema:
- [Node.js](https://nodejs.org/) (versione 18.x o superiore)
- [npm](https://www.npmjs.com/) (o `yarn` / `pnpm`)

### Installazione

1. Clona la repository:
   ```bash
   git clone https://github.com/kevin-flynn89/reAIding-companion.git
   cd reAIding-companion
