import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GeneratedData } from "../types";

// Initialize Gemini Client
// IMPORTANT: process.env.API_KEY must be set in your environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const contentSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Optimization of the user title for article context (but user input title will be used for H1)." },
    introduction: { type: Type.STRING, description: "A comprehensive and engaging introduction (100-150 words) in Simplified Chinese." },
    sections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          heading: { type: Type.STRING, description: "Subheading for the section." },
          content: { type: Type.STRING, description: "Detailed paragraph content (200+ words). Must be informative and high quality to avoid spam detection." }
        },
        required: ["heading", "content"]
      },
      description: "Generate exactly 3 detailed sections for the article."
    },
    conclusion: { type: Type.STRING, description: "A solid conclusion paragraph." },
    imagePrompts: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Create exactly 3 distinct English prompts for AI image generation. CRITICAL: The prompts must be strictly describing the visual representation of the USER'S KEYWORD to ensure relevance. Do not deviate to abstract concepts.",
    }
  },
  required: ["title", "introduction", "sections", "conclusion", "imagePrompts"]
};

export const generatePageContent = async (userTitle: string): Promise<GeneratedData> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an expert SEO content writer. Write a high-quality, substantial article in Simplified Chinese (简体中文) based on the keyword: "${userTitle}".
      
      Requirements:
      1. Content must be original, informative, and professional to ensure it is NOT flagged as spam or low-quality content.
      2. Each section must be detailed (at least 200 words per section).
      3. The tone should be authoritative yet accessible.
      4. Strictly follow the JSON schema provided.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: contentSchema,
      }
    });

    if (!response.text) {
      throw new Error("Gemini 未返回任何文本。");
    }

    return JSON.parse(response.text) as GeneratedData;
  } catch (error) {
    console.error("Content generation error:", error);
    throw error;
  }
};

export const generateIllustration = async (prompt: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        // We use gemini-2.5-flash-image which returns base64 inline data
      }
    });

    // Extract base64 image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData && part.inlineData.data) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;

  } catch (error) {
    console.error("Image generation error:", error);
    // Return null so the UI can handle partial failures gracefully
    return null;
  }
};