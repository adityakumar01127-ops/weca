import { NextRequest, NextResponse } from "next/server";
import { deletePost, updatePost } from "@/lib/supabase/data";
import { getAuthenticatedUser, isUserAdmin } from "@/lib/auth-server";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required to delete post." }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Missing post id parameter." }, { status: 400 });
    }

    const isAdmin = await isUserAdmin(user.id, user.email);
    const result = await deletePost(id, user.id, isAdmin);

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to delete post." }, { status: 403 });
    }

    return NextResponse.json({ success: true, postId: id });
  } catch (error: unknown) {
    console.error("Delete post API error:", error);
    return NextResponse.json(
      { error: "Internal server error deleting post." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required to update post." }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "Missing post id parameter." }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const { caption } = body;

    const resPost = await updatePost(id, user.id, { caption });
    if (!resPost.success) {
      return NextResponse.json({ error: resPost.error || "Failed to update post." }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      postId: id,
      caption,
      post: resPost.post,
    });
  } catch (error: unknown) {
    console.error("Update post API error:", error);
    return NextResponse.json(
      { error: "Internal server error updating post." },
      { status: 500 }
    );
  }
}

