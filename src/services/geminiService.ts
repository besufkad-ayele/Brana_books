import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Book, Page } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const generateStory = async (prompt: string): Promise<Partial<Book>> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Create a children's story based on: ${prompt}. 
    Return a JSON object with:
    - title: string
    - description: string (short summary)
    - pages: array of objects with { text: string (approx 2-3 sentences) }
    Limit to 6-8 pages.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          pages: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

export const generatePageImage = async (pageText: string, storyTheme: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: {
      parts: [
        { text: `A whimsical, colorful children's book illustration for this scene: "${pageText}". Style: soft watercolor, magical, friendly. Overall story theme: ${storyTheme}` }
      ]
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return "https://picsum.photos/seed/story/800/600";
};

export const speakText = async (text: string, voice: 'Kore' | 'Puck' = 'Kore'): Promise<string> => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voice },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (base64Audio) {
    return `data:audio/mp3;base64,${base64Audio}`;
  }
  throw new Error("Failed to generate audio");
};
