import { NextRequest, NextResponse } from "next/server";
import { scoreImageWithGemini } from "@/lib/services/scoring";
import { Category } from "@/lib/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimiter, RATE_PRESETS } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { getAuthenticatedUser } from "@/lib/auth-server";
import { recordCreditTransaction } from "@/lib/credits";
import sharp from "sharp";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit

export async function POST(req: NextRequest) {
  const start = Date.now();
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required: Please sign in to submit findings." },
        { status: 401 }
      );
    }
    const userId = user.id;

    const formData = await req.formData();
    const file = formData.get("image") as File | null;
    const category = (formData.get("category") as Category) || "Other";
    const caption = (formData.get("caption") as string) || null;

    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    // Security & resource check: max 10MB
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Image file exceeds the 10MB size limit." },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!file.type || !file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Invalid file type. Only image files are permitted." },
        { status: 400 }
      );
    }

    // Rate limit per user
    const rateCheck = rateLimiter.check(`upload:${userId}`, RATE_PRESETS.uploadAndScore);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Upload limit reached. Please wait before uploading another image." },
        {
          status: 429,
          headers: { "Retry-After": String(rateCheck.retryAfterSeconds) },
        }
      );
    }

    // Convert file to buffer and optimize
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mimeType = file.type || "image/jpeg";

    let uploadBuffer = buffer;
    let uploadMime = mimeType;
    let fileExt = "webp";

    try {
      uploadBuffer = await sharp(buffer)
        .resize({ width: 1400, withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();
      uploadMime = "image/webp";
    } catch (optErr) {
      console.warn("Sharp optimization skipped, using original buffer:", optErr);
      fileExt = file.name ? file.name.split(".").pop() || "jpg" : "jpg";
    }

    const base64Data = uploadBuffer.toString("base64");
    const mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif" = "image/webp";

    // 1. Upload to Supabase Storage
    let storagePath = "";
    const supabase = createAdminClient();

    if (supabase) {
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      // Upload to 'posts' storage bucket (fallback to 'wica-images')
      const targetBucket = "posts";
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(targetBucket)
        .upload(filePath, uploadBuffer, {
          contentType: uploadMime,
          upsert: true,
        });

      if (!uploadError && uploadData) {
        const { data: publicUrlData } = supabase.storage
          .from(targetBucket)
          .getPublicUrl(filePath);
        storagePath = publicUrlData.publicUrl;
      }
    }

    // Fallback data URI if Supabase storage is unconfigured
    if (!storagePath) {
      storagePath = `data:${uploadMime};base64,${base64Data}`;
    }

    // 2. Call the Weirdness Engine (Gemini Vision API)
    const scoreBreakdown = await scoreImageWithGemini({
      base64Data,
      mediaType,
      category,
      caption,
    });

    // 3. Save post record directly to Supabase PostgreSQL posts table
    let savedPost: any = null;
    if (supabase) {
      const { data: postData, error: postErr } = await supabase
        .from("posts")
        .insert({
          user_id: userId,
          image_url: storagePath,
          caption: caption?.trim() || null,
          weirdness_score: scoreBreakdown.composite_score,
          uniqueness_score: Math.min(100, scoreBreakdown.rarity * 10),
          scoring_status: "completed",
        })
        .select(`
          id,
          user_id,
          image_url,
          caption,
          weirdness_score,
          uniqueness_score,
          scoring_status,
          created_at,
          profiles!posts_user_id_fkey (
            id,
            username,
            display_name,
            avatar_url,
            credits_balance
          )
        `)
        .single();

      if (!postErr && postData) {
        savedPost = postData;

        // Accrue Weird Credits for anomaly discovery
        await recordCreditTransaction(supabase, {
          userId,
          amount: scoreBreakdown.composite_score,
          reason: `Discovery Bonus: ${scoreBreakdown.composite_score} WC for ${category}`,
          postId: postData.id,
        });
      }
    }

    logger.info("Image uploaded and scored", {
      userId,
      postId: savedPost?.id,
      category,
      durationMs: Date.now() - start,
    });

    return NextResponse.json({
      success: true,
      post: savedPost,
      image: {
        id: savedPost?.id || `img_${Date.now()}`,
        user_id: userId,
        storage_path: storagePath,
        category,
        caption,
        wica_score: scoreBreakdown.composite_score,
        ai_verdict: scoreBreakdown.one_line_verdict,
        moderation_status: "approved",
      },
      scoreBreakdown,
    });
  } catch (error: unknown) {
    logger.error("Upload & scoring error", { error, durationMs: Date.now() - start });
    const errorMsg = error instanceof Error ? error.message : "Failed to process and score image";
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    );
  }
}

