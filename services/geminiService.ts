import { GoogleGenAI, Type } from "@google/genai";
import { Mapping } from '../types';

// Initialize the Gemini API client
// The API key is assumed to be available in process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const suggestMappings = async (
  momHeaders: string[],
  canvasHeaders: string[]
): Promise<Mapping[]> => {
  if (!process.env.API_KEY) {
    console.warn("API Key missing, skipping AI mapping");
    return [];
  }

  const prompt = `
    I have two lists of column headers from two different gradebooks.
    List A (MyOpenMath): ${JSON.stringify(momHeaders)}
    List B (Canvas): ${JSON.stringify(canvasHeaders)}
    
    My goal is to import grades from List A to List B.
    Find the best matching assignment columns. 
    Ignore identifying columns like "Name", "ID", "Email", "Section".
    Focus on Homework, Quizzes, Exams, etc.
    
    Return a JSON array of objects with "momColumn" and "canvasColumn".
    Only return high-confidence matches.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              momColumn: { type: Type.STRING },
              canvasColumn: { type: Type.STRING }
            },
            required: ["momColumn", "canvasColumn"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    
    return JSON.parse(text) as Mapping[];
  } catch (error) {
    console.error("Gemini mapping error:", error);
    return [];
  }
};

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
