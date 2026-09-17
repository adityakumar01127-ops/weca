import { GoogleGenAI } from "@google/genai";
import { ScoreBreakdown, getTierFromScore, Category, RejectionCode } from "../types";
import { calculatePostScoringCredits } from "../credits";

export const WICA_SYSTEM_PROMPT = `You are the Weca Anomaly Engine — the world's premier AI arbiter of real-world weirdness, urban glitches, and physical serendipity.

Your mission is to analyze the attached image and rigorously evaluate whether it qualifies as an authentic, real-world ANOMALY on the Weca platform, and score its "Weird Point" and "Unique Point".

### 1. ELIGIBILITY CRITERIA:
A. QUALIFYING ANOMALIES (is_eligible = true):
   - Physical Reality Glitches: Accidental architectural errors, municipal blunders, weird plumbing, defying gravity or common sense.
   - Absurd Juxtapositions: Incongruous objects, people, or creatures in wildly unexpected physical environments.
   - Candid Real-Life Humor: Accidental public sign typos, unintentional real visual puns, unscripted surreal moments (NOT staged internet pranks).
   - Biological / Nature Curiosities: Mutant produce, bizarre botanical oddities, surreal animal behaviors.
   - Found Uncanny Objects: Bizarre thrift store relics, inexplicable physical artifacts.

B. REJECTED NON-ANOMALIES (is_eligible = false):
   - "mundane": Ordinary, everyday photos (standard selfie, cafe food, ordinary pet, clean room, common sunset, normal car).
   - "digital_screenshot": Screenshots of Twitter/X, Reddit, TikTok, text chats, meme template graphics, digital drawings.
   - "ai_generated": Synthetic or generative AI images (Midjourney, DALL-E, etc.).
   - "commercial_stock": Stock photography, studio advertisements, professional studio product renders.
   - "obstructed": Dark lens cap, blurry smudge, or completely indecipherable subject matter.
   - "prohibited": NSFW, graphic violence, private IDs.

### 2. SCORING SYSTEM (0 to 100):
- "weirdness_score" (0-100): Measures Absurdity, Incongruity, and "Wait, What?!" cognitive disruption.
  - 0-29: Mundane / normal (ineligible)
  - 30-49: Mild Curiosity (Quirky, but everyday)
  - 50-69: Certified Weird (Genuine double-take anomaly)
  - 70-84: Reality-Breaking (Surreal, deeply bizarre)
  - 85-100: Matrix Glitch / Cosmic Anomaly (Mind-bending physical finding)

- "uniqueness_score" (0-100): Measures Statistical Rarity, Freshness, and Photographic Authenticity.
  - 0-29: Internet cliché / common trope
  - 30-49: Uncommon sighting
  - 50-69: Distinctive discovery
  - 70-84: Rare collector's sighting
  - 85-100: Once-in-a-decade phenomenon

Score the subject matter, never the camera resolution or studio gear — a grainy phone photo of something genuinely strange scores just as high as a studio shot.

Return strict JSON only in this exact format:
{
  "is_eligible": boolean,
  "rejection_code": "mundane" | "digital_screenshot" | "ai_generated" | "commercial_stock" | "obstructed" | "prohibited" | null,
  "rejection_reason": string or null (if ineligible, 1-2 friendly coaching sentences explaining why and what Weca looks for; null if eligible),
  "weirdness_score": int (0-100),
  "uniqueness_score": int (0-100),
  "absurdity": int (0-10),
  "incongruity": int (0-10),
  "wit": int (0-10),
  "rarity": int (0-10),
  "freshness": int (0-10),
  "one_line_verdict": string (under 15 words, witty, punchy, shareable commentary),
  "suggested_category": "Nature" | "Food" | "Human-Made" | "Animals" | "Objects" | "Coincidences" | "Other",
  "suggested_tags": ["tag1", "tag2", "tag3"],
  "flags": array
}`;

export interface ScoreInput {
  base64Data: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
  category?: string;
  caption?: string | null;
}

export async function scoreImageWithGemini(input: ScoreInput): Promise<ScoreBreakdown> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey !== "your-gemini-api-key-here" && apiKey.trim() !== "") {
    // Try contemporary Gemini models in order
    const candidateModels = [
      "gemini-3.5-flash",
      "gemini-3.5-flash-lite",
      "gemini-3.6-flash",
      "gemini-3.7-flash",
      "gemini-flash-latest",
    ];

    for (const model of candidateModels) {
      try {
        const ai = new GoogleGenAI({ apiKey });

        const promptText = `${WICA_SYSTEM_PROMPT}\n\nPhoto Category Hint: ${input.category || "General"}${
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

        const weirdness_score = Math.max(0, Math.min(100, Math.round(Number(parsed.weirdness_score ?? parsed.weirdness) || 50)));
        const uniqueness_score = Math.max(0, Math.min(100, Math.round(Number(parsed.uniqueness_score ?? parsed.uniqueness) || 50)));
        const composite_score = Math.round((weirdness_score + uniqueness_score) / 2);

        const absurdity = Math.max(0, Math.min(10, Math.round(Number(parsed.absurdity) || Math.round(weirdness_score / 10))));
        const rarity = Math.max(0, Math.min(10, Math.round(Number(parsed.rarity) || Math.round(uniqueness_score / 10))));
        const craft = Math.max(0, Math.min(10, Math.round(Number(parsed.craft ?? parsed.freshness) || 6)));
        const cultural_novelty = Math.max(0, Math.min(10, Math.round(Number(parsed.cultural_novelty ?? parsed.incongruity) || 5)));
        const wit = Math.max(0, Math.min(10, Math.round(Number(parsed.wit) || 6)));

        const is_eligible = parsed.is_eligible !== undefined 
          ? Boolean(parsed.is_eligible)
          : (weirdness_score >= 30 || uniqueness_score >= 30);

        const rejection_code: RejectionCode | null = !is_eligible 
          ? (parsed.rejection_code || (weirdness_score < 30 && uniqueness_score < 30 ? "mundane" : null))
          : null;

        const rejection_reason = !is_eligible 
          ? (parsed.rejection_reason || "This photo does not exhibit enough weirdness or rarity for the Weca Anomaly Index. Keep searching for true physical oddities!")
          : null;

        const flags = Array.isArray(parsed.flags) ? parsed.flags : [];
        const one_line_verdict = typeof parsed.one_line_verdict === "string" 
          ? parsed.one_line_verdict 
          : "An unexpected glitch in everyday reality.";

        const { total: earned_credits } = calculatePostScoringCredits(weirdness_score, uniqueness_score);

        const tier = getTierFromScore(composite_score);

        return {
          absurdity,
          rarity,
          craft,
          cultural_novelty,
          wit,
          one_line_verdict,
          flags,
          composite_score,
          tier,
          is_eligible,
          rejection_code,
          rejection_reason,
          weirdness_score,
          uniqueness_score,
          earned_credits: is_eligible ? earned_credits : 0,
          suggested_category: (parsed.suggested_category as Category) || (input.category as Category) || "Objects",
          suggested_tags: Array.isArray(parsed.suggested_tags) ? parsed.suggested_tags : ["#glitch", "#curiosity"],
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

export function generateHeuristicScore(input: ScoreInput): ScoreBreakdown {
  const lowerCaption = (input.caption || "").toLowerCase();
  const isMemeOrScreenshot = /meme|screenshot|tweet|twitter|tiktok|reddit|chat|whatsapp|discord|retweet/.test(lowerCaption);
  const isMundane = /selfie|just me|boring|ordinary|normal day|my lunch|clean room|my bed/.test(lowerCaption);
  const isAiGen = /midjourney|dall-e|stable diffusion|ai generated|ai art|chatgpt/.test(lowerCaption);

  if (isMemeOrScreenshot) {
    return {
      absurdity: 3,
      rarity: 1,
      craft: 2,
      cultural_novelty: 2,
      wit: 4,
      one_line_verdict: "Digital memes and UI screenshots are not eligible for Weca's Anomaly Index.",
      flags: ["digital_screenshot"],
      composite_score: 18,
      tier: "Mildly Odd",
      is_eligible: false,
      rejection_code: "digital_screenshot",
      rejection_reason: "Digital meme or social media screenshot detected. Weca exclusively archives authentic real-world physical anomalies and candid optical glitches.",
      weirdness_score: 22,
      uniqueness_score: 14,
      earned_credits: 0,
      suggested_category: "Objects",
      suggested_tags: [],
    };
  }

  if (isMundane) {
    return {
      absurdity: 1,
      rarity: 2,
      craft: 3,
      cultural_novelty: 1,
      wit: 2,
      one_line_verdict: "Standard everyday subject matter without an anomaly.",
      flags: ["mundane"],
      composite_score: 15,
      tier: "Mildly Odd",
      is_eligible: false,
      rejection_code: "mundane",
      rejection_reason: "Everyday subject matter detected. Weca looks for uncanny coincidences, surreal physics glitches, or strange occurrences that make people do an instant double-take.",
      weirdness_score: 15,
      uniqueness_score: 15,
      earned_credits: 0,
      suggested_category: "Objects",
      suggested_tags: [],
    };
  }

  if (isAiGen) {
    return {
      absurdity: 5,
      rarity: 2,
      craft: 6,
      cultural_novelty: 3,
      wit: 4,
      one_line_verdict: "AI-generated synthetic image detected.",
      flags: ["ai_generated"],
      composite_score: 24,
      tier: "Mildly Odd",
      is_eligible: false,
      rejection_code: "ai_generated",
      rejection_reason: "Generative AI art detected. Weca only archives authentic, physical camera captures found in the wild.",
      weirdness_score: 24,
      uniqueness_score: 24,
      earned_credits: 0,
      suggested_category: "Objects",
      suggested_tags: [],
    };
  }

  const hash = (input.base64Data || "").slice(100, 300).split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const categoryBonus: Record<string, { abs: number; rar: number; wit: number }> = {
    Nature: { abs: 7, rar: 8, wit: 6 },
    Animals: { abs: 8, rar: 8, wit: 9 },
    Food: { abs: 8, rar: 7, wit: 8 },
    "Human-Made": { abs: 8, rar: 8, wit: 7 },
    Objects: { abs: 7, rar: 7, wit: 7 },
    Coincidences: { abs: 9, rar: 9, wit: 9 },
    Other: { abs: 8, rar: 8, wit: 8 },
  };

  const bonuses = categoryBonus[input.category || "Objects"] || { abs: 7, rar: 7, wit: 7 };

  const absurdity = Math.min(10, Math.max(4, ((hash % 5) + bonuses.abs) % 11));
  const rarity = Math.min(10, Math.max(5, (((hash >> 2) % 4) + bonuses.rar) % 11));
  const craft = Math.min(10, Math.max(3, ((hash >> 3) % 8) + 2));
  const cultural_novelty = Math.min(10, Math.max(2, ((hash >> 4) % 7) + 3));
  const wit = Math.min(10, Math.max(4, (((hash >> 1) % 4) + bonuses.wit) % 11));

  // Weirdness (0-100) and Uniqueness (0-100)
  const weirdness_score = Math.min(98, Math.max(35, Math.round((absurdity * 0.4 + cultural_novelty * 0.3 + wit * 0.3) * 10) + (hash % 12)));
  const uniqueness_score = Math.min(96, Math.max(38, Math.round((rarity * 0.5 + craft * 0.5) * 10) + ((hash >> 2) % 10)));
  const composite_score = Math.round((weirdness_score + uniqueness_score) / 2);

  const verdicts = [
    "A candid defiance of modern physics and architectural common sense.",
    "A delightfully baffling glitch in the fabric of ordinary existence.",
    "Genuinely rare, unmistakably strange, and impossible to stage convincingly.",
    "The universe caught in an awkward, hilarious coincidence.",
    "Unsettlingly clever with a punchy double-take factor.",
    "A pure botanical anomaly that refuses to play by the rules.",
    "An unscripted urban paradox hiding in broad daylight.",
  ];

  const one_line_verdict = verdicts[hash % verdicts.length];
  const tier = getTierFromScore(composite_score);
  const { total: earned_credits } = calculatePostScoringCredits(weirdness_score, uniqueness_score);

  return {
    absurdity,
    rarity,
    craft,
    cultural_novelty,
    wit,
    one_line_verdict,
    flags: [],
    composite_score,
    tier,
    is_eligible: true,
    rejection_code: null,
    rejection_reason: null,
    weirdness_score,
    uniqueness_score,
    earned_credits,
    suggested_category: (input.category as Category) || "Objects",
    suggested_tags: ["#weirdfind", "#anomaly", "#urbanartifact"],
  };
}
