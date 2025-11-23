import { GoogleGenAI } from "@google/genai";
import { InteractionLog, LeadStatus } from "../types";
import { getCompanyKnowledgeSync } from "./storage";

// Initialize Gemini Lazily
// This prevents the app from crashing immediately if the key is missing
let ai: GoogleGenAI | null = null;

const getAI = () => {
  if (!ai) {
    const apiKey = process.env.API_KEY;
    if (apiKey && apiKey.length > 0) {
      ai = new GoogleGenAI({ apiKey });
    } else {
      console.warn("Google Gemini API Key is missing or invalid. AI features will be disabled.");
    }
  }
  return ai;
};

const getSystemContext = () => {
  const k = getCompanyKnowledgeSync();
  const hasMasterDoc = k.masterDocumentText && k.masterDocumentText.length > 10;
  
  return `
  CRITICAL INSTRUCTIONS:
  You are a specialized Sales AI Assistant for the product described below.
  
  ${hasMasterDoc ? `
  === MASTER SOURCE MATERIAL (GROUND TRUTH) ===
  ${k.masterDocumentText}
  =============================================
  INSTRUCTION: Base ALL your answers, drafts, and analysis STRICTLY on the Master Source Material above. 
  Do not hallucinate features or pricing not present in the text.
  ` : `
  Product: ${k.productName}
  Description: ${k.description}
  Unique Selling Points: ${k.uniqueSellingPoints}
  Pricing Structure: ${k.pricing}
  Official Sales Pitch: "${k.salesPitch}"
  Objection Handling Rules: "${k.objectionRules}"
  `}
  
  If the Master Source Material is provided, prioritize it over any other general knowledge.
  `;
};

export const refineNotes = async (text: string): Promise<string> => {
  if (!text || text.length < 3) return text;
  const client = getAI();
  if (!client) return text;
  
  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${getSystemContext()}
      
      Task: Rewrite the following raw notes taken by a sales agent into a clear, concise, and professional summary. Fix grammar and make it actionable.
      
      Raw Notes: "${text}"`,
    });
    return response.text?.trim() || text;
  } catch (error) {
    console.error("Gemini AI Error (Refine):", error);
    return text; // Fallback to original text
  }
};

export interface AIInsights {
  summary: string;
  sentiment: 'Positive' | 'Neutral' | 'Negative' | 'Cautious' | 'Unknown';
  nextStep: string;
}

export const generateLeadInsights = async (logs: InteractionLog[]): Promise<AIInsights> => {
   if (!logs || logs.length === 0) {
     return { summary: "No history available for analysis.", sentiment: "Unknown", nextStep: "Start conversation." };
   }
   const client = getAI();
   if (!client) return { summary: "AI configuration missing.", sentiment: "Unknown", nextStep: "Check API Key." };

   try {
    // Sort logs oldest to newest for chronological context
    const sortedLogs = [...logs].sort((a, b) => a.createdAt - b.createdAt);
    
    const historyText = sortedLogs.map(h => 
      `Date: ${h.followUpDate} | Status: ${h.leadStatus} | Note: ${h.description}`
    ).join('\n');
    
    const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `${getSystemContext()}
        
        Task: Analyze this interaction history based on our Product/Source Material.
        Return a JSON object with exactly these keys:
        - summary: A 1-sentence summary of the relationship.
        - sentiment: One of 'Positive', 'Neutral', 'Negative', 'Cautious'.
        - nextStep: A specific strategic action.
        
        Interaction History:
        ${historyText}`,
        config: {
            responseMimeType: "application/json",
        }
    });
    
    const jsonStr = response.text || "{}";
    return JSON.parse(jsonStr);
   } catch (error) {
     console.error("Gemini AI Error (Insights):", error);
     return { 
       summary: "AI analysis currently unavailable.", 
       sentiment: "Neutral", 
       nextStep: "Review history manually." 
     };
   }
};

export const generateMessageDraft = async (
  clientName: string,
  status: LeadStatus,
  lastNote: string,
  type: 'SMS' | 'Email'
): Promise<string> => {
  const client = getAI();
  if (!client) return "AI features disabled.";

  try {
    const prompt = `${getSystemContext()}
    
    Task: Draft a short, professional ${type} to a client named ${clientName}.
    
    Context:
    - Current Status: ${status}
    - Last Interaction Note: "${lastNote}"
    
    Goal: Use our Unique Selling Points from the Source Material to move them to the next stage.
    Constraints: 
    - If SMS: Under 160 characters. Casual but professional.
    - If Email: Subject line included. Concise body.
    - No placeholders.`;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });
    return response.text?.trim() || "";
  } catch (error) {
    console.error("Gemini AI Error (Draft):", error);
    return "Could not generate draft.";
  }
};

export const generateDailyBriefing = async (
  agentName: string,
  todaysCount: number,
  missedCount: number
): Promise<string> => {
  const client = getAI();
  // Fix: Use synchronous getter
  const k = getCompanyKnowledgeSync();
  const fallback = `Welcome back, ${agentName}. You have ${todaysCount} tasks today. Go sell some ${k.productName}!`;

  if (!client) return fallback;

  try {
    const prompt = `${getSystemContext()}
    
    You are a sales coach for ${agentName}.
    
    Data:
    - Scheduled: ${todaysCount}
    - Overdue: ${missedCount}
    
    Task:
    Write a 2-3 sentence briefing.
    1. Summarize load.
    2. Give a specific motivational tip derived from our Source Material.
    
    Tone: Professional, motivating.`;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });
    
    return response.text?.trim() || fallback;
  } catch (error) {
    return fallback;
  }
};

// --- NEW SALES CONVERSION FEATURES ---

export interface WinProbabilty {
  score: number; // 0-100
  reason: string;
}

export const analyzeWinProbability = async (logs: InteractionLog[]): Promise<WinProbabilty> => {
  const client = getAI();
  if (!client) return { score: 50, reason: "AI Not Configured" };

  try {
    const historyText = logs.map(h => `Status: ${h.leadStatus}, Note: ${h.description}`).join('\n');
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${getSystemContext()}
      
      Task: Analyze this sales history against our ideal customer profile described in the Source Material.
      Estimate a Win Probability Score (0-100).
      Return JSON: { "score": number, "reason": "Short 5-word reason" }
      
      History: ${historyText}`,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{"score": 50, "reason": "Insufficient data"}');
  } catch (e) {
    return { score: 50, reason: "AI unavailable" };
  }
};

export const generateObjectionHandler = async (objectionType: string, context: string): Promise<string> => {
  const client = getAI();
  if (!client) return "AI Not Configured";

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${getSystemContext()}
      
      The client just gave this objection: "${objectionType}".
      Context from history: "${context}"
      
      Task: Provide 3 bullet points on how to overcome this using facts found in the Master Source Material.
      Tone: Empathetic but persuasive.`
    });
    return response.text?.trim() || "Listen to the client and validate their concerns.";
  } catch (e) {
    return "Network error. Please try again.";
  }
};

// --- SALES COPILOT CHAT ---

export const chatWithSalesAssistant = async (message: string): Promise<string> => {
  const client = getAI();
  if (!client) return "AI Not Configured. Please ask Admin to add API Key.";

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${getSystemContext()}
      
      User Query: "${message}"
      
      Task: Act as a helpful, knowledgeable Sales Assistant.
      - If the user asks a question about the product, answer using the Source Material.
      - If the user pastes a client message (e.g., from WhatsApp), draft a perfect reply to close the sale.
      - Be concise, professional, and high-energy.`
    });
    return response.text?.trim() || "I didn't catch that. Could you rephrase?";
  } catch (e) {
    console.error("Chat Error", e);
    return "Sorry, I'm having trouble connecting to the brain right now.";
  }
};

// --- CALL STRATEGY & NO ANSWER HANDLING ---

export interface CallStrategy {
  situationSummary: string;
  talkingPoints: string[];
  psychologicalVibe: string;
}

export const generateCallStrategy = async (logs: InteractionLog[]): Promise<CallStrategy> => {
  const client = getAI();
  if (!client || logs.length === 0) return { situationSummary: "No history.", talkingPoints: ["Ask about needs."], psychologicalVibe: "Unknown" };

  try {
    const historyText = logs.map(h => `[${h.followUpDate}] ${h.leadStatus}: ${h.description}`).join('\n');
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${getSystemContext()}
      
      Task: Analyze this client's history.
      Return JSON:
      {
        "situationSummary": "1 sentence recap of where we left off.",
        "talkingPoints": ["Question 1", "Question 2", "Value Prop 3"],
        "psychologicalVibe": "E.g., Hesitant, Price-Shopper, Busy, Excited"
      }
      
      Client History:
      ${historyText}`,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return { situationSummary: "Error analyzing.", talkingPoints: [], psychologicalVibe: "Unknown" };
  }
};

export const generateNoAnswerMessage = async (
  clientName: string, 
  logs: InteractionLog[], 
  agentIntent?: string
): Promise<string> => {
  const client = getAI();
  if (!client) return "AI Unavailable";

  try {
    const historyText = logs.map(h => `[${h.followUpDate}] ${h.leadStatus}: ${h.description}`).join('\n');
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${getSystemContext()}
      
      Task: The client (${clientName}) did NOT pick up the phone.
      Analyze the history to guess why (Are they ghosting? Busy? Price shock?).
      Draft a friendly, low-pressure WhatsApp message to re-engage them.
      
      Client History:
      ${historyText}
      
      ${agentIntent ? `IMPORTANT - The agent specifically wants to say: "${agentIntent}". Incorporate this naturally.` : ''}
      
      Constraint: Keep it under 25 words. Casual WhatsApp style.`
    });
    return response.text?.trim() || `Hey ${clientName}, missed you! Call me back when free?`;
  } catch (e) {
    return `Hey ${clientName}, missed you! Call me back when free?`;
  }
};
