# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Sistema di Manutenzione

Il progetto include un sistema di manutenzione che permette di gestire lo stato di manutenzione per diverse sezioni dell'applicazione.

### Configurazione

1. **File di Ambiente**
   - `.env.development`: configurazione per sviluppo locale
   - `.env.production`: configurazione per ambiente di produzione
   - `.env`: override locali

2. **Variabili d'Ambiente**
   ```
   VITE_MAINTENANCE_SERVER_URL=http://localhost:3001  # URL del server di manutenzione
   ```

### Server di Manutenzione

Il server di manutenzione (`maintenance-server.js`) gestisce lo stato di manutenzione per:
- Presale
- Staking
- Airdrop
- DAO
- Swap

### Utilizzo

1. **Sviluppo Locale**
   ```bash
   # Avvia il server di manutenzione
   node maintenance-server.js
   
   # In un altro terminale, avvia l'app
   npm run dev
   ```

2. **Produzione (Netlify)**
   - Configura `VITE_MAINTENANCE_SERVER_URL` nelle variabili d'ambiente di Netlify
   - Il server di manutenzione deve essere hostato separatamente

### Funzionalità

- Gestione stato di manutenzione per singole sezioni
- Messaggi personalizzati per ogni stato di manutenzione
- Polling automatico ogni 30 secondi per aggiornamenti
- Stima del tempo di completamento configurabile
