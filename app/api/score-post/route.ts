import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { calculatePostScoringCredits, recordCreditTransaction } from "@/lib/credits";
import { scoreImageWithGemini, generateHeuristicScore } from "@/lib/services/scoring";
import { getAuthenticatedUser } from "@/lib/auth-server";
import { Category } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const record = body.record || body;
    const mode = body.mode || req.nextUrl.searchParams.get("mode");

    const imageUrl = record.image_url || record.imageUrl || record.image;
    const caption = record.caption || "";
    const category = (record.category as Category) || "Objects";
    const postId = record.id || record.postId;

    // 1. Authorization Guard:
    // Pre-check mode allows in-flight anomaly scanning for photo eligibility.
    // Post-commit scoring (which mints credits & writes to DB) strictly requires authentication.
    const isPrecheck = mode === "precheck" || !postId;

    if (!isPrecheck) {
      const authHeader = req.headers.get("authorization");
      const internalSecretHeader = req.headers.get("x-internal-secret");
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      let isAuthorized = false;
      if (
        serviceKey &&
        (authHeader === `Bearer ${serviceKey}` || internalSecretHeader === serviceKey)
      ) {
        isAuthorized = true;
      } else {
        const sessionUser = await getAuthenticatedUser(req);
        if (sessionUser) {
          isAuthorized = true;
        }
      }

      if (!isAuthorized) {
        return NextResponse.json(
          { error: "Unauthorized. Authentication required to evaluate or score anomalies." },
          { status: 401 }
        );
      }
    }

    // -----------------------------------------------------------------
    // MODE A: In-flight Pre-Check (Live AI Anomaly Scanner)
    // -----------------------------------------------------------------
    if (mode === "precheck" || !postId) {
      if (!imageUrl) {
        return NextResponse.json(
          { error: "Missing required image_url or image data for pre-check" },
          { status: 400 }
        );
      }

      let base64Data = "";
      let mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif" = "image/jpeg";

      if (imageUrl.startsWith("data:")) {
        const parts = imageUrl.split(",");
        const match = parts[0].match(/:(.*?);/);
        if (match) mediaType = match[1] as any;
        base64Data = parts[1] || "";
      } else {
        try {
          const imageRes = await fetch(imageUrl);
          if (imageRes.ok) {
            const ct = imageRes.headers.get("content-type");
            if (ct) mediaType = ct.split(";")[0].trim() as any;
            const arrayBuffer = await imageRes.arrayBuffer();
            base64Data = Buffer.from(arrayBuffer).toString("base64");
          }
        } catch (fetchErr) {
          console.warn("Could not fetch remote image for base64:", fetchErr);
        }
      }

      let evaluation;
      if (base64Data) {
        evaluation = await scoreImageWithGemini({
          base64Data,
          mediaType,
          category,
          caption,
        });
      } else {
        evaluation = generateHeuristicScore({
          base64Data: imageUrl,
          mediaType: "image/jpeg",
          category,
          caption,
        });
      }

      return NextResponse.json({
        success: true,
        mode: "precheck",
        evaluation: {
          is_eligible: evaluation.is_eligible ?? true,
          rejection_code: evaluation.rejection_code ?? null,
          rejection_reason: evaluation.rejection_reason ?? null,
          weirdness_score: evaluation.weirdness_score ?? Math.round(evaluation.composite_score * 0.95),
          uniqueness_score: evaluation.uniqueness_score ?? Math.round(evaluation.composite_score * 1.05),
          composite_score: evaluation.composite_score,
          tier: evaluation.tier,
          one_line_verdict: evaluation.one_line_verdict,
          earned_credits: evaluation.earned_credits ?? 25,
          suggested_category: evaluation.suggested_category || category,
          suggested_tags: evaluation.suggested_tags || ["#anomaly", "#weirdness"],
          dimensions: {
            absurdity: evaluation.absurdity,
            incongruity: evaluation.cultural_novelty,
            wit: evaluation.wit,
            rarity: evaluation.rarity,
            freshness: evaluation.craft,
          },
          flags: evaluation.flags || [],
        },
      });
    }

    // -----------------------------------------------------------------
    // MODE B: Post-Commit Scoring (Saves to DB & Mints Credits)
    // -----------------------------------------------------------------
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const activeServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    let supabase = null;
    if (supabaseUrl && activeServiceKey) {
      supabase = createClient(supabaseUrl, activeServiceKey);
    }

    if (supabase) {
      const { data: postRecord, error: postFetchErr } = await supabase
        .from("posts")
        .select("id, user_id, weirdness_score, uniqueness_score, scoring_status")
        .eq("id", postId)
        .maybeSingle();

      if (postFetchErr || !postRecord) {
        return NextResponse.json(
          { error: "Post record not found in database" },
          { status: 404 }
        );
      }

      // If already scored, return existing scores without re-scoring
      if (postRecord.weirdness_score != null && postRecord.scoring_status === "completed") {
        return NextResponse.json({
          success: true,
          post_id: postId,
          scores: {
            weirdness: postRecord.weirdness_score,
            uniqueness: postRecord.uniqueness_score,
          },
          alreadyScored: true,
        });
      }
    }

    // Prepare image data for scoring
    let base64Data = "";
    let mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif" = "image/jpeg";

    if (imageUrl.startsWith("data:")) {
      const parts = imageUrl.split(",");
      const match = parts[0].match(/:(.*?);/);
      if (match) mediaType = match[1] as any;
      base64Data = parts[1] || "";
    } else {
      try {
        const imageRes = await fetch(imageUrl);
        if (imageRes.ok) {
          const ct = imageRes.headers.get("content-type");
          if (ct) mediaType = ct.split(";")[0].trim() as any;
          const arrayBuffer = await imageRes.arrayBuffer();
          base64Data = Buffer.from(arrayBuffer).toString("base64");
        }
      } catch (fetchErr) {
        console.warn("Could not fetch remote image for base64:", fetchErr);
      }
    }

    const evaluation = base64Data
      ? await scoreImageWithGemini({ base64Data, mediaType, category, caption })
      : generateHeuristicScore({ base64Data: imageUrl, mediaType: "image/jpeg", category, caption });

    const weirdness = evaluation.weirdness_score ?? Math.round(evaluation.composite_score * 0.95);
    const uniqueness = evaluation.uniqueness_score ?? Math.round(evaluation.composite_score * 1.05);

    if (supabase) {
      // Update post scores
      await supabase
        .from("posts")
        .update({
          weirdness_score: weirdness,
          uniqueness_score: uniqueness,
          scoring_status: "completed",
        })
        .eq("id", postId);

      // Accrue credits to post owner
      let postUserId = record.user_id;
      if (!postUserId) {
        const { data: pData } = await supabase
          .from("posts")
          .select("user_id")
          .eq("id", postId)
          .single();
        postUserId = pData?.user_id;
      }

      if (postUserId) {
        const { data: existingTx } = await supabase
          .from("credit_transactions")
          .select("id")
          .eq("post_id", postId)
          .maybeSingle();

        if (!existingTx) {
          const { total: earnedCredits } = calculatePostScoringCredits(weirdness, uniqueness);
          if (earnedCredits > 0) {
            await recordCreditTransaction(supabase, {
              userId: postUserId,
              amount: earnedCredits,
              reason: `Anomaly Scored: Weirdness ${weirdness} + Uniqueness ${uniqueness} [${evaluation.tier}]`,
              postId: postId,
            });
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      post_id: postId,
      scores: {
        weirdness,
        uniqueness,
      },
      evaluation: {
        is_eligible: evaluation.is_eligible ?? true,
        rejection_code: evaluation.rejection_code ?? null,
        rejection_reason: evaluation.rejection_reason ?? null,
        tier: evaluation.tier,
        one_line_verdict: evaluation.one_line_verdict,
        earned_credits: evaluation.earned_credits ?? 0,
        suggested_category: evaluation.suggested_category,
        suggested_tags: evaluation.suggested_tags,
      },
    });
  } catch (err) {
    console.error("API score-post handler error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
