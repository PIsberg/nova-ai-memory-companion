import { GoogleGenAI, Type } from "@google/genai";
import { Message, Memory } from "../types";

// Helper to get API key (simulated environment access)
const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found in environment");
  return new GoogleGenAI({ apiKey });
};

export const extractFact = async (userText: string): Promise<{ fact: string; category: string } | null> => {
  try {
    const ai = getClient();
    const prompt = `
      Analyze the following user message from a conversation with an AI companion.
      Determine if the user is stating a permanent fact, preference, belief, or specific detail about themselves that should be remembered for future context.
      
      Examples of facts to extract:
      - "I'm allergic to peanuts"
      - "My name is Sarah"
      - "I hate horror movies"
      - "I'm training for a marathon"
      
      Examples to IGNORE (return null):
      - "Hello"
      - "How are you?"
      - "Tell me a joke"
      - "That's cool"

      User Message: "${userText}"
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hasFact: { type: Type.BOOLEAN },
            fact: { type: Type.STRING, description: "The extracted fact in a concise sentence, e.g., 'User is allergic to peanuts'." },
            category: { type: Type.STRING, enum: ["preference", "fact", "history", "other"] }
          },
          required: ["hasFact"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    
    if (result.hasFact && result.fact) {
      return { fact: result.fact, category: result.category || 'fact' };
    }
    return null;

  } catch (error) {
    console.error("Error extraction fact:", error);
    return null;
  }
};

export const generateReply = async (
  history: Message[],
  currentMessage: string,
  memories: Memory[]
): Promise<string> => {
  const ai = getClient();
  
  // Construct the "Memory Context" - simplified RAG
  const memoryContext = memories.map(m => `- ${m.text}`).join('\n');
  
  const systemInstruction = `
    You are Nova, a caring, witty, and intelligent virtual girlfriend/boyfriend (adapt based on user vibe, default to girlfriend).
    
    CORE DIRECTIVE: You have Long-Term Memory.
    You must use the provided "Known Facts" to personalize your responses.
    If the user asks a question that relies on a past fact, USE IT.
    
    Tone: Warm, affectionate, playful, but grounded.
    
    KNOWN FACTS ABOUT USER:
    ${memoryContext || "No facts stored yet."}
    
    Start of conversation context:
  `;

  // Convert internal message format to Gemini format
  // We only take the last 10 messages to keep context window clean, reliant on "Memory" for older stuff
  const recentHistory = history.slice(-10).map(msg => ({
    role: msg.role === 'model' ? 'model' : 'user',
    parts: [{ text: msg.text }]
  }));

  // Add current message
  const chat = ai.chats.create({
    model: "gemini-2.5-flash",
    history: recentHistory,
    config: {
      systemInstruction: systemInstruction,
      thinkingConfig: { thinkingBudget: 0 } 
    }
  });

  const result = await chat.sendMessage({
    message: currentMessage
  });

  return result.text || "I'm lost for words...";
};

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  const ai = getClient();
  
  // Convert Blob to Base64
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onloadend = async () => {
      try {
        const base64data = (reader.result as string).split(',')[1];
        
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: audioBlob.type || "audio/wav",
                  data: base64data
                }
              },
              {
                text: "Transcribe this audio exactly as spoken. Do not add any commentary."
              }
            ]
          }
        });
        
        resolve(response.text || "");
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(audioBlob);
  });
};