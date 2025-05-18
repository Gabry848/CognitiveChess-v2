# 🧠 Prompt per GitHub Copilot Agent – Gioco di Scacchi con React + Electron + Deepseek

Questo prompt guida GitHub Copilot Agent nella creazione di un gioco di scacchi moderno e minimale basato su:

- **React + Vite + Electron** (`electron-vite`)
- **react-chessboard** per la UI della scacchiera
- **chess.js** per la validazione delle mosse
- **Deepseek API** come avversario AI e assistente strategico

Hai già creato il progetto iniziale con:

```bash
npm create electron-vite@latest
```

---

## ✅ PHASE 1: Setup base e struttura app

> Crea una struttura iniziale React.

- `App.jsx` con layout a due colonne:
  - **Sinistra**: scacchiera
  - **Destra**: chat verticale
- In alto a destra:
  - Titolo `"Minimal Chess vs Deepseek"`
  - Icona `⚙️` per aprire le impostazioni
- Usa `react-chessboard` (`npm install react-chessboard`)
- Stato iniziale della posizione in FEN `"start"` (con `useState`)
- CSS minimale (sfondo chiaro, font moderno, layout centrato)

---

## ✅ PHASE 2: Logica scacchi con `chess.js`

> Integra `chess.js` per gestire le regole del gioco (`npm install chess.js`)

- Crea un'istanza `const game = new Chess()`
- Gestisci `onPieceDrop` per l'utente:
  - Valida la mossa con `game.move()`
  - Se valida:
    - aggiorna FEN
    - aggiungi mossa alla chat
    - invia la FEN e la mossa a Deepseek
  - Se invalida: rifiuta la mossa

---

## ✅ PHASE 3: Integrazione con Deepseek API

> Implementa Deepseek come avversario.

- Crea `deepseekClient.js`
- Funzione accetta:
  - FEN
  - ultima mossa
  - difficoltà
- Prompt per Deepseek:

```
Sei un motore scacchistico AI. Gioca contro l'utente. Ecco la posizione attuale in FEN: {FEN}.
L'utente ha giocato: {mossa}.
Rispondi con la tua mossa nel formato UCI (es. e7e5), seguita da un breve commento strategico.
Difficoltà: {facile|media|difficile}.
```

- Deepseek risponde con:

```json
{
  "move": "e7e5",
  "comment": "Una solida risposta alla tua apertura di re."
}
```

- Applica la mossa con `game.move()` e aggiorna FEN
- Aggiungi il commento nella chat

---

## ✅ PHASE 4: Chat interattiva

> Permetti all’utente di interagire con il bot anche al di fuori del gioco.

- Chat nella colonna destra:
  - Lista messaggi
  - Input per scrivere
- Se l’utente scrive messaggi generici:
  - Invia un prompt tipo:

```
Questa è la posizione attuale: {FEN}.
L’utente ti ha chiesto: "{messaggio}".
Rispondi in modo chiaro e utile.
```

- Aggiungi risposta alla chat
- Cronologia messaggi nello stato

---

## ✅ PHASE 5: Pannello impostazioni

> Aggiungi un pannello cliccando l’ingranaggio in alto a destra.

Contiene:
- Campo per **API Key**
- Select per **difficoltà** (facile / media / difficile)

Salva in stato o `localStorage`.  
Mostra icona "🔒" se API Key è presente.

---

## ✅ PHASE 6: Rifiniture

> Aggiungi polish finale:

- Bottone "Restart Game"
- Rileva scacco, scacco matto, patta
- Blocca scacchiera a fine partita
- Migliora lo stile della chat:
  - Bolle messaggio
  - Ruoli “Tu” e “Deepseek”
- Mostra spinner mentre il bot risponde
- (Opzionale) Modalità dark/light

---

