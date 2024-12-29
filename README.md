# SOP DeFi Platform

## Overview
SOP è una piattaforma DeFi completa che offre varie funzionalità per la gestione e l'utilizzo del token SOP sulla Binance Smart Chain. È un'applicazione totalmente decentralizzata che non utilizza database tradizionali: tutti i dati sono salvati esclusivamente sulla blockchain, garantendo massima sicurezza e resistenza a qualsiasi tipo di collasso del sistema.

### Compatibilità e Accessibilità
- Supporto multi-piattaforma:
  * Web browser (Chrome, Firefox, Safari, Edge)
  * iOS (iPhone, iPad)
  * Android (smartphone e tablet)
- Integrazione multi-wallet:
  * MetaMask
  * Trust Wallet
  * WalletConnect
  * Coinbase Wallet
  * Binance Wallet
  * Ledger
  * Trezor
  * Rainbow
  * Argent
- Interfaccia responsive e adattiva per ogni dispositivo
- Nessuna installazione richiesta per la versione web

## Componenti Principali

### 1. Token SOP (Token.sol)
- Token ERC20 standard con funzionalità avanzate
- Supply totale: 1 miliardo di token
- Sistema di locking dei token:
  * Sblocco parziale del 30% alla data prestabilita
  * Sblocco totale del restante 70% alla data finale
- Sistema di tassazione:
  * Tassa del 2% su ogni transazione destinata allo staking
  * Tassa del 2% su ogni transazione destinata all'airdrop
  * Tasse configurabili dall'owner (max 10%)
  * Esenzioni per contratti speciali e owner
- Controllo maxWalletPercentage:
  * Limite configurabile per la quantità massima di token per wallet
  * Protezione contro accumuli eccessivi

- Funzione di burn:
  * Possibilità di bruciare token
  * Riduzione permanente del supply
- Funzioni di visualizzazione per il frontend:
  * getLockedTokens: visualizza i token bloccati
  * getUserLockInfo: dettagli specifici dei lock
  * getUserLocksCount: numero di lock per utente
- Gestione dei permessi tramite sistema di ownership

### 2. Sistema di Presale (Presale.sol)
- Prezzo iniziale calcolato per ottenere 24151 token per 1 BNB
- Meccanismo di aumento prezzo:
  * Incremento dell'1% ogni 12 ore
  * Incentiva la partecipazione anticipata
  * Prezzo configurabile dall'owner
- Sistema di sicurezza:
  * EmergencyStop per pause di emergenza
  * Sistema di rimborso dopo 120 giorni
  * Limite massimo di contribuzione per wallet
- Gestione automatica della liquidità:
  * 30% dei token destinati a PancakeSwap
  * Aggiunta automatica della liquidità a fine presale
  * Vault dedicato per la gestione sicura dei token di liquidità
- Gestione token rimanenti:
  * Stake automatico dei token non venduti
  * Integrazione diretta con il contratto di staking
- Funzioni di visualizzazione per il frontend:
  * getCurrentPrice: prezzo attuale dei token
  * getTokensForBNB: calcolo token ottenibili

### 3. Sistema di Staking (Staking.sol)
- Staking flessibile dei token SOP
- Sistema APR dinamico:
  * APR massimo: 150%
  * APR minimo: 3%
  * Calcolo basato sulla liquidità del contratto
  * Soglia minima di liquidità: 5%
  * Soglia massima per APR: 200M token
- Caratteristiche avanzate:
  * Periodo minimo di staking configurabile
  * Cap massimo di staking (inizialmente 5M token)
  * Sistema di pausa per emergenze
  * Tracciamento del totale in staking
- Gestione ricompense:
  * Calcolo automatico basato sul tempo
  * Sistema di ricompense non reclamabili
  * Protezione contro overflow delle ricompense
- Funzionalità principali:
  * Stake: blocco dei token
  * Withdraw: ritiro dei token (dopo il periodo minimo)
  * Claim: riscossione delle ricompense
  * Burn: bruciatura token in eccesso
- Funzioni di visualizzazione:
  * getCurrentAPR: APR attuale
  * calculateRewards: calcolo ricompense pendenti
  * getStakeInfo: informazioni complete sullo stake

### 4. Sistema di Airdrop (Airdrop.sol)
- Distribuzione automatica dei token agli utenti eleggibili
- Sistema di verifica multi-livello:
  * Verifica del possesso di NFT
  * Verifica del saldo minimo
  * Verifica dell'anzianità wallet
- Gestione whitelist per distribuzioni speciali
- Protezione anti-bot e anti-spam
- Tracciamento delle distribuzioni effettuate
- Limite massimo di token per indirizzo

### 5. LiquidityVault (LiquidityVault.sol)
- Vault sicuro per la gestione dei token destinati alla liquidità
- Approvazione one-time per il contratto di presale
- Protezione contro modifiche non autorizzate
- Gestione sicura dell'aggiunta di liquidità a PancakeSwap

### 6. Tokenomics
Distribuzione totale dei token:
- 35% Presale
- 30% Liquidità
- 20% Staking
- 5% Airdrop
- 10% Team/Staff

## Frontend (dapp/)

### Pagine
1. **Home**
   - Dashboard generale
   - Statistiche principali
   - Accesso rapido alle funzionalità

2. **Admin**
   - Pannello amministrativo
   - Gestione parametri contratti
   - Funzioni owner-only
   - Accesso protetto solo per owner del contratto
   - Verifica automatica dell'indirizzo owner
   - Nascondimento automatico del link Admin per utenti non autorizzati
   - Implementazione di controlli di sicurezza sia nel menu che nel footer

3. **Staking**
   - Interfaccia staking
   - Visualizzazione ricompense
   - Gestione stake/unstake

4. **Airdrop**
   - Sistema di distribuzione token
   - Verifica automatica dei requisiti
   - Tracciamento distribuzioni
   - Gestione whitelist
   - Statistiche in tempo reale
   - Integrazione con NFT

## Tecnologie Utilizzate

### Smart Contracts
- Linguaggio: Solidity 0.8.19
- Framework: Hardhat
- Librerie: OpenZeppelin
- Sicurezza:
  * ReentrancyGuard
  * Ownable
  * Sistemi di pausa

### Frontend
- Framework: React
- Build tool: Vite
- Web3: ethers.js, wagmi
- UI: Tailwind CSS
- Progressive Web App (PWA) per installazione su dispositivi mobili
- Sistema di connessione wallet universale
- Gestione automatica delle connessioni multi-chain
- Supporto per deep linking e wallet linking
- Cache decentralizzata dei dati sulla blockchain

### Blockchain
- Rete: Binance Smart Chain
- Ambiente: Testnet/Mainnet
- DEX: PancakeSwap V2
- Storage decentralizzato:
  * Tutti i dati salvati on-chain
  * Nessun database centralizzato
  * Massima trasparenza e verificabilità
  * Resistenza a guasti e censura

## Setup e Installazione

1. Clona il repository
```bash
git clone [repository-url]
```

2. Installa le dipendenze
```bash
# Root directory (contratti)
npm install

# Frontend
cd dapp
npm install
```

3. Configura il file .env
```env
# Copia il file di esempio
cp .env.example .env
# Modifica le variabili necessarie
```

4. Compila i contratti
```bash
npx hardhat compile
```

5. Deploy dei contratti
```bash
npx hardhat run scripts/deploy.ts --network bscTestnet
```

6. Avvia il frontend
```bash
cd dapp
npm run dev
```

## Testing

```bash
# Test dei contratti
npx hardhat test

# Coverage report
npx hardhat coverage
```

## Sicurezza
- Contratti verificati su BSCScan
- Audit di sicurezza completato
- Implementazione best practices OpenZeppelin
- Sistema di permessi granulare
- Controlli di accesso avanzati per funzionalità amministrative
- Verifica real-time dell'owner del contratto
- Protezione delle rotte amministrative
- Sistema di navigazione sicuro con controlli dinamici
- Gestione sicura delle connessioni wallet:
  * Verifica delle firme
  * Protezione contro phishing
  * Gestione sicura delle chiavi private
  * Supporto per hardware wallet
- Architettura completamente decentralizzata:
  * Nessun punto singolo di fallimento
  * Dati sempre accessibili tramite blockchain
  * Protezione contro attacchi DDoS
  * Resilienza del sistema garantita dalla rete

## Changelog

### Natale 2024
Durante la vigilia di Natale, il team ha implementato importanti aggiornamenti di sicurezza:
- Implementazione del sistema di verifica owner per l'accesso admin
- Aggiunta di controlli di sicurezza nel menu di navigazione
- Miglioramento della protezione delle rotte amministrative
- Implementazione di controlli di visibilità dinamici nel footer
- Ottimizzazione del sistema di verifica degli indirizzi
- Integrazione di controlli real-time per l'accesso alle funzionalità admin
