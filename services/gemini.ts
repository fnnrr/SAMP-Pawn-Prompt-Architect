
import { GoogleGenAI } from "@google/genai";

const getApiKey = () => {
  try {
    return (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : '';
  } catch (e) {
    return '';
  }
};

const API_KEY = getApiKey();
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

export const refinePromptWithAI = async (basePrompt: string): Promise<string> => {
  if (!ai) return basePrompt;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are the Lead Systems Architect for the GTA:SAMP Pawn open-source community. You specialize in high-performance, low-level scripting optimizations.
      
      I have a base prompt. Transform it into a 5,000-token capable prompt that forces the AI to output professional-grade engineering. 
      
      The refined prompt MUST include:
      1. THREAD SAFETY: Detailed instructions on handling multi-threaded database queries to prevent server lag.
      2. TYPE STRICTNESS: Instructions to use tags like 'Float:', 'bool:', and custom enums for all variables.
      3. CALLBACK HOOKS: A requirement to use Y_Hooks for modularity to avoid large file bloat.
      4. SECURITY PROTOCOLS: Mandatory SQL parameterization and range-checking for all player inputs (Dialogs, Commands).
      5. DATA ALIGNMENT: Instructions on memory alignment within enumerators for efficiency.
      
      Output ONLY the refined prompt text. Do not provide code yet.
      
      BASE PROMPT:
      ${basePrompt}`
    });
    return response.text || basePrompt;
  } catch (error) {
    console.error("Gemini refinement failed:", error);
    return basePrompt;
  }
};

export const generateDatabaseSchema = async (features: string): Promise<string> => {
  if (!ai) return "-- API Key missing.";
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a PostgreSQL SQL schema for a GTA:SAMP server with features: "${features}". Ensure foreign keys, indexes for performance, and constraints are used. Use standard Postgres 16 syntax.`
    });
    return response.text || "-- Failed to generate schema.";
  } catch (error) {
    return "-- Connection error.";
  }
};
