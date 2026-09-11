import { NextRequest, NextResponse } from "next/server";
import { scoreImageWithGemini } from "@/lib/services/scoring";
import { saveScoredImage } from "@/lib/services/data";
import { Category } from "@/lib/types";
import { createAdminClient } from "@/lib/supabase/admin";
import sharp from "sharp";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;
    const category = (formData.get("category") as Category) || "Other";
    const caption = (formData.get("caption") as string) || null;
    const country = (formData.get("country") as string) || null;
    const userId = (formData.get("userId") as string) || "usr-demo";
    const username = (formData.get("username") as string) || "curious_traveler";
    const avatarUrl = (formData.get("avatarUrl") as string) || null;

    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
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

    return NextResponse.json({
      success: true,
      image: savedImage,
      scoreBreakdown,
      moderationStatus: savedImage.moderation_status,
      heldForReview: savedImage.moderation_status === "pending_review",
    });
  } catch (error: unknown) {
    console.error("Upload & scoring error:", error);
    const errorMsg = error instanceof Error ? error.message : "Failed to process and score image";
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    );
  }
}
