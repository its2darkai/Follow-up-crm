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