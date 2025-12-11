import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini API client
// The API key is assumed to be available in process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeGradeData = async (
  stats: string
): Promise<string> => {
  if (!process.env.API_KEY) return "AI analysis unavailable (Missing API Key).";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
        Analyze the following grade distribution statistics and provide a brief, professional summary (max 3 sentences) suitable for an instructor. 
        Highlight any concerns or successes.
        
        Stats: ${stats}
      `,
    });
    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Gemini analysis error:", error);
    return "Error generating analysis.";
  }
};