import { useState, useEffect, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import './App.css';
import './components/SettingsPanel.css'; // Importa il CSS moderno del pannello impostazioni
import './components/Chat.css'; // Importa lo stile corretto della chat
import { getOpenRouterMove, getOpenRouterChatResponse, Difficulty } from './openRouterClient';

// ...interfaccia Message...
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot' | 'system';
  moveSan?: string;
}

const PLACEHOLDER_API_KEY = 'YOUR_OPENROUTER_API_KEY_HERE';

function App() {
  const [fen, setFen] = useState('start');
  const [game, setGame] = useState(new Chess());
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Stati per le impostazioni
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('media');
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  const [tempDifficulty, setTempDifficulty] = useState<Difficulty>('media');
  const [showGearMenu, setShowGearMenu] = useState(false); // Nuovo stato per il menu dell'ingranaggio

  const [isBotThinking, setIsBotThinking] = useState(false);
  const [chatInputValue, setChatInputValue] = useState('');
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  // Carica le impostazioni da localStorage all'avvio
  useEffect(() => {
    const storedApiKey = localStorage.getItem('deepseekApiKey');
    const storedDifficulty = localStorage.getItem('deepseekDifficulty') as Difficulty | null;

    if (storedApiKey) {
      setApiKey(storedApiKey);
      setTempApiKey(storedApiKey);
    }
    if (storedDifficulty) {
      setDifficulty(storedDifficulty);
      setTempDifficulty(storedDifficulty);
    }
    // Se l'API key non è settata, apri il pannello impostazioni all'avvio
    if (!storedApiKey || storedApiKey === PLACEHOLDER_API_KEY) {
        // setShowSettingsPanel(true); // Commentato per non essere invasivo all'inizio
    }
  }, []);

  // ...useEffect per sincronizzare game e fen...
  useEffect(() => {
    if (fen === 'start') {
      const initialGameFen = new Chess().fen();
      if (game.fen() !== initialGameFen) {
        setGame(new Chess());
      }
    } else {
      if (game.fen() !== fen) {
        try {
          setGame(new Chess(fen));
        } catch (e) {
          console.error(`Errore nel caricare la FEN "${fen}" in useEffect:`, e);
        }
      }
    }
  }, [fen, game]);

  // ...useEffect per scrollare alla fine dei messaggi...
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMessage = (text: string, sender: Message['sender'], moveSan?: string) => {
    setMessages(prev => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        text,
        sender,
        moveSan
      }
    ]);
  };

  // ...handleDeepseekResponse...
  async function handleOpenRouterResponse(playerMoveSan: string, fen: string, lastBotError?: string) {
    if (!apiKey || apiKey === PLACEHOLDER_API_KEY) {
      addMessage("API Key di OpenRouter non configurata. Configurala nelle impostazioni (⚙️).", "system");
      return;
    }
    // Calcola la lista di tutti i pezzi sulla scacchiera dalla FEN
    const getAllPieces = (fen: string) => {
      const board = fen.split(' ')[0];
      const pieceMap: { [key: string]: string } = {
        'P': 'pedone bianco', 'N': 'cavallo bianco', 'B': 'alfiere bianco', 'R': 'torre bianca', 'Q': 'donna bianca', 'K': 're bianco',
        'p': 'pedone nero', 'n': 'cavallo nero', 'b': 'alfiere nero', 'r': 'torre nera', 'q': 'donna nera', 'k': 're nero'
      };
      const squares = board.replace(/\//g, '').split('');
      const pieces: string[] = [];
      let file = 0, rank = 8;
      for (const c of squares) {
        if (/[1-8]/.test(c)) {
          file += parseInt(c);
        } else {
          const col = String.fromCharCode('a'.charCodeAt(0) + file);
          if (pieceMap[c]) {
            pieces.push(`${pieceMap[c]} in ${col}${rank}`);
          }
          file++;
        }
        if (file >= 8) { file = 0; rank--; }
      }
      return pieces;
    };
    const allPieces = getAllPieces(fen);
    // Descrizione della bravura in base alla difficoltà
    let skillDescription = '';
    if (difficulty === 'facile') skillDescription = 'Gioca come un principiante: cerca di commettere errori e non giocare sempre le mosse migliori.';
    else if (difficulty === 'media') skillDescription = 'Gioca come un giocatore intermedio: alterna buone mosse a qualche imprecisione.';
    else if (difficulty === 'difficile') skillDescription = 'Gioca come un esperto: cerca di trovare sempre le mosse migliori e sfrutta ogni errore dell’avversario.';
    // Prompt arricchito con la lista di tutti i pezzi, promemoria coordinate, bravura e regole di movimento
    let extraInfo = `Tutti i pezzi sulla scacchiera (tipo e posizione): ${allPieces.join(', ')}. Ricorda: la scacchiera va da a1 (in basso a sinistra) a h8 (in alto a destra), colonne a-h e righe 1-8. ${skillDescription}\nRegole di movimento dei pezzi: 
- I pedoni si muovono in avanti di una casa (o due dalla posizione iniziale), catturano in diagonale e promuovono all'ultima traversa.
- I cavalli si muovono a L (due in una direzione e una perpendicolare), possono saltare altri pezzi.
- Gli alfieri si muovono in diagonale di qualsiasi numero di case.
- Le torri si muovono in orizzontale o verticale di qualsiasi numero di case.
- La donna si muove in orizzontale, verticale o diagonale di qualsiasi numero di case.
- Il re si muove di una casa in qualsiasi direzione e può arroccare se le condizioni lo permettono.`;
    // --- AGGIUNTA: segnala a Deepseek se il re nero è sotto scacco ---
    const tempGame = new Chess(fen);
    if (tempGame.turn() === 'b' && tempGame.isCheck()) {
      extraInfo += '\nATTENZIONE: Il re nero è sotto scacco in questa posizione. Trova una mossa che risolva lo scacco!';
    }
    if (lastBotError) {
      // Cerca una mossa UCI nell'errore (es. "Mossa non valida: e7e5")
      let forbiddenMove = '';
      const match = lastBotError.match(/([a-h][1-8][a-h][1-8][qrbn]?)/i);
      if (match) {
        forbiddenMove = match[1];
        extraInfo += `\nATTENZIONE: La tua ultima mossa non era valida (${lastBotError}). Non proporre di nuovo la mossa ${forbiddenMove} perché era sbagliata. Scegli una mossa diversa valida per il nero in questa posizione.`;
      } else {
        extraInfo += `\nATTENZIONE: La tua ultima mossa non era valida (${lastBotError}). Proponi una nuova mossa valida per il nero in questa posizione.`;
      }
    }
    console.log('[Deepseek] Tutti i pezzi:', allPieces);
    console.debug('[Deepseek] Chiamo getDeepseekMove con FEN:', fen, 'playerMoveSan:', playerMoveSan, 'difficulty:', difficulty, 'extraInfo:', extraInfo);
    const openRouterResponse = await getOpenRouterMove(fen, playerMoveSan, difficulty, apiKey, extraInfo);
    setIsBotThinking(false);
    if (openRouterResponse && openRouterResponse.move) {
      const gameCopy = new Chess(fen);
      try {
        const botMove = gameCopy.move(openRouterResponse.move);
        if (botMove) {
          setFen(gameCopy.fen());
          setGame(gameCopy);
          addMessage(`${openRouterResponse.comment}`, "bot", botMove.san);
          checkGameStatus(gameCopy);
        } else {
          addMessage("Errore: OpenRouter ha proposto una mossa non valida. Riprovo...", "system");
          await handleOpenRouterResponse(playerMoveSan, fen, `Mossa non valida: ${openRouterResponse.move}`);
        }
      } catch (e) {
        addMessage("Errore nell'applicare la mossa del bot. Riprovo...", "system");
        await handleOpenRouterResponse(playerMoveSan, fen, `Eccezione: ${e}`);
      }
    } else {
      addMessage("OpenRouter non ha fornito una mossa o c'è stato un errore API.", "system");
    }
  }

  // ...onPieceDrop...
  function onPieceDrop(sourceSquare: string, targetSquare: string) {
    if (isBotThinking || game.isGameOver()) return false;
    const gameCopy = new Chess(game.fen());
    try {
      const move = gameCopy.move({ from: sourceSquare, to: targetSquare, promotion: 'q' });
      if (move === null) return false;
      setFen(gameCopy.fen());
      setGame(gameCopy);
      addMessage(`Mossa: ${move.san}`, "user", move.san);
      if (checkGameStatus(gameCopy)) return true;
      if (gameCopy.turn() === 'b') {
        handleOpenRouterResponse(move.san, gameCopy.fen());
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  // ...checkGameStatus...
  function checkGameStatus(currentGame: typeof game): boolean {
    if (currentGame.isCheckmate()) {
      addMessage(currentGame.turn() === 'w' ? "Scacco matto! Nero vince." : "Scacco matto! Bianco vince.", "system");
      return true;
    }
    if (currentGame.isDraw()) {
      let reason = "Partita patta";
      if (currentGame.isStalemate()) reason = "Patta per stallo!";
      else if (currentGame.isThreefoldRepetition()) reason = "Patta per ripetizione di posizione!";
      else if (currentGame.isInsufficientMaterial()) reason = "Patta per materiale insufficiente!";
      addMessage(reason, "system");
      return true;
    }
    if (currentGame.isCheck()) {
        addMessage(currentGame.turn() === 'w' ? "Bianco è sotto scacco!" : "Nero è sotto scacco!", "system");
    }
    return false; 
  }

  // ...handleSendChatMessage...
  async function handleSendChatMessage() {
    if (!chatInputValue.trim()) return;
    if (!apiKey || apiKey === PLACEHOLDER_API_KEY) {
      addMessage("API Key di OpenRouter non configurata per la chat. Configurala nelle impostazioni (⚙️).", "system");
      return;
    }
    const userMessageText = chatInputValue.trim();
    addMessage(userMessageText, "user");
    setChatInputValue('');
    setIsBotThinking(true);
    const chatResponse = await getOpenRouterChatResponse(game.fen(), userMessageText, apiKey);
    setIsBotThinking(false);
    if (chatResponse) {
      addMessage(chatResponse, "bot");
    } else {
      addMessage("Non sono riuscito a ottenere una risposta per la chat.", "system");
    }
  }

  // Modificata: ora apre il pannello e chiude il menu ingranaggio se aperto
  const openSettingsPanel = () => {
    setTempApiKey(apiKey || '');
    setTempDifficulty(difficulty);
    setShowSettingsPanel(true);
    setShowGearMenu(false); // Chiudi il menu dell'ingranaggio
  };

  const closeSettingsPanel = () => {
    setShowSettingsPanel(false);
  };

  const handleSaveSettings = () => {
    const newApiKey = tempApiKey.trim();
    if (!newApiKey) {
        alert("L'API Key non può essere vuota.");
        return;
    }
    setApiKey(newApiKey);
    setDifficulty(tempDifficulty);
    localStorage.setItem('deepseekApiKey', newApiKey);
    localStorage.setItem('deepseekDifficulty', tempDifficulty);
    addMessage("Impostazioni salvate.", "system");
    setShowSettingsPanel(false);
  };

  // Nuova funzione per riavviare la partita
  const handleRestartGame = () => {
    setFen('start');
    setGame(new Chess()); // Resetta l'istanza di chess.js
    setMessages([{ id: Date.now().toString(), text: "Partita riavviata.", sender: "system" }]);
    setIsBotThinking(false);
    setChatInputValue('');
    addMessage("Nuova partita iniziata. Tocca a te (Bianco).", "system");
    setShowGearMenu(false); // Chiudi anche il menu dell'ingranaggio se la partita è riavviata da lì
  };
  
  const toggleGearMenu = () => {
    setShowGearMenu(!showGearMenu);
  };

  const isApiKeySet = apiKey && apiKey !== PLACEHOLDER_API_KEY;
  const isGameOver = game.isGameOver(); // Determina se la partita è finita

  return (
    <div className="app-container">
      <div className="board-column">
        <Chessboard
          id="BasicBoard"
          position={fen}
          onPieceDrop={onPieceDrop}
          boardOrientation="white"
          arePiecesDraggable={!isBotThinking && !isGameOver} // Usa la variabile isGameOver
        />
        {/* Il bottone Restart Game è stato spostato nel menu ingranaggio, 
            ma lo lascio qui commentato se si volesse un accesso rapido alternativo */}
        {/* <button onClick={handleRestartGame} className="restart-button">
          Restart Game
        </button> */}
      </div>

      <div className="chat-column">
        <div className="header">
            <h1 style={{ color: 'black' }}>Minimal Chess vs Deepseek</h1>
          <div className="header-icons">
            {isApiKeySet && <span className="api-key-status-icon" title="API Key impostata">🔒</span>}
            <div className="gear-menu-container"> {/* Contenitore per posizionamento relativo */}
              <span className="settings-icon" onClick={toggleGearMenu} title="Menu">⚙️</span>
              {showGearMenu && (
                <div className="gear-menu">
                  <button onClick={openSettingsPanel}>Impostazioni</button>
                  <button onClick={handleRestartGame}>Nuova Partita</button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="chat-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`message message-${msg.sender}`}>
              <span className={`sender-label sender-label-${msg.sender}`}>
                {msg.sender === 'user' ? 'Tu' : msg.sender === 'bot' ? 'Deepseek' : 'Sistema'}:
              </span>
              <span className="message-text">{msg.text}</span>
              {msg.moveSan && <span className="message-move"> ({msg.moveSan})</span>}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        {isBotThinking && <div className="thinking-indicator"><em>Deepseek sta pensando...</em></div>}
        <div className="chat-input">
          <input
            type="text"
            placeholder="Scrivi un messaggio o fai una domanda..."
            value={chatInputValue}
            onChange={(e) => setChatInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendChatMessage()}
            disabled={isBotThinking || !isApiKeySet} // Disabilita anche se l'API key non è settata
          />
          <button onClick={handleSendChatMessage} disabled={isBotThinking || !isApiKeySet}>
            Invia
          </button>
        </div>
      </div>

      {showSettingsPanel && (
        <div className="settings-panel-overlay">
          <div className="settings-panel">
            <h2>Impostazioni</h2>
            <div className="form-group">
              <label htmlFor="apiKeyInput">OpenRouter API Key:</label>
              <input
                type="password" // Per nascondere l'API Key
                id="apiKeyInput"
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                placeholder="Inserisci la tua API Key OpenRouter"
              />
            </div>
            <div className="form-group">
              <label htmlFor="difficultySelect">Difficoltà:</label>
              <select
                id="difficultySelect"
                value={tempDifficulty}
                onChange={(e) => setTempDifficulty(e.target.value as Difficulty)}
              >
                <option value="facile">Facile</option>
                <option value="media">Media</option>
                <option value="difficile">Difficile</option>
              </select>
            </div>
            <div className="settings-actions">
              <button onClick={handleSaveSettings} className="button-primary">Salva</button>
              <button onClick={closeSettingsPanel}>Annulla</button> {/* Modificato per chiamare closeSettingsPanel */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
