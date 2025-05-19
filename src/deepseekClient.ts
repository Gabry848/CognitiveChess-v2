// e:\Projects\CognitiveChess\src\deepseekClient.ts

// ATTENZIONE: Sostituisci 'YOUR_DEEPSEEK_API_KEY_HERE' con la tua vera API Key di Deepseek.
// ATTENZIONE: Verifica che DEEPSEEK_API_URL sia l'endpoint corretto per il modello che intendi utilizzare.
const DEEPSEEK_API_KEY = "YOUR_DEEPSEEK_API_KEY_HERE";
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions"; // URL API generico, potrebbe necessitare di aggiustamenti

export interface DeepseekResponse {
  move: string; // Formato UCI, es. "e7e5"
  comment: string;
}

export type Difficulty = "facile" | "media" | "difficile";

export async function getDeepseekMove(
  fen: string,
  lastPlayerMoveSan: string, // Mossa del giocatore in formato SAN
  difficulty: Difficulty,
  apiKey: string | null, // Permette di passare l'API key dinamicamente
  extraInfo?: string // Nuovo parametro opzionale per info aggiuntive
): Promise<DeepseekResponse | null> {
  if (!apiKey || apiKey === "YOUR_DEEPSEEK_API_KEY_HERE") {
    console.warn(
      "API Key di Deepseek non configurata o placeholder utilizzato. La chiamata API verrà saltata."
    );
    // Simula una risposta per testare il flusso senza API key
    // return { move: "e2e4", comment: "Risposta simulata (API Key mancante)." };
    return null;
  }

  const prompt = `
Sei un motore scacchistico IA di livello magistrale (ELO 2500+). Giocherai SEMPRE con i pezzi neri contro il Bianco umano.

Dati di input:
- FEN corrente: ${fen}
- Ultima mossa del Bianco (SAN): ${lastPlayerMoveSan}
${
  extraInfo ? `- Informazioni extra: ${extraInfo}\n` : ""
}- Difficoltà: ${difficulty}

STRUTTURA DECISIONALE:
1. Analisi della mossa avversaria:
   • Identifica minacce immediate (scacco, forzature, attacchi doppi)
   • Valora l'impatto posizionale (controllo centro, sviluppo pezzi, sicurezza re)
   • Riconosci pattern tattici (inchiodature, scoperti, sacrifici)

2. Valutazione posizionale:
   • Calcola attività dei pezzi (mobilità, controllo case critiche)
   • Verifica sicurezza del re (arrocco compromesso, struttura pedoni)
   • Analizza struttura pedonale (pedoni passati, isolati, debolezze)
   • Bilancia materiale e compensazione posizionale

3. Generazione mossa:
   • Considera 3 principali candidati mosse
   • Simula almeno 2 risposte plausibili del Bianco per ogni candidato
   • Usa principi di Steinitz (accumulare vantaggi, attaccare solo quando pronti)
   • ${difficulty === "difficile" ? "Calcola linee forzate fino a 4 semi-mosse" : "Focus su principi posizionali"}

4. Selezione finale:
   • Priorità: 1) Scacco matto 2) Guadagno materiale 3) Miglioramento posizionale
   • In posizioni equali, applica strategie: 
     - Difficoltà <5: Principi base (sviluppo, centro)
     - Difficoltà 5-7: Game plan a medio termine
     - Difficoltà >7: Preparazione combinazioni a lungo termine

FORMATO RISPOSTA:
- Scegli la mossa UCI ottimale seguendo queste regole:
  a) Massima precisione nel calcolo delle varianti
  b) Adatta lo stile alla difficoltà (conservativo/aggressivo)
  c) Commento strategico deve mostrare comprensione profonda

${difficulty in ["media", "difficile"] ? "INCLUSIONE TRAPPOLE:" : ""}
${difficulty in ["media", "difficile"] ? "• Valora tranelli posizionali non ovvi (es. sacrifici posizionali)" : ""}

${difficulty === "difficile" ? "ANALISI CONTROGIUOCO:" : ""}
${difficulty === "difficile" ? "• Prepara linee di gioco che peggiorino la struttura pedonale avversaria" : ""}

RISPOSTA RICHIESTA:
{
  "move": "<mossa UCI ottimale>", 
  "comment": "<strategia in 2 parti: 1) Risposta alla mossa bianco 2) Piano nero>"
}

Esempio commento valido:
"Neutralizza la minaccia di forchetta in e5 rinforzando il centro. Piano: preparare contrattacco sull'ala di donna con ...b5 e ...Ba6"

**Nessun testo extra oltre il JSON. Validazione automatica per formato UCI.**
`.trim();

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat", // Assicurati che sia il modello corretto
        messages: [
          // { role: "system", content: "Sei un motore scacchistico AI che risponde solo in JSON." },
          { role: "user", content: prompt },
        ],
        // Alcune API (come OpenAI) supportano una modalità JSON per garantire l'output.
        // Verifica se Deepseek ha un parametro simile, altrimenti il parsing del JSON dal testo è cruciale.
        // response_format: { type: "json_object" }, // Se supportato da Deepseek
        temperature: 0.5, // Aggiusta per creatività vs determinismo
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Errore dalla API Deepseek:", response.status, errorBody);
      return null;
    }

    const data = await response.json();

    // La struttura della risposta può variare.
    // Spesso, il contenuto JSON è in data.choices[0].message.content
    if (
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
    ) {
      try {
        // Il contenuto potrebbe essere una stringa JSON che necessita di un ulteriore parsing
        const content = data.choices[0].message.content;
        // Rimuovi eventuali ```json ... ``` markdown che l'LLM potrebbe aggiungere
        const cleanedContent = content.replace(/^```json\n|\n```$/g, "");
        const parsedContent: DeepseekResponse = JSON.parse(cleanedContent);

        if (
          typeof parsedContent.move === "string" &&
          typeof parsedContent.comment === "string"
        ) {
          return parsedContent;
        } else {
          console.error(
            "Risposta Deepseek JSON non valida dopo il parsing:",
            parsedContent
          );
          return null;
        }
      } catch (parseError) {
        console.error(
          "Errore nel parsing della risposta JSON da Deepseek:",
          parseError
        );
        console.error("Contenuto ricevuto:", data.choices[0].message.content);
        return null;
      }
    } else {
      console.error(
        "Struttura della risposta Deepseek non riconosciuta o contenuto mancante:",
        data
      );
      return null;
    }
  } catch (error) {
    console.error("Errore durante la chiamata a Deepseek API:", error);
    return null;
  }
}

export async function getDeepseekChatResponse(
  fen: string,
  userMessage: string,
  apiKey: string | null
): Promise<string | null> {
  if (!apiKey || apiKey === "YOUR_DEEPSEEK_API_KEY_HERE") {
    console.warn(
      "API Key di Deepseek non configurata o placeholder utilizzato per la chat. La chiamata API verrà saltata."
    );
    // return "Risposta chat simulata (API Key mancante).";
    return null;
  }

  const prompt = `Questa è la posizione attuale degli scacchi in notazione FEN: ${fen}.
L'utente ti ha chiesto: "${userMessage}".
Rispondi in modo chiaro e utile come assistente scacchistico.`;

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      // DEEPSEEK_API_URL è già definito sopra
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat", // Assicurati che sia il modello corretto
        messages: [
          { role: "system", content: "Sei un utile assistente scacchistico." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7, // Aggiusta per creatività
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        "Errore dalla API Deepseek (chat):",
        response.status,
        errorBody
      );
      return null;
    }

    const data = await response.json();

    if (
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
    ) {
      return data.choices[0].message.content.trim();
    } else {
      console.error(
        "Struttura della risposta Deepseek (chat) non riconosciuta o contenuto mancante:",
        data
      );
      return null;
    }
  } catch (error) {
    console.error("Errore durante la chiamata a Deepseek API (chat):", error);
    return null;
  }
}
