
import { GoogleGenAI, Modality } from "@google/genai";
import { GeneratorModel, GenerateImageParams, GenerateTextParams, GenerateSearchParams } from "../types";
import { getUserApiKey } from "./storageService";

// Helper to get the current valid API key
export const getActiveApiKey = () => {
  return getUserApiKey() || process.env.API_KEY;
};

// Helper to check if we are forced to use a user key
export const isKeyRequired = () => {
  const sysKey = process.env.API_KEY || "";
  const userKey = getUserApiKey();
  return sysKey.toLowerCase().startsWith('demo') && !userKey;
};

// Initialize AI on demand to ensure we always use the latest key
export const getAI = () => {
  const apiKey = getActiveApiKey();
  if (!apiKey) throw new Error("API Key is missing. Please provide a Gemini API Key in Settings.");
  return new GoogleGenAI({ apiKey });
};

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

// Internal function for a single generation request
const generateSingleImage = async (params: GenerateImageParams): Promise<string[]> => {
    const ai = getAI();
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

    let finalPrompt = params.prompt;
    if (params.camera) {
        finalPrompt = `${finalPrompt}, ${params.camera}`;
    }
    
    // Construct Image Config dynamically
    const imageConfig: any = {};
    
    // Valid Aspect Ratios supported by Gemini API
    const SUPPORTED_RATIOS = ["1:1", "3:4", "4:3", "9:16", "16:9"];

    if (params.aspectRatio) {
        if (SUPPORTED_RATIOS.includes(params.aspectRatio)) {
            // Use native API config for supported ratios
            imageConfig.aspectRatio = params.aspectRatio;
        } else {
            // Fallback: Append to prompt for unsupported ratios (e.g. 21:9)
            finalPrompt = `${finalPrompt}, aspect ratio ${params.aspectRatio}`;
        }
    }

    // Append the final prompt text
    parts.push({ text: finalPrompt });

    // Gemini 3 Pro Image Preview supports imageSize. 
    if (params.model === GeneratorModel.GEMINI_PRO_IMAGE) {
        imageConfig.imageSize = params.imageSize || "1K";
    }

    // Only add imageConfig to request if it has properties
    const config: any = {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
    };

    if (Object.keys(imageConfig).length > 0) {
        config.imageConfig = imageConfig;
    }

    try {
      console.log(">>> [GeminiService] Sending Request:", { model: params.model, config: params, computedConfig: config });

      const response = await ai.models.generateContent({
        model: params.model,
        contents: {
          parts: parts,
        },
        config: config
      });

      const images: string[] = [];

      if (response.candidates) {
          response.candidates.forEach(candidate => {
              if (candidate.content && candidate.content.parts) {
                  candidate.content.parts.forEach(part => {
                      if (part.inlineData && part.inlineData.data) {
                          const mimeType = part.inlineData.mimeType || 'image/png';
                          images.push(`data:${mimeType};base64,${part.inlineData.data}`);
                      }
                  });
              }
          });
      }
      
      if (images.length > 0) {
          return images;
      }
      
      throw new Error("No image generated in response");

    } catch (error) {
      console.error("Gemini Image Gen Error:", error);
      throw error;
    }
};

export const generateImageContent = async (params: GenerateImageParams): Promise<string[]> => {
  if (isKeyRequired()) {
    throw new Error("DEMO_KEY_RESTRICTION: The current system key is for demonstration only. Please enter your own Gemini API Key in Settings to enable generation.");
  }

  const count = params.numberOfImages || 1;
  
  // Create an array of promises to run in parallel
  const promises = Array.from({ length: count }).map(() => 
    withRetry(() => generateSingleImage(params))
  );

  try {
      const resultsNested = await Promise.all(promises);
      const results = resultsNested.flat();
      return results;
  } catch (error) {
      throw error;
  }
};

// --- NEW Text Generation with Thinking ---
export const generateTextContent = async (params: GenerateTextParams): Promise<string> => {
  if (isKeyRequired()) {
     throw new Error("DEMO_KEY_RESTRICTION");
  }

  return withRetry(async () => {
      const ai = getAI();
      const parts: any[] = [];

      // Add Images if any
      if (params.images) {
          params.images.forEach(img => {
               const imageData = img.startsWith('data:') ? img.split(',')[1] : img;
               parts.push({
                   inlineData: {
                       mimeType: 'image/png',
                       data: imageData
                   }
               });
          });
      }

      parts.push({ text: params.prompt });

      const config: any = {};
      
      // Add Thinking Budget if specified (Only for 2.5/3 models)
      if (params.thinkingBudget && params.thinkingBudget > 0) {
          config.thinkingConfig = { thinkingBudget: params.thinkingBudget };
      }

      const response = await ai.models.generateContent({
          model: params.model,
          contents: { parts },
          config
      });

      return response.text || "";
  });
};

// --- NEW Search Generation ---
export const generateSearchContent = async (params: GenerateSearchParams): Promise<{ text: string, sources?: {uri: string, title: string}[] }> => {
    if (isKeyRequired()) {
        throw new Error("DEMO_KEY_RESTRICTION");
    }

    return withRetry(async () => {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview', // Search works best/only with Pro
            contents: params.query,
            config: {
                tools: [{ googleSearch: {} }]
            }
        });

        // Extract Sources from Grounding Metadata
        const sources: {uri: string, title: string}[] = [];
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        
        if (chunks) {
            chunks.forEach((chunk: any) => {
                if (chunk.web) {
                    sources.push({ uri: chunk.web.uri, title: chunk.web.title });
                }
            });
        }

        return {
            text: response.text || "No result found.",
            sources: sources.length > 0 ? sources : undefined
        };
    });
};


export const optimizePrompt = async (rawPrompt: string): Promise<string> => {
  if (isKeyRequired()) {
      throw new Error("DEMO_KEY_RESTRICTION");
  }

  return withRetry(async () => {
    const ai = getAI();
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are an expert prompt engineer for AI image generators. Rewrite the following user description into a highly detailed, artistic, and effective image generation prompt. Keep it under 100 words. \n\nUser Input: "${rawPrompt}"\n\nOptimized Prompt:`,
      });
      let text = response.text || rawPrompt;
      text = text.replace(/^(\*\*?)?Optimized Prompt:?(\*\*?)?\s*/i, "").trim();
      return text;
    } catch (error) {
      console.error("Prompt Optimization Error:", error);
      throw error;
    }
  });
};

export const imageToText = async (imageBase64: string): Promise<string> => {
  if (isKeyRequired()) {
      throw new Error("DEMO_KEY_RESTRICTION");
  }

  return withRetry(async () => {
    const ai = getAI();
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
