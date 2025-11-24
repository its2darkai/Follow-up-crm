import { GoogleGenAI } from "@google/genai";
import { InteractionLog, LeadStatus } from "../types";
import { getCompanyKnowledgeSync } from "./storage";

// Initialize Gemini Lazily
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
    return text;
  }
};

export interface AIInsights {
  summary: string;
  sentiment: 'Positive' | 'Neutral' | 'Negative' | 'Cautious' | 'Unknown';
  nextStep: string;
}

export const generateLeadInsights = async (logs: InteractionLog[]): Promise<AIInsights> => {
   if (!logs || logs.length === 0) {
     return { summary: "No history available.", sentiment: "Unknown", nextStep: "Start conversation." };
   }
   const client = getAI();
   if (!client) return { summary: "AI config missing.", sentiment: "Unknown", nextStep: "Check API Key." };

   try {
    const sortedLogs = [...logs].sort((a, b) => a.createdAt - b.createdAt);
    const historyText = sortedLogs.map(h => 
      `Date: ${h.followUpDate} | Status: ${h.leadStatus} | Note: ${h.description}`
    ).join('\n');
    
    const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `${getSystemContext()}
        
        Task: Analyze this interaction history.
        Return JSON with keys: summary, sentiment, nextStep.
        
        History:
        ${historyText}`,
        config: {
            responseMimeType: "application/json",
        }
    });
    
    const jsonStr = response.text || "{}";
    return JSON.parse(jsonStr);
   } catch (error) {
     return { 
       summary: "AI analysis unavailable.", 
       sentiment: "Neutral", 
       nextStep: "Review manually." 
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
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${getSystemContext()}
    
    Task: Draft a short, professional ${type} to a client named ${clientName}.
    Context: Status: ${status}, Last Note: "${lastNote}".
    Goal: Use USP to move to next stage.
    Constraints: SMS < 160 chars. Email concise.`
    });
    return response.text?.trim() || "";
  } catch (error) {
    return "Could not generate draft.";
  }
};

export const generateDailyBriefing = async (
  agentName: string,
  todaysCount: number,
  missedCount: number
): Promise<string> => {
  const client = getAI();
  const k = getCompanyKnowledgeSync();
  const fallback = `Welcome back, ${agentName}. You have ${todaysCount} tasks today.`;

  if (!client) return fallback;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${getSystemContext()}
    
    You are a sales coach for ${agentName}.
    Data: Scheduled: ${todaysCount}, Overdue: ${missedCount}.
    Task: Write a 2-3 sentence motivational briefing.`
    });
    
    return response.text?.trim() || fallback;
  } catch (error) {
    return fallback;
  }
};

export interface WinProbabilty {
  score: number;
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
      
      Task: Analyze sales history against ideal customer profile.
      Estimate Win Probability Score (0-100).
      Return JSON: { "score": number, "reason": "Short reason" }
      
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
      
      Objection: "${objectionType}".
      Context: "${context}"
      Task: Provide 3 bullet points to overcome this using Source Material.`
    });
    return response.text?.trim() || "Listen and validate.";
  } catch (e) {
    return "Network error.";
  }
};

export const chatWithSalesAssistant = async (message: string): Promise<string> => {
  const client = getAI();
  if (!client) return "AI Not Configured.";

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${getSystemContext()}
      
      User Query: "${message}"
      Task: Act as a helpful Sales Assistant. Answer using Source Material. Be concise.`
    });
    return response.text?.trim() || "I didn't catch that.";
  } catch (e) {
    return "Connection error.";
  }
};

export const chatWithLeadStrategyAssistant = async (
  message: string, 
  logs: InteractionLog[], 
  clientName: string
): Promise<string> => {
  const client = getAI();
  if (!client) return "AI Not Configured.";

  try {
    const historyText = logs.map(h => `[${h.followUpDate}] ${h.leadStatus}: ${h.description}`).join('\n');
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${getSystemContext()}
      
      Context: Conversing about lead "${clientName}".
      Lead History:
      ${historyText}
      
      Agent Query: "${message}"
      
      Task: Act as a 'Wingman' or Sales Coach. Reply as if sending a WhatsApp to a friend. 
      Keep it very short (under 40 words), tactical, and specific to this lead's history.`
    });
    return response.text?.trim() || "Can't advise right now.";
  } catch (e) {
    return "Connection error.";
  }
};

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
      
      Task: Analyze history.
      Return JSON: { "situationSummary": "...", "talkingPoints": ["..."], "psychologicalVibe": "..." }
      
      History:
      ${historyText}`,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return { situationSummary: "Error.", talkingPoints: [], psychologicalVibe: "Unknown" };
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
      
      Task: Client (${clientName}) didn't pick up.
      Analyze history. Draft friendly WhatsApp message.
      ${agentIntent ? `Include Agent Intent: "${agentIntent}"` : ''}
      Constraint: Under 25 words. Casual.`
    });
    return response.text?.trim() || `Hey ${clientName}, missed you! Call me back when free?`;
  } catch (e) {
    return `Hey ${clientName}, missed you! Call me back when free?`;
  }
};

// --- NEW ANALYTICS & MARKET INTELLIGENCE ---

export interface PerformanceAnalysis {
  healthScore: number; // 0-100
  review: string;
  strengths: string[];
  weaknesses: string[];
}

export const generatePerformanceAnalysis = async (logs: InteractionLog[], agentName: string): Promise<PerformanceAnalysis> => {
  const client = getAI();
  if (!client || logs.length === 0) return { healthScore: 50, review: "No data yet.", strengths: [], weaknesses: [] };
  
  try {
    const total = logs.length;
    const paid = logs.filter(l => l.leadStatus === LeadStatus.PAID).length;
    const activity = logs.slice(0, 20).map(l => `${l.leadStatus}: ${l.description.substring(0, 20)}...`).join('\n');

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
      Act as a Sales Manager analyzing agent ${agentName}.
      Stats: ${paid}/${total} conversions.
      Recent Activity:
      ${activity}
      
      Return JSON:
      {
        "healthScore": number (0-100),
        "review": "2 sentence performance summary",
        "strengths": ["point 1", "point 2"],
        "weaknesses": ["point 1", "point 2"]
      }`,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return { healthScore: 0, review: "Analysis failed.", strengths: [], weaknesses: [] };
  }
};

export interface MarketIntel {
  today: string[];
  thisWeek: string[];
  thisMonth: string[];
  predictions: string[];
}

export const getMarketIntel = async (): Promise<MarketIntel> => {
  const client = getAI();
  if (!client) return { today: ["AI Config Missing"], thisWeek: [], thisMonth: [], predictions: [] };

  try {
    // We REMOVE responseMimeType: "application/json" because it conflicts with googleSearch tool
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
      Find the latest "Indian Stock Market" news.
      Focus on Nifty, Sensex, and major sectors.
      
      Categorize into:
      1. Today's Critical Updates (Top 3 items)
      2. This Week's Highlights
      3. This Month's Major Moves
      4. Predictions for next 3-12 months (Sectors with momentum)
      
      Return strictly as VALID JSON string (do not use markdown blocks):
      {
        "today": ["headline 1", "headline 2", ...],
        "thisWeek": [...],
        "thisMonth": [...],
        "predictions": [...]
      }`,
      config: { 
        tools: [{ googleSearch: {} }]
      }
    });
    
    // Manual JSON cleanup because we disabled json mode
    let text = response.text || "{}";
    // Remove markdown code blocks if present
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(text);
  } catch (e) {
    console.error("Market Intel Error", e);
    return { 
      today: ["Could not fetch live market data."], 
      thisWeek: ["Try again later."], 
      thisMonth: [], 
      predictions: [] 
    };
  }
};

export const getMarketDeepDive = async (topic: string): Promise<string> => {
  const client = getAI();
  if (!client) return "AI Unavailable";
  
  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
      Topic: "${topic}" (Indian Stock Market Context).
      
      Task: Explain this to a client in simple terms to build trust.
      Give a "Pro Tip" related to this news.
      Keep it short (3 sentences).`
    });
    return response.text?.trim() || "Details unavailable.";
  } catch (e) {
    return "Error generating deep dive.";
  }
};