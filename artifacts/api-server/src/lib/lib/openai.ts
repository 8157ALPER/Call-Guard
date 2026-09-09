import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface CallAnalysis {
  risk: number;
  summary: string;
  keywords: string[];
  mood: {
    emoji: string;
    stressLevel: number;
    description: string;
  };
}

export async function analyzeCall(transcript: string): Promise<CallAnalysis> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert at detecting phone fraud, scams, and emotional stress in conversations. 
          Analyze the call transcript for:
          1. Fraud risk assessment
          2. Key suspicious elements
          3. Emotional state and stress level of the elderly person

          Respond with a JSON object containing:
          - risk (0-1 scale)
          - summary (brief analysis)
          - keywords (suspicious terms)
          - mood object with:
            - emoji (single emoji representing the emotional state)
            - stressLevel (0-1 scale)
            - description (brief emotional state description)`
        },
        {
          role: "user",
          content: transcript
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response content from OpenAI");
    }

    const result = JSON.parse(content) as CallAnalysis;

    return {
      risk: Math.min(Math.max(result.risk ?? 0, 0), 1),
      summary: result.summary ?? "No summary available",
      keywords: Array.isArray(result.keywords) ? result.keywords : [],
      mood: {
        emoji: result.mood?.emoji ?? "😐",
        stressLevel: Math.min(Math.max(result.mood?.stressLevel ?? 0, 0), 1),
        description: result.mood?.description ?? "No mood analysis available"
      }
    };
  } catch {
    console.error("OpenAI API call failed");
    throw new Error("Failed to analyze call");
  }
}