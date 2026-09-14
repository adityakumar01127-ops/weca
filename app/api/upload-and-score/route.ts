import { NextRequest, NextResponse } from "next/server";
import { scoreImageWithGemini } from "@/lib/services/scoring";
import { saveScoredImage } from "@/lib/services/data";
import { Category } from "@/lib/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimiter, RATE_PRESETS } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import sharp from "sharp";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit

export async function POST(req: NextRequest) {
  const start = Date.now();
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;
    const category = (formData.get("category") as Category) || "Other";
    const caption = (formData.get("caption") as string) || null;
    const country = (formData.get("country") as string) || null;
    const userId = (formData.get("userId") as string) || "";
    const username = (formData.get("username") as string) || "explorer";
    const avatarUrl = (formData.get("avatarUrl") as string) || null;

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required: Please sign in to submit findings." },
        { status: 401 }
      );
    }

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

    // Convert file to buffer and base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mimeType = file.type || "image/jpeg";

    // Optimize image buffer to modern web format (WebP max 1400px width)
    let uploadBuffer = buffer;
    let uploadMime = mimeType;
    let fileExt = "jpg";

    try {
      uploadBuffer = await sharp(buffer)
        .resize({ width: 1400, withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();
      uploadMime = "image/webp";
      fileExt = "webp";
    } catch (optErr) {
      console.warn("Sharp optimization skipped, using original buffer:", optErr);
      fileExt = file.name ? file.name.split(".").pop() || "jpg" : "jpg";
    }

    const base64Data = uploadBuffer.toString("base64");
    const mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif" = "image/webp";

    // 1. Upload to Supabase Storage if configured
    let storagePath = "";
    const supabase = createAdminClient();

    if (supabase) {
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("wica-images")
        .upload(filePath, uploadBuffer, {
          contentType: uploadMime,
          upsert: true,
        });

      if (!uploadError && uploadData) {
        const { data: publicUrlData } = supabase.storage
          .from("wica-images")
          .getPublicUrl(filePath);
        storagePath = publicUrlData.publicUrl;
      }
    }

    // Fallback storage path if Supabase is not connected
    if (!storagePath) {
      storagePath = `data:${mimeType};base64,${base64Data}`;
    }

    // 2. Call the Weirdness Engine (Gemini Vision API)
    const scoreBreakdown = await scoreImageWithGemini({
      base64Data,
      mediaType,
      category,
      caption,
    });

    // 3. Save to database / local store
    const savedImage = await saveScoredImage({
      userId,
      storagePath,
      category,
      caption,
      country,
      scoreBreakdown,
      authorUser: {
        username,
        avatar_url: avatarUrl,
      },
    });

    logger.info("Image uploaded and scored", {
      userId,
      imageId: savedImage.id,
      category,
      durationMs: Date.now() - start,
    });

    return NextResponse.json({
      success: true,
      image: savedImage,
      scoreBreakdown,
      moderationStatus: savedImage.moderation_status,
      heldForReview: savedImage.moderation_status === "pending_review",
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
