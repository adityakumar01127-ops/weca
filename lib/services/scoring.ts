import { GoogleGenAI } from "@google/genai";
import { ScoreBreakdown, getTierFromScore } from "../types";

export const WICA_SYSTEM_PROMPT = `You are the Weca Weirdness Engine. Analyze the attached image and score it
0-10 on each dimension:

1. Absurdity — how unexpected or incongruous is the combination of elements?
2. Rarity — how rarely would an average person encounter this exact scene?
3. Craft — does the weirdness look intentional/staged, or like a candid find?
   (Score this neutrally — both are valid, this is for transparency only.)
4. Cultural novelty — is there a distinctive regional/cultural element likely
   unfamiliar to a global audience?
5. Wit — does it provoke a laugh or a delighted "wait, what?" reaction?

Score the subject matter, never the photo's technical quality — a blurry
phone photo of something genuinely strange should score as well as a
studio shot of the same thing.

Return strict JSON only:
{
  "absurdity": int, "rarity": int, "craft": int,
  "cultural_novelty": int, "wit": int,
  "one_line_verdict": string (under 15 words, punchy and shareable),
  "flags": array (any of: "likely_ai_generated", "likely_repost",
                  "needs_moderation_review" — empty array if none apply)
}`;

export interface ScoreInput {
  base64Data: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
  category: string;
  caption?: string | null;
}

export async function scoreImageWithGemini(input: ScoreInput): Promise<ScoreBreakdown> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey !== "your-gemini-api-key-here" && apiKey.trim() !== "") {
    // Try contemporary Gemini models in order
    const candidateModels = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-flash-latest"];

    for (const model of candidateModels) {
      try {
        const ai = new GoogleGenAI({ apiKey });

        const promptText = `${WICA_SYSTEM_PROMPT}\n\nPhoto Category: ${input.category}${
          input.caption ? `\nUser Caption: "${input.caption}"` : ""
        }\nAnalyze the image and score it strictly according to the rubric. Return strict JSON only.`;

        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              role: "user",
              parts: [
                {
                  inlineData: {
                    mimeType: input.mediaType,
                    data: input.base64Data,
                  },
                },
                {
                  text: promptText,
                },
              ],
            },
          ],
        });

        const responseText = (response.text || "").trim();
        if (!responseText) continue;

        // Extract JSON if wrapped in markdown code blocks
        const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, responseText];
        const rawJson = jsonMatch[1] || responseText;
        const parsed = JSON.parse(rawJson);

        const absurdity = Math.max(0, Math.min(10, Math.round(Number(parsed.absurdity) || 5)));
        const rarity = Math.max(0, Math.min(10, Math.round(Number(parsed.rarity) || 5)));
        const craft = Math.max(0, Math.min(10, Math.round(Number(parsed.craft) || 5)));
        const cultural_novelty = Math.max(0, Math.min(10, Math.round(Number(parsed.cultural_novelty) || 5)));
        const wit = Math.max(0, Math.min(10, Math.round(Number(parsed.wit) || 5)));
        const flags = Array.isArray(parsed.flags) ? parsed.flags : [];
        const one_line_verdict = typeof parsed.one_line_verdict === "string" 
          ? parsed.one_line_verdict 
          : "An unexpected glitch in everyday reality.";

        // Composite Weca Score = five dimensions summed (0..50) and scaled to 0..100
        const composite_score = (absurdity + rarity + craft + cultural_novelty + wit) * 2;

        return {
          absurdity,
          rarity,
          craft,
          cultural_novelty,
          wit,
          one_line_verdict,
          flags,
          composite_score,
          tier: getTierFromScore(composite_score),
        };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.warn(`Gemini (${model}) scoring error:`, errorMsg);
      }
    }
  }

  // Fallback heuristic scoring engine for local dev / offline mode
  return generateHeuristicScore(input);
}

// Aliases
export const scoreImageWithClaude = scoreImageWithGemini;
export const scoreImageWithAI = scoreImageWithGemini;

function generateHeuristicScore(input: ScoreInput): ScoreBreakdown {
  const hash = input.base64Data.slice(100, 300).split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const categoryBonus = {
    Nature: { abs: 7, rar: 9, wit: 6 },
    Animals: { abs: 9, rar: 8, wit: 9 },
    Food: { abs: 8, rar: 7, wit: 8 },
    "Human-Made": { abs: 8, rar: 8, wit: 7 },
    Objects: { abs: 7, rar: 7, wit: 7 },
    Coincidences: { abs: 9, rar: 9, wit: 9 },
    Other: { abs: 8, rar: 8, wit: 8 },
  }[input.category] || { abs: 7, rar: 7, wit: 7 };

  const absurdity = Math.min(10, Math.max(4, ((hash % 5) + categoryBonus.abs) % 11));
  const rarity = Math.min(10, Math.max(5, (((hash >> 2) % 4) + categoryBonus.rar) % 11));
  const craft = Math.min(10, Math.max(3, ((hash >> 3) % 8) + 2));
  const cultural_novelty = Math.min(10, Math.max(2, ((hash >> 4) % 7) + 3));
  const wit = Math.min(10, Math.max(4, (((hash >> 1) % 4) + categoryBonus.wit) % 11));

  const composite_score = (absurdity + rarity + craft + cultural_novelty + wit) * 2;

  const verdicts = [
    "A candid defiance of modern physics and architectural common sense.",
    "A delightfully baffling glitch in the fabric of ordinary existence.",
    "Genuinely rare, unmistakably strange, and impossible to stage convincingly.",
    "The universe caught in an awkward, hilarious coincidence.",
    "Unsettlingly clever with a punchy double-take factor.",
    "A pure botanical anomaly that refuses to play by the rules.",
  ];

  const one_line_verdict = verdicts[hash % verdicts.length];

  return {
    absurdity,
    rarity,
    craft,
    cultural_novelty,
    wit,
    one_line_verdict,
    flags: [],
    composite_score,
    tier: getTierFromScore(composite_score),
  };
}
