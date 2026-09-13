import { NextRequest, NextResponse } from "next/server";
import { deleteImage, updateImage } from "@/lib/services/data";
import { deletePost, updatePost } from "@/lib/supabase/data";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    const { searchParams } = new URL(req.url);
    const userId = body.userId || searchParams.get("userId") || "usr-demo";

    if (!id) {
      return NextResponse.json({ error: "Missing post id" }, { status: 400 });
    }

    // Attempt delete in both services (handles both posts and images tables + fallbacks)
    await deletePost(id, userId);
    await deleteImage(id, userId);

    return NextResponse.json({ success: true, postId: id });
  } catch (error: unknown) {
    console.error("Delete post API error:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    const { caption, userId = "usr-demo" } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing post id" }, { status: 400 });
    }

    const resPost = await updatePost(id, userId, { caption });
    await updateImage(id, userId, { caption });

    return NextResponse.json({
      success: true,
      postId: id,
      caption,
      post: resPost.post,
    });
  } catch (error: unknown) {
    console.error("Update post API error:", error);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}
