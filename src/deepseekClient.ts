// e:\Projects\CognitiveChess\src\deepseekClient.ts

// ATTENZIONE: Sostituisci 'YOUR_DEEPSEEK_API_KEY_HERE' con la tua vera API Key di Deepseek.
// ATTENZIONE: Verifica che DEEPSEEK_API_URL sia l'endpoint corretto per il modello che intendi utilizzare.
const DEEPSEEK_API_KEY = 'YOUR_DEEPSEEK_API_KEY_HERE';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'; // URL API generico, potrebbe necessitare di aggiustamenti

export interface DeepseekResponse {
  move: string; // Formato UCI, es. "e7e5"
  comment: string;
}

export type Difficulty = 'facile' | 'media' | 'difficile';

export async function getDeepseekMove(
  fen: string,
  lastPlayerMoveSan: string, // Mossa del giocatore in formato SAN
  difficulty: Difficulty,
  apiKey: string | null // Permette di passare l'API key dinamicamente
): Promise<DeepseekResponse | null> {
  if (!apiKey || apiKey === 'YOUR_DEEPSEEK_API_KEY_HERE') {
    console.warn('API Key di Deepseek non configurata o placeholder utilizzato. La chiamata API verrà saltata.');
    // Simula una risposta per testare il flusso senza API key
    // return { move: "e2e4", comment: "Risposta simulata (API Key mancante)." };
    return null;
  }

  const prompt = `Sei un motore scacchistico AI. Gioca contro l'utente. Ecco la posizione attuale in FEN: ${fen}.
L'utente ha giocato: ${lastPlayerMoveSan}.
Rispondi ESCLUSIVAMENTE con un oggetto JSON valido contenente la tua mossa nel formato UCI (es. e7e5) e un breve commento strategico.
L'oggetto JSON deve avere solo due campi: "move" (stringa) e "comment" (stringa).
Esempio di risposta JSON richiesta:
{
  "move": "e2e4",
  "comment": "Una mossa di apertura standard."
}
Difficoltà: ${difficulty}.`;

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat", // Assicurati che sia il modello corretto
        messages: [
          // { role: "system", content: "Sei un motore scacchistico AI che risponde solo in JSON." },
          { role: "user", content: prompt }
        ],
        // Alcune API (come OpenAI) supportano una modalità JSON per garantire l'output.
        // Verifica se Deepseek ha un parametro simile, altrimenti il parsing del JSON dal testo è cruciale.
        // response_format: { type: "json_object" }, // Se supportato da Deepseek
        temperature: 0.5, // Aggiusta per creatività vs determinismo
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Errore dalla API Deepseek:', response.status, errorBody);
      return null;
    }

    const data = await response.json();

    // La struttura della risposta può variare.
    // Spesso, il contenuto JSON è in data.choices[0].message.content
    if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
      try {
        // Il contenuto potrebbe essere una stringa JSON che necessita di un ulteriore parsing
        const content = data.choices[0].message.content;
        // Rimuovi eventuali ```json ... ``` markdown che l'LLM potrebbe aggiungere
        const cleanedContent = content.replace(/^```json\n|\n```$/g, '');
        const parsedContent: DeepseekResponse = JSON.parse(cleanedContent);

        if (typeof parsedContent.move === 'string' && typeof parsedContent.comment === 'string') {
          return parsedContent;
        } else {
          console.error('Risposta Deepseek JSON non valida dopo il parsing:', parsedContent);
          return null;
        }
      } catch (parseError) {
        console.error("Errore nel parsing della risposta JSON da Deepseek:", parseError);
        console.error("Contenuto ricevuto:", data.choices[0].message.content);
        return null;
      }
    } else {
      console.error("Struttura della risposta Deepseek non riconosciuta o contenuto mancante:", data);
      return null;
    }

  } catch (error) {
    console.error('Errore durante la chiamata a Deepseek API:', error);
    return null;
  }
}

export async function getDeepseekChatResponse(
  fen: string,
  userMessage: string,
  apiKey: string | null
): Promise<string | null> {
  if (!apiKey || apiKey === 'YOUR_DEEPSEEK_API_KEY_HERE') {
    console.warn('API Key di Deepseek non configurata o placeholder utilizzato per la chat. La chiamata API verrà saltata.');
    // return "Risposta chat simulata (API Key mancante).";
    return null;
  }

  const prompt = `Questa è la posizione attuale degli scacchi in notazione FEN: ${fen}.
L'utente ti ha chiesto: "${userMessage}".
Rispondi in modo chiaro e utile come assistente scacchistico.`;

  try {
    const response = await fetch(DEEPSEEK_API_URL, { // DEEPSEEK_API_URL è già definito sopra
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat", // Assicurati che sia il modello corretto
        messages: [
          { role: "system", content: "Sei un utile assistente scacchistico." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7, // Aggiusta per creatività
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Errore dalla API Deepseek (chat):', response.status, errorBody);
      return null;
    }

    const data = await response.json();

    if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
      return data.choices[0].message.content.trim();
    } else {
      console.error("Struttura della risposta Deepseek (chat) non riconosciuta o contenuto mancante:", data);
      return null;
    }

  } catch (error) {
    console.error('Errore durante la chiamata a Deepseek API (chat):', error);
    return null;
  }
}
