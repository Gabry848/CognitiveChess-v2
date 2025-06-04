// e:\Projects\CognitiveChess\src\deepseekClient.ts

// ATTENZIONE: Sostituisci 'YOUR_OPENROUTER_API_KEY_HERE' con la tua vera API Key di OpenRouter.
// ATTENZIONE: Verifica che OPENROUTER_API_URL sia l'endpoint corretto per il modello che intendi utilizzare.
const OPENROUTER_API_KEY = "YOUR_OPENROUTER_API_KEY_HERE";
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"; // Endpoint OpenRouter

export interface OpenRouterResponse {
  move: string; // Formato UCI, es. "e7e5"
  comment: string;
}

export type Difficulty = "facile" | "media" | "difficile";

export async function getOpenRouterMove(
  fen: string,
  lastPlayerMoveSan: string, // Mossa del giocatore in formato SAN
  difficulty: Difficulty,
  apiKey: string | null, // Permette di passare l'API key dinamicamente
  extraInfo?: string // Nuovo parametro opzionale per info aggiuntive
): Promise<OpenRouterResponse | null> {
  if (!apiKey || apiKey === "YOUR_OPENROUTER_API_KEY_HERE") {
    console.warn(
      "API Key di OpenRouter non configurata o placeholder utilizzato. La chiamata API verrà saltata."
    );
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
ricorda che nn esiste la mossa con x
ricorda che i pedoni si muovono in avanti e in diagonale per mangiare
`.trim();

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
         // Cambia con il tuo dominio se richiesto da OpenRouter
          "X-Title": "CognitiveChess"
              },
              body: JSON.stringify({
          model: "deepseek-chat", // Modello DeepSeek su OpenRouter
        messages: [
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.45,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Errore dalla API OpenRouter:", response.status, errorBody);
      return null;
    }

    const data = await response.json();

    if (
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
    ) {
      try {
        const content = data.choices[0].message.content;
        const cleanedContent = content.replace(/^```json\n|\n```$/g, "");
        const parsedContent: OpenRouterResponse = JSON.parse(cleanedContent);

        if (
          typeof parsedContent.move === "string" &&
          typeof parsedContent.comment === "string"
        ) {
          return parsedContent;
        } else {
          console.error(
            "Risposta OpenRouter JSON non valida dopo il parsing:",
            parsedContent
          );
          return null;
        }
      } catch (parseError) {
        console.error(
          "Errore nel parsing della risposta JSON da OpenRouter:",
          parseError
        );
        console.error("Contenuto ricevuto:", data.choices[0].message.content);
        return null;
      }
    } else {
      console.error(
        "Struttura della risposta OpenRouter non riconosciuta o contenuto mancante:",
        data
      );
      return null;
    }
  } catch (error) {
    console.error("Errore durante la chiamata a OpenRouter API:", error);
    return null;
  }
}

export async function getOpenRouterChatResponse(
  fen: string,
  userMessage: string,
  apiKey: string | null
): Promise<string | null> {
  if (!apiKey || apiKey === "YOUR_OPENROUTER_API_KEY_HERE") {
    console.warn(
      "API Key di OpenRouter non configurata o placeholder utilizzato per la chat. La chiamata API verrà saltata."
    );
    return null;
  }

  const prompt = `Questa è la posizione attuale degli scacchi in notazione FEN: ${fen}.
L'utente ti ha chiesto: "${userMessage}".
Rispondi in modo chiaro e utile come assistente scacchistico.`;

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://yourapp.com", // Cambia con il tuo dominio se richiesto da OpenRouter
        "X-Title": "CognitiveChess"
      },
      body: JSON.stringify({
        model: "openai/gpt-4-1106-preview", // ChatGPT-4.1 su OpenRouter
        messages: [
          { role: "system", content: "Sei un utile assistente scacchistico." },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        "Errore dalla API OpenRouter (chat):",
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
        "Struttura della risposta OpenRouter (chat) non riconosciuta o contenuto mancante:",
        data
      );
      return null;
    }
  } catch (error) {
    console.error("Errore durante la chiamata a OpenRouter API (chat):", error);
    return null;
  }
}
