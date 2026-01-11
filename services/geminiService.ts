import { GoogleGenAI } from "@google/genai";
import { GeneratorModel, GenerateImageParams } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Retry Logic ---
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

const withRetry = async <T>(
  operation: () => Promise<T>, 
  retries = MAX_RETRIES, 
  delay = INITIAL_RETRY_DELAY
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    if (retries <= 0) throw error;
    console.warn(`Gemini API call failed. Retrying in ${delay}ms... (Attempts left: ${retries})`, error);
    await new Promise(resolve => setTimeout(resolve, delay));
    return withRetry(operation, retries - 1, delay * 2);
  }
};

// Helper to encode file to base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error("Failed to decode file"));
      }
    };
    reader.onerror = error => reject(error);
  });
};

export const generateImageContent = async (params: GenerateImageParams): Promise<string> => {
  return withRetry(async () => {
    const parts: any[] = [];
    
    const allImages: string[] = [];
    if (params.images && Array.isArray(params.images)) {
      allImages.push(...params.images);
    }
    if (params.image) {
      allImages.push(params.image);
    }

    const uniqueImages = Array.from(new Set(allImages.filter(Boolean)));

    for (const img of uniqueImages) {
        const imageData = img.startsWith('data:') ? img.split(',')[1] : img;
        parts.push({
          inlineData: {
            mimeType: 'image/png',
            data: imageData,
          }
        });
    }

    // Append Camera/Shot Instructions to Prompt
    let finalPrompt = params.prompt;
    if (params.camera) {
        // Append camera details to the end of the prompt
        finalPrompt = `${finalPrompt}, ${params.camera}`;
    }

    parts.push({ text: finalPrompt });

    try {
      const response = await ai.models.generateContent({
        model: params.model,
        contents: {
          parts: parts,
        },
        config: {
          imageConfig: {
            aspectRatio: params.aspectRatio || "16:9",
            imageSize: params.model === GeneratorModel.GEMINI_PRO_IMAGE ? (params.imageSize || "1K") : undefined
          }
        }
      });

      if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
      }
      
      throw new Error("No image generated in response");

    } catch (error) {
      console.error("Gemini Image Gen Error:", error);
      throw error;
    }
  });
};

export const optimizePrompt = async (rawPrompt: string): Promise<string> => {
  return withRetry(async () => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are an expert prompt engineer for AI image generators. Rewrite the following user description into a highly detailed, artistic, and effective image generation prompt. Keep it under 100 words. \n\nUser Input: "${rawPrompt}"\n\nOptimized Prompt:`,
      });
      let text = response.text || rawPrompt;
      // Clean up potential prefixes
      text = text.replace(/^(\*\*?)?Optimized Prompt:?(\*\*?)?\s*/i, "").trim();
      return text;
    } catch (error) {
      console.error("Prompt Optimization Error:", error);
      throw error;
    }
  });
};

export const imageToText = async (imageBase64: string): Promise<string> => {
  return withRetry(async () => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', 
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: 'image/png',
                data: imageBase64,
              },
            },
            {
              text: "Describe this image in detail, focusing on style, composition, lighting, and subject matter.",
            },
          ],
        },
      });
      return response.text || "Could not analyze image.";
    } catch (error) {
      console.error("Image to Text Error:", error);
      throw error;
    }
  });
};