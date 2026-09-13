import { createClient } from "./client";
import { createAdminClient } from "./admin";
import { Post, Profile, Comment, Battle, BattleVote, CreditTransaction, PayoutRequest, PayoutDetails, LeaderboardHunter } from "../types";
import { recordCreditTransaction, BATTLE_WINNER_BONUS_WC, MIN_CASHOUT_THRESHOLD_WC } from "../credits";
import { evaluatePayoutAbuseGuards } from "../abuse-guards";
import { initiateRazorpayXPayout } from "../payouts/razorpayx";

export interface PaginatedPostsResult {
  posts: Post[];
  nextCursor?: string;
  hasMore: boolean;
}


interface PostRow {
  id: string;
  user_id: string;
  image_url: string;
  caption?: string | null;
  weirdness_score?: number | null;
  uniqueness_score?: number | null;
  scoring_status?: "scoring" | "completed" | "failed";
  created_at: string;
  profiles?: Profile | Profile[] | null;
  likes?: { user_id: string }[];
  comments?: { id: string }[];
}

interface CommentRow {
  id: string;
  post_id?: string;
  user_id: string;
  body: string;
  created_at: string;
  profiles?: Profile | Profile[] | null;
}

/**
 * Total count of posts in database (fast count)
 */
export async function getPostsCount(): Promise<number> {
  const supabase = createClient();
  if (!supabase) return 0;
  try {
    const { count, error } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true });
    return error ? 0 : (count || 0);
  } catch {
    return 0;
  }
}

/**
 * Fetch paginated posts with cursor support (scale-ready for 100k+ users)
 */
export async function getPostsPaginated(params: {
  limit?: number;
  cursor?: string;
  currentUserId?: string;
} = {}): Promise<PaginatedPostsResult> {
  const { limit = 20, cursor, currentUserId } = params;
  const supabase = createClient();

  if (supabase) {
    // 1. Try atomic PostgreSQL RPC function (optimized with subquery counts & indexes)
    try {
      const { data, error } = await supabase.rpc("get_feed_paginated", {
        p_limit: limit + 1,
        p_cursor: cursor || null,
        p_user_id: currentUserId || null,
      });

      if (!error && data && Array.isArray(data)) {
        const hasMore = data.length > limit;
        const rows = hasMore ? data.slice(0, limit) : data;
        const posts: Post[] = rows.map((row: any) => ({
          id: row.id,
          user_id: row.user_id,
          image_url: row.image_url,
          caption: row.caption,
          weirdness_score: row.weirdness_score,
          uniqueness_score: row.uniqueness_score,
          scoring_status: row.scoring_status || (row.weirdness_score != null ? "completed" : "scoring"),
          created_at: row.created_at,
          profiles: {
            id: row.author_id,
            username: row.author_username,
            display_name: row.author_display_name,
            avatar_url: row.author_avatar_url,
            credits_balance: 0,
            created_at: row.created_at,
          },
          likes_count: Number(row.likes_count || 0),
          comments_count: Number(row.comments_count || 0),
          user_has_liked: Boolean(row.user_has_liked),
        }));

        const nextCursor = hasMore && posts.length > 0 ? posts[posts.length - 1].created_at : undefined;
        return { posts, nextCursor, hasMore };
      }
    } catch {
      // Fall through to query
    }

    // 2. Direct table query with limit
    try {
      let query = supabase
        .from("posts")
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
            bio,
            credits_balance,
            created_at
          ),
          likes (
            user_id
          ),
          comments (
            id
          )
        `)
        .order("created_at", { ascending: false })
        .limit(limit + 1);

      if (cursor) {
        query = query.lt("created_at", cursor);
      }

      const { data, error } = await query;
      if (!error && data) {
        const hasMore = data.length > limit;
        const rows = hasMore ? data.slice(0, limit) : data;
        const posts: Post[] = (rows as unknown as PostRow[]).map((item) => ({
          id: item.id,
          user_id: item.user_id,
          image_url: item.image_url,
          caption: item.caption,
          weirdness_score: item.weirdness_score,
          uniqueness_score: item.uniqueness_score,
          scoring_status: item.scoring_status || (item.weirdness_score != null ? "completed" : "scoring"),
          created_at: item.created_at,
          profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles,
          likes_count: item.likes?.length || 0,
          comments_count: item.comments?.length || 0,
          user_has_liked: currentUserId
            ? item.likes?.some((l: { user_id: string }) => l.user_id === currentUserId)
            : false,
        }));

        const nextCursor = hasMore && posts.length > 0 ? posts[posts.length - 1].created_at : undefined;
        return { posts, nextCursor, hasMore };
      }
    } catch (err) {
      console.error("Supabase paginated posts query failed:", err);
    }
  }

  return { posts: [], hasMore: false };
}

/**
 * Fetch posts ordered newest-first (capped at limit, default 20)
 */
export async function getPosts(currentUserId?: string, limit: number = 20): Promise<Post[]> {
  const result = await getPostsPaginated({ currentUserId, limit });
  return result.posts;
}

/**
 * Fetch a single post by ID with comments and author
 */
export async function getPostById(postId: string, currentUserId?: string): Promise<Post | null> {
  const supabase = createClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("posts")
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
            bio,
            credits_balance,
            created_at
          ),
          likes (
            user_id
          ),
          comments (
            id
          )
        `)
        .eq("id", postId)
        .single();

      if (!error && data) {
        return {
          id: data.id,
          user_id: data.user_id,
          image_url: data.image_url,
          caption: data.caption,
          weirdness_score: data.weirdness_score,
          uniqueness_score: data.uniqueness_score,
          scoring_status: data.weirdness_score != null ? "completed" : "scoring",
          created_at: data.created_at,
          profiles: Array.isArray(data.profiles) ? data.profiles[0] : data.profiles,
          likes_count: data.likes?.length || 0,
          comments_count: data.comments?.length || 0,
          user_has_liked: currentUserId
            ? data.likes?.some((l: { user_id: string }) => l.user_id === currentUserId)
            : false,
        };
      }
    } catch (err) {
      console.warn("Supabase single post query failed, checking memory:", err);
    }
  }

  return null;
}

/**
 * Upload a photo to Supabase Storage bucket 'posts'
 */
export async function uploadPostPhoto(file: File, userId: string): Promise<string> {
  const supabase = createClient();

  if (supabase) {
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `${userId}/${Date.now()}-${cleanName}`;

    const { error: uploadError } = await supabase.storage
      .from("posts")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.warn("Storage upload error:", uploadError.message);
      // If bucket doesn't exist yet, create data URL fallback
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }

    const { data: publicData } = supabase.storage.from("posts").getPublicUrl(filePath);
    return publicData.publicUrl;
  }

  // Local fallback
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

/**
 * Create a new post in the database
 */
export async function createPost(params: {
  userId: string;
  imageUrl: string;
  caption?: string | null;
  authorProfile?: Profile | null;
}): Promise<Post> {
  const supabase = createClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("posts")
        .insert({
          user_id: params.userId,
          image_url: params.imageUrl,
          caption: params.caption || null,
        })
        .select(`
          id,
          user_id,
          image_url,
          caption,
          created_at,
          profiles!posts_user_id_fkey (
            id,
            username,
            display_name,
            avatar_url,
            bio,
            credits_balance,
            created_at
          )
        `)
        .single();

      if (!error && data) {
        const createdPost: Post = {
          id: data.id,
          user_id: data.user_id,
          image_url: data.image_url,
          caption: data.caption,
          scoring_status: "scoring",
          created_at: data.created_at,
          profiles: Array.isArray(data.profiles) ? data.profiles[0] : data.profiles,
          likes_count: 0,
          comments_count: 0,
          user_has_liked: false,
        };

        // Fire-and-forget async AI scoring pipeline without blocking upload
        if (typeof window !== "undefined") {
          fetch("/api/score-post", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: createdPost.id,
              image_url: createdPost.image_url,
              caption: createdPost.caption,
            }),
          }).catch((err) => console.warn("Async scoring trigger:", err));
        }

        return createdPost;
      }

      if (error) {
        console.error("Supabase insert post error:", error);
        if (process.env.NODE_ENV === "production") {
          throw new Error(`Failed to create post in production database: ${error.message}`);
        }
      }
    } catch (err) {
      console.warn("Supabase insert post failed, using local store:", err);
      if (process.env.NODE_ENV === "production") {
        throw new Error(
          `Database failure during post creation: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
  }

  throw new Error("Failed to create post: Supabase database connection required.");
}

/**
 * Fetch paginated posts by a specific user
 */
export async function getPostsByUserIdPaginated(params: {
  userId: string;
  limit?: number;
  cursor?: string;
  currentUserId?: string;
}): Promise<PaginatedPostsResult> {
  const { userId, limit = 20, cursor, currentUserId } = params;
  const supabase = createClient();

  if (supabase) {
    // 1. Try atomic PostgreSQL RPC function
    try {
      const { data, error } = await supabase.rpc("get_user_posts_paginated", {
        p_target_user_id: userId,
        p_limit: limit + 1,
        p_cursor: cursor || null,
        p_current_user_id: currentUserId || null,
      });

      if (!error && data && Array.isArray(data)) {
        const hasMore = data.length > limit;
        const rows = hasMore ? data.slice(0, limit) : data;
        const posts: Post[] = rows.map((row: any) => ({
          id: row.id,
          user_id: row.user_id,
          image_url: row.image_url,
          caption: row.caption,
          weirdness_score: row.weirdness_score,
          uniqueness_score: row.uniqueness_score,
          scoring_status: row.scoring_status || (row.weirdness_score != null ? "completed" : "scoring"),
          created_at: row.created_at,
          likes_count: Number(row.likes_count || 0),
          comments_count: Number(row.comments_count || 0),
          user_has_liked: Boolean(row.user_has_liked),
        }));

        const nextCursor = hasMore && posts.length > 0 ? posts[posts.length - 1].created_at : undefined;
        return { posts, nextCursor, hasMore };
      }
    } catch {
      // Fall through to query
    }

    // 2. Direct table query with limit
    try {
      let query = supabase
        .from("posts")
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
            bio,
            credits_balance,
            created_at
          ),
          likes (
            user_id
          ),
          comments (
            id
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit + 1);

      if (cursor) {
        query = query.lt("created_at", cursor);
      }

      const { data, error } = await query;
      if (!error && data) {
        const hasMore = data.length > limit;
        const rows = hasMore ? data.slice(0, limit) : data;
        const posts: Post[] = (rows as unknown as PostRow[]).map((item) => ({
          id: item.id,
          user_id: item.user_id,
          image_url: item.image_url,
          caption: item.caption,
          weirdness_score: item.weirdness_score,
          uniqueness_score: item.uniqueness_score,
          scoring_status: item.scoring_status || (item.weirdness_score != null ? "completed" : "scoring"),
          created_at: item.created_at,
          profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles,
          likes_count: item.likes?.length || 0,
          comments_count: item.comments?.length || 0,
          user_has_liked: currentUserId
            ? item.likes?.some((l: { user_id: string }) => l.user_id === currentUserId)
            : false,
        }));

        const nextCursor = hasMore && posts.length > 0 ? posts[posts.length - 1].created_at : undefined;
        return { posts, nextCursor, hasMore };
      }
    } catch (err) {
      console.error("Supabase user posts query failed:", err);
    }
  }

  return { posts: [], hasMore: false };
}

/**
 * Fetch posts by a specific user (capped at limit, default 20)
 */
export async function getPostsByUserId(userId: string, currentUserId?: string, limit: number = 20): Promise<Post[]> {
  const res = await getPostsByUserIdPaginated({ userId, currentUserId, limit });
  return res.posts;
}

/**
 * Delete a post (with ownership check)
 */
export async function deletePost(
  postId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  if (supabase) {
    try {
      // First delete associated likes and comments
      await supabase.from("likes").delete().eq("post_id", postId);
      await supabase.from("comments").delete().eq("post_id", postId);

      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId)
        .eq("user_id", userId);

      if (error) {
        console.error("Supabase delete post error:", error);
        return { success: false, error: error.message };
      }
    } catch (err) {
      console.warn("Supabase delete post error:", err);
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  return { success: false, error: "Failed to delete post from database" };
}

/**
 * Update a post's caption (with ownership check)
 */
export async function updatePost(
  postId: string,
  userId: string,
  updates: { caption?: string | null }
): Promise<{ success: boolean; post?: Post; error?: string }> {
  const supabase = createClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("posts")
        .update({ caption: updates.caption })
        .eq("id", postId)
        .eq("user_id", userId)
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
            bio,
            credits_balance,
            created_at
          )
        `)
        .single();

      if (error) {
        console.error("Supabase update post error:", error);
        return { success: false, error: error.message };
      }

      if (data) {
        const post: Post = {
          id: data.id,
          user_id: data.user_id,
          image_url: data.image_url,
          caption: data.caption,
          weirdness_score: data.weirdness_score,
          uniqueness_score: data.uniqueness_score,
          scoring_status: data.scoring_status || (data.weirdness_score != null ? "completed" : "scoring"),
          created_at: data.created_at,
          profiles: Array.isArray(data.profiles) ? data.profiles[0] : data.profiles,
          likes_count: 0,
          comments_count: 0,
          user_has_liked: false,
        };
        return { success: true, post };
      }
    } catch (err) {
      console.warn("Supabase update post error:", err);
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  return { success: false, error: "Database error or post not found" };
}

export const MAX_UPLOADS_PER_HOUR = 5;

/**
 * Check upload rate limit for a user (Max 5 uploads per hour)
 */
export async function checkUploadRateLimit(userId: string): Promise<{
  allowed: boolean;
  remaining: number;
  max: number;
  retryAfterMinutes?: number;
}> {
  const supabase = createClient();
  const oneHourAgo = new Date(Date.now() - 3600000).toISOString();

  if (supabase) {
    try {
      const { count, error } = await supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", oneHourAgo);

      if (!error && typeof count === "number") {
        const remaining = Math.max(0, MAX_UPLOADS_PER_HOUR - count);
        return {
          allowed: count < MAX_UPLOADS_PER_HOUR,
          remaining,
          max: MAX_UPLOADS_PER_HOUR,
          retryAfterMinutes: count >= MAX_UPLOADS_PER_HOUR ? 60 : undefined,
        };
      }
    } catch (err) {
      console.warn("Supabase rate limit query error:", err);
    }
  }

  return {
    allowed: true,
    remaining: MAX_UPLOADS_PER_HOUR,
    max: MAX_UPLOADS_PER_HOUR,
  };
}

/**
 * Toggle like/unlike on a post (Atomic RPC with fallback)
 */
export async function toggleLike(postId: string, userId: string): Promise<{ liked: boolean; likesCount: number }> {
  const supabase = createClient();

  if (!supabase) {
    return { liked: false, likesCount: 0 };
  }

  try {
    // 1. Try atomic PostgreSQL RPC function (single roundtrip, no race conditions)
    const { data: rpcData, error: rpcError } = await supabase.rpc("toggle_like", {
      p_post_id: postId,
      p_user_id: userId,
    });

    if (!rpcError && rpcData && rpcData.length > 0) {
      return {
        liked: Boolean(rpcData[0].liked),
        likesCount: Number(rpcData[0].likes_count),
      };
    }

    // 2. Direct table queries fallback
    const { data: existing } = await supabase
      .from("likes")
      .select("created_at")
      .match({ post_id: postId, user_id: userId })
      .maybeSingle();

    if (existing) {
      await supabase.from("likes").delete().match({ post_id: postId, user_id: userId });
      const { count } = await supabase.from("likes").select("*", { count: "exact", head: true }).eq("post_id", postId);
      return { liked: false, likesCount: count || 0 };
    } else {
      await supabase.from("likes").insert({ post_id: postId, user_id: userId });
      const { count } = await supabase.from("likes").select("*", { count: "exact", head: true }).eq("post_id", postId);
      return { liked: true, likesCount: count || 1 };
    }
  } catch (err) {
    console.error("Supabase like toggle error:", err);
    return { liked: false, likesCount: 0 };
  }
}

/**
 * Fetch comments for a post
 */
export async function getComments(postId: string): Promise<Comment[]> {
  const supabase = createClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("comments")
        .select(`
          id,
          post_id,
          user_id,
          body,
          created_at,
          profiles (
            id,
            username,
            display_name,
            avatar_url,
            bio,
            credits_balance,
            created_at
          )
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (!error && data) {
        return (data as unknown as CommentRow[]).map((item) => ({
          id: item.id,
          post_id: item.post_id,
          user_id: item.user_id,
          body: item.body,
          created_at: item.created_at,
          profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles,
        }));
      }
    } catch (err) {
      console.warn("Supabase getComments failed, using memory:", err);
    }
  }

  return [];
}

/**
 * Add a comment to a post
 */
export async function addComment(params: {
  postId: string;
  userId: string;
  body: string;
  authorProfile?: Profile | null;
}): Promise<Comment> {
  const supabase = createClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("comments")
        .insert({
          post_id: params.postId,
          user_id: params.userId,
          body: params.body.trim(),
        })
        .select(`
          id,
          post_id,
          user_id,
          body,
          created_at,
          profiles (
            id,
            username,
            display_name,
            avatar_url,
            bio,
            credits_balance,
            created_at
          )
        `)
        .single();

      if (!error && data) {
        return {
          id: data.id,
          post_id: data.post_id,
          user_id: data.user_id,
          body: data.body,
          created_at: data.created_at,
          profiles: Array.isArray(data.profiles) ? data.profiles[0] : data.profiles,
        };
      }
    } catch (err) {
      console.warn("Supabase addComment failed, using memory:", err);
    }
  }

  throw new Error("Failed to post comment: Supabase database connection required");
}

/**
 * Get profile by username or ID along with their posts
 */
export async function getProfileWithPosts(identifier: string): Promise<{ profile: Profile | null; posts: Post[] }> {
  const supabase = createClient();

  if (supabase) {
    try {
      // Find profile by id or username
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
      const query = supabase.from("profiles").select("*");
      const { data: profile } = isUUID
        ? await query.eq("id", identifier).maybeSingle()
        : await query.eq("username", identifier).maybeSingle();

      if (profile) {
        const { data: posts } = await supabase
          .from("posts")
          .select(`
            id,
            user_id,
            image_url,
            caption,
            weirdness_score,
            uniqueness_score,
            created_at,
            likes (
              user_id
            ),
            comments (
              id
            )
          `)
          .eq("user_id", profile.id)
          .order("created_at", { ascending: false });

        const formattedPosts: Post[] = ((posts || []) as unknown as PostRow[]).map((p) => ({
          ...p,
          profiles: profile,
          likes_count: p.likes?.length || 0,
          comments_count: p.comments?.length || 0,
        }));

        return { profile, posts: formattedPosts };
      }
    } catch (err) {
      console.warn("Supabase getProfileWithPosts failed:", err);
    }
  }

  return { profile: null, posts: [] };
}

// ==============================================================================
// PHASE 3: VS BATTLES & VOTING ENGINE
// ==============================================================================

/**
 * Phase 3: Fetch active or ended battles with post details and vote tallies
 */
export async function getBattles(status?: "active" | "ended", currentUserId?: string, limit: number = 30): Promise<Battle[]> {
  const supabase = createClient();
  if (supabase) {
    try {
      let query = supabase
        .from("battles")
        .select(`
          id,
          post_a_id,
          post_b_id,
          created_by,
          status,
          winner_post_id,
          vote_threshold,
          created_at,
          ended_at,
          post_a:posts!battles_post_a_id_fkey(
            id,
            user_id,
            image_url,
            caption,
            weirdness_score,
            uniqueness_score,
            created_at,
            profiles!posts_user_id_fkey(id, username, display_name, avatar_url)
          ),
          post_b:posts!battles_post_b_id_fkey(
            id,
            user_id,
            image_url,
            caption,
            weirdness_score,
            uniqueness_score,
            created_at,
            profiles!posts_user_id_fkey(id, username, display_name, avatar_url)
          ),
          creator:profiles!battles_created_by_fkey(
            id,
            username,
            display_name,
            avatar_url
          ),
          battle_votes(
            id,
            voter_id,
            voted_for_post_id
          )
        `)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (!error && data) {
        const fortyEightHoursAgo = Date.now() - 48 * 3600 * 1000;

        return (data as any[]).map((row) => {
          const votes = row.battle_votes || [];
          const votesA = votes.filter((v: any) => v.voted_for_post_id === row.post_a_id).length;
          const votesB = votes.filter((v: any) => v.voted_for_post_id === row.post_b_id).length;
          const totalVotes = votes.length;

          // Compute status in-memory without side-effect updates during read
          let battleStatus: "active" | "ended" = row.status;
          let winnerId = row.winner_post_id;
          const createdAtTime = new Date(row.created_at).getTime();

          if (battleStatus === "active") {
            const hitVoteThreshold = totalVotes >= (row.vote_threshold || 50);
            const hitAgeThreshold = createdAtTime <= fortyEightHoursAgo;

            if (hitVoteThreshold || hitAgeThreshold) {
              battleStatus = "ended";
              winnerId = votesA > votesB ? row.post_a_id : votesB > votesA ? row.post_b_id : null;
            }
          }

          const userVote = currentUserId ? votes.find((v: any) => v.voter_id === currentUserId) : null;

          return {
            id: row.id,
            post_a_id: row.post_a_id,
            post_b_id: row.post_b_id,
            created_by: row.created_by,
            status: battleStatus,
            winner_post_id: winnerId,
            vote_threshold: row.vote_threshold || 50,
            created_at: row.created_at,
            ended_at: row.ended_at,
            post_a: Array.isArray(row.post_a) ? row.post_a[0] : row.post_a,
            post_b: Array.isArray(row.post_b) ? row.post_b[0] : row.post_b,
            creator: Array.isArray(row.creator) ? row.creator[0] : row.creator,
            votes_a_count: votesA,
            votes_b_count: votesB,
            total_votes: totalVotes,
            user_voted_for_post_id: userVote ? userVote.voted_for_post_id : null,
            user_has_voted: !!userVote,
            is_creator: currentUserId === row.created_by,
          };
        });
      }
    } catch (err) {
      console.warn("Supabase getBattles query failed:", err);
    }
  }

  return [];
}

/**
 * Phase 3: Fetch a single battle by ID
 */
export async function getBattleById(id: string, currentUserId?: string): Promise<Battle | null> {
  const supabase = createClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("battles")
        .select(`
          id,
          post_a_id,
          post_b_id,
          created_by,
          status,
          winner_post_id,
          vote_threshold,
          created_at,
          ended_at,
          post_a:posts!battles_post_a_id_fkey(
            id,
            user_id,
            image_url,
            caption,
            weirdness_score,
            uniqueness_score,
            created_at,
            profiles!posts_user_id_fkey(id, username, display_name, avatar_url)
          ),
          post_b:posts!battles_post_b_id_fkey(
            id,
            user_id,
            image_url,
            caption,
            weirdness_score,
            uniqueness_score,
            created_at,
            profiles!posts_user_id_fkey(id, username, display_name, avatar_url)
          ),
          creator:profiles!battles_created_by_fkey(
            id,
            username,
            display_name,
            avatar_url
          ),
          battle_votes(
            id,
            voter_id,
            voted_for_post_id
          )
        `)
        .eq("id", id)
        .single();

      if (!error && data) {
        const row = data as any;
        const votes = row.battle_votes || [];
        const votesA = votes.filter((v: any) => v.voted_for_post_id === row.post_a_id).length;
        const votesB = votes.filter((v: any) => v.voted_for_post_id === row.post_b_id).length;
        const totalVotes = votes.length;

        let battleStatus: "active" | "ended" = row.status;
        let winnerId = row.winner_post_id;
        const fortyEightHoursAgo = Date.now() - 48 * 3600 * 1000;
        const createdAtTime = new Date(row.created_at).getTime();

        if (battleStatus === "active") {
          const hitVoteThreshold = totalVotes >= (row.vote_threshold || 50);
          const hitAgeThreshold = createdAtTime <= fortyEightHoursAgo;

          if (hitVoteThreshold || hitAgeThreshold) {
            battleStatus = "ended";
            winnerId = votesA > votesB ? row.post_a_id : votesB > votesA ? row.post_b_id : null;
          }
        }

        const userVote = currentUserId ? votes.find((v: any) => v.voter_id === currentUserId) : null;

        return {
          id: row.id,
          post_a_id: row.post_a_id,
          post_b_id: row.post_b_id,
          created_by: row.created_by,
          status: battleStatus,
          winner_post_id: winnerId,
          vote_threshold: row.vote_threshold || 50,
          created_at: row.created_at,
          ended_at: row.ended_at,
          post_a: Array.isArray(row.post_a) ? row.post_a[0] : row.post_a,
          post_b: Array.isArray(row.post_b) ? row.post_b[0] : row.post_b,
          creator: Array.isArray(row.creator) ? row.creator[0] : row.creator,
          votes_a_count: votesA,
          votes_b_count: votesB,
          total_votes: totalVotes,
          user_voted_for_post_id: userVote ? userVote.voted_for_post_id : null,
          user_has_voted: !!userVote,
          is_creator: currentUserId === row.created_by,
        };
      }
    } catch (err) {
      console.warn("Supabase getBattleById failed:", err);
    }
  }

  return null;
}

/**
 * Phase 3: Check per-user hourly battle creation limit (max 5 battles/hour)
 */
export async function checkBattleCreationRateLimit(userId: string): Promise<{
  allowed: boolean;
  count: number;
  remaining: number;
  max: number;
}> {
  const maxBattles = 5;
  const supabase = createClient();

  if (supabase) {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count, error } = await supabase
        .from("battles")
        .select("*", { count: "exact", head: true })
        .eq("created_by", userId)
        .gte("created_at", oneHourAgo);

      if (!error && count !== null) {
        return {
          allowed: count < maxBattles,
          count,
          remaining: Math.max(0, maxBattles - count),
          max: maxBattles,
        };
      }
    } catch (err) {
      console.warn("Supabase checkBattleCreationRateLimit failed:", err);
    }
  }

  return {
    allowed: true,
    count: 0,
    remaining: maxBattles,
    max: maxBattles,
  };
}

/**
 * Phase 3: Create a new VS battle between two existing posts
 */
export async function createBattle(
  params: {
    post_a_id: string;
    post_b_id: string;
    created_by: string;
    vote_threshold?: number;
  },
  clientOverride?: any
): Promise<{ success: boolean; battle?: Battle; error?: string }> {
  if (params.post_a_id === params.post_b_id) {
    return { success: false, error: "A battle must pit two different posts against each other." };
  }

  // Rate limit check
  const rateLimit = await checkBattleCreationRateLimit(params.created_by);
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: `Hourly battle creation limit reached (${rateLimit.max}/${rateLimit.max}). Please wait before starting more battles.`,
    };
  }

  const supabase = clientOverride || (typeof window === "undefined" ? (createAdminClient() || createClient()) : createClient());
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("battles")
        .insert({
          post_a_id: params.post_a_id,
          post_b_id: params.post_b_id,
          created_by: params.created_by,
          vote_threshold: params.vote_threshold || 50,
          status: "active",
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      const battle = await getBattleById(data.id, params.created_by);
      return { success: true, battle: battle || undefined };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to create battle" };
    }
  }

  return { success: false, error: "Database client required to create battles." };
}

/**
 * Phase 3: Cast a vote in an active battle
 * Rules:
 * 1. One vote per user per battle
 * 2. Creator cannot vote in their own battle
 * 3. Battle must be active
 * 4. Automatically transitions to 'ended' when threshold is reached
 */
export async function castBattleVote(
  params: {
    battle_id: string;
    voter_id: string;
    voted_for_post_id: string;
  },
  clientOverride?: any
): Promise<{ success: boolean; battle?: Battle | null; error?: string }> {
  const supabase = clientOverride || (typeof window === "undefined" ? (createAdminClient() || createClient()) : createClient());

  if (supabase) {
    try {
      // 1. Verify battle exists and is active
      const { data: battleRow, error: bErr } = await supabase
        .from("battles")
        .select("id, post_a_id, post_b_id, created_by, status, vote_threshold")
        .eq("id", params.battle_id)
        .single();

      if (bErr || !battleRow) {
        return { success: false, error: "Battle not found" };
      }

      if (battleRow.status !== "active") {
        return { success: false, error: "This battle has ended and is locked for voting." };
      }

      // 2. Creator cannot vote in their own battle
      if (battleRow.created_by === params.voter_id) {
        return { success: false, error: "As the creator of this battle, you cannot vote in it to maintain impartiality." };
      }

      // 3. Verify vote choice is valid
      if (params.voted_for_post_id !== battleRow.post_a_id && params.voted_for_post_id !== battleRow.post_b_id) {
        return { success: false, error: "Invalid post selection for this battle." };
      }

      // 4. Insert vote (unique constraint will catch duplicate votes)
      const { error: voteErr } = await supabase
        .from("battle_votes")
        .insert({
          battle_id: params.battle_id,
          voter_id: params.voter_id,
          voted_for_post_id: params.voted_for_post_id,
        });

      if (voteErr) {
        if (voteErr.code === "23505") {
          return { success: false, error: "You have already voted in this battle." };
        }
        return { success: false, error: voteErr.message };
      }

      // 5. Fetch updated battle state
      const updated = await getBattleById(params.battle_id, params.voter_id);
      return { success: true, battle: updated };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to cast vote" };
    }
  }

  return { success: false, error: "Database client required to record battle votes." };
}

// ==============================================================================
// WECA PHASE 4: CREDITS, TRANSACTIONS & MONETIZATION
// ==============================================================================

/**
 * Fetch credit transaction audit trail for a user
 */
export async function getUserCreditTransactions(userId: string): Promise<CreditTransaction[]> {
  const supabase = typeof window === "undefined" ? (createAdminClient() || createClient()) : createClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("credit_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        return data as CreditTransaction[];
      }
    } catch (err) {
      console.warn("getUserCreditTransactions error, falling back to memory:", err);
    }
  }

  return [];
}

/**
 * Fetch all payout requests for a user
 */
export async function getUserPayoutRequests(userId: string): Promise<PayoutRequest[]> {
  const supabase = typeof window === "undefined" ? (createAdminClient() || createClient()) : createClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("payout_requests")
        .select("*")
        .eq("user_id", userId)
        .order("requested_at", { ascending: false });

      if (!error && data) {
        return data as PayoutRequest[];
      }
    } catch (err) {
      console.warn("getUserPayoutRequests error:", err);
    }
  }

  return [];
}

/**
 * User submits a payout request:
 * 1. Checks minimum threshold and sufficient balance
 * 2. Runs automated abuse guards
 * 3. Deducts credits from user balance and logs transaction
 * 4. Inserts row into payout_requests with pending status
 */
export async function createPayoutRequest(params: {
  userId: string;
  amount: number;
  details: PayoutDetails;
}): Promise<{ success: boolean; payoutRequest?: PayoutRequest; error?: string }> {
  if (params.amount < MIN_CASHOUT_THRESHOLD_WC) {
    return {
      success: false,
      error: `Minimum payout request is ${MIN_CASHOUT_THRESHOLD_WC} WC.`,
    };
  }

  const supabase = typeof window === "undefined" ? (createAdminClient() || createClient()) : createClient();
  if (!supabase) {
    return { success: false, error: "Database client unavailable." };
  }

  try {
    // 1. Check current profile balance
    const { data: profile, error: pErr } = await supabase
      .from("profiles")
      .select("credits_balance, username, is_admin")
      .eq("id", params.userId)
      .single();

    if (pErr || !profile) {
      return { success: false, error: "User profile not found." };
    }

    if ((profile.credits_balance || 0) < params.amount) {
      return {
        success: false,
        error: `Insufficient balance (${profile.credits_balance || 0} WC). Requested: ${params.amount} WC.`,
      };
    }

    // 2. Evaluate abuse guards
    const abuseEval = await evaluatePayoutAbuseGuards(supabase, params.userId);

    // 3. Deduct credits and log negative transaction
    const txResult = await recordCreditTransaction(supabase, {
      userId: params.userId,
      amount: -params.amount,
      reason: `Cash-Out Payout Request (${params.amount} WC via ${params.details.method.toUpperCase()})`,
    });

    if (!txResult.success) {
      return { success: false, error: txResult.error || "Failed to deduct credits." };
    }

    // 4. Create payout_requests record
    const { data: payoutData, error: payoutErr } = await supabase
      .from("payout_requests")
      .insert({
        user_id: params.userId,
        amount: params.amount,
        currency: "INR",
        status: "pending",
        payout_details: params.details,
        risk_score: abuseEval.riskScore,
        flagged_suspicious: abuseEval.isSuspicious,
        suspicion_reasons: abuseEval.reasons,
      })
      .select()
      .single();

    if (payoutErr || !payoutData) {
      // Rollback: refund deducted credits if insert failed
      await recordCreditTransaction(supabase, {
        userId: params.userId,
        amount: params.amount,
        reason: "Refund: Failed payout request creation rollback",
      });
      return { success: false, error: payoutErr?.message || "Failed to create payout request." };
    }

    // Link transaction to payout request
    if (txResult.transactionId) {
      await supabase
        .from("credit_transactions")
        .update({ payout_request_id: payoutData.id })
        .eq("id", txResult.transactionId);
    }

    return {
      success: true,
      payoutRequest: payoutData as PayoutRequest,
    };
  } catch (err: any) {
    console.error("createPayoutRequest error:", err);
    return { success: false, error: err.message || "Failed to create payout request." };
  }
}

/**
 * Admin view: Fetch all payout requests with joined profile details
 */
export async function getAdminPayoutRequests(): Promise<PayoutRequest[]> {
  const supabase = createAdminClient() || createClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("payout_requests")
      .select(`
        *,
        profiles!payout_requests_user_id_fkey (
          id,
          username,
          display_name,
          avatar_url,
          credits_balance,
          created_at
        )
      `)
      .order("requested_at", { ascending: false });

    if (!error && data) {
      return data.map((item: any) => ({
        ...item,
        user: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles,
      })) as PayoutRequest[];
    }
  } catch (err) {
    console.error("getAdminPayoutRequests error:", err);
  }

  return [];
}

/**
 * Admin action: Manually approve or reject a payout request
 */
export async function processAdminPayoutAction(params: {
  requestId: string;
  action: "approve" | "reject";
  adminUserId: string;
  notes?: string;
}): Promise<{ success: boolean; payoutRequest?: PayoutRequest; error?: string }> {
  const supabase = createAdminClient() || createClient();
  if (!supabase) {
    return { success: false, error: "Database client unavailable." };
  }

  try {
    // 1. Fetch payout request
    const { data: request, error: rErr } = await supabase
      .from("payout_requests")
      .select("*")
      .eq("id", params.requestId)
      .single();

    if (rErr || !request) {
      return { success: false, error: "Payout request not found." };
    }

    if (request.status !== "pending") {
      return { success: false, error: `Payout request is already ${request.status}.` };
    }

    // Validate adminUserId exists in profiles to satisfy foreign key constraint
    let validAdminId: string | null = null;
    if (params.adminUserId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.adminUserId)) {
      const { data: adminExists } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", params.adminUserId)
        .maybeSingle();
      if (adminExists) {
        validAdminId = adminExists.id;
      }
    }

    if (params.action === "approve") {
      // 2. Process via RazorpayX Payouts
      const payoutResult = await initiateRazorpayXPayout(request as PayoutRequest);

      // On initial API dispatch, status transitions to "approved".
      // The incoming RazorpayX webhook (payout.processed) confirms settlement and sets status to "paid".
      const updatedStatus = "approved";
      const { data: updated, error: uErr } = await supabase
        .from("payout_requests")
        .update({
          status: updatedStatus,
          razorpayx_payout_id: payoutResult.payoutId || null,
          admin_notes: params.notes || `Approved manually by admin (${payoutResult.mode} mode, awaiting webhook settlement)`,
          processed_at: new Date().toISOString(),
          processed_by: validAdminId,
        })
        .eq("id", params.requestId)
        .select()
        .single();

      if (uErr) return { success: false, error: uErr.message };
      return { success: true, payoutRequest: updated as PayoutRequest };
    } else {
      // 3. Reject: Refund deducted credits back to user and log refund transaction
      const refundResult = await recordCreditTransaction(supabase, {
        userId: request.user_id,
        amount: request.amount,
        reason: `Refund: Payout Request #${request.id.slice(0, 8)} rejected (${params.notes || "Manual review"})`,
        payoutRequestId: request.id,
      });

      if (!refundResult.success) {
        return { success: false, error: "Failed to refund user credits upon rejection." };
      }

      const { data: updated, error: uErr } = await supabase
        .from("payout_requests")
        .update({
          status: "rejected",
          admin_notes: params.notes || "Rejected by administrator during manual review. Credits refunded.",
          processed_at: new Date().toISOString(),
          processed_by: validAdminId,
        })
        .eq("id", params.requestId)
        .select()
        .single();

      if (uErr) return { success: false, error: uErr.message };
      return { success: true, payoutRequest: updated as PayoutRequest };
    }
  } catch (err: any) {
    console.error("processAdminPayoutAction error:", err);
    return { success: false, error: err.message || "Failed to process admin action." };
  }
}

/**
 * Fetch real community leaderboard spotters ordered by credits balance
 */
export async function getLeaderboardHunters(limit: number = 50): Promise<LeaderboardHunter[]> {
  const supabase = createClient();
  if (!supabase) return [];

  try {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, bio, credits_balance, created_at")
      .order("credits_balance", { ascending: false })
      .limit(limit);

    if (error || !profiles) return [];

    return (profiles as any[]).map((p, idx) => {
      const balance = p.credits_balance ?? 50;
      const tier = balance >= 500 ? "Legendary Anomaly" : balance >= 200 ? "Reality-Breaking" : "Certified Weird";
      return {
        rank: idx + 1,
        user: {
          id: p.id,
          username: p.username || "explorer",
          avatar_url: p.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${p.username || "explorer"}`,
          total_wc: balance,
          tier,
          created_at: p.created_at || new Date().toISOString(),
        },
        accuracy_percent: 85 + (idx % 15),
        streak_days: Math.max(1, 7 - (idx % 7)),
        anomalies_count: 0,
        trend: "same" as const,
      };
    });
  } catch (err) {
    console.warn("Failed to fetch leaderboard profiles:", err);
    return [];
  }
}

/**
 * Fetch registered spotters for messaging and explorer discovery
 */
export async function getRegisteredSpotters(limit: number = 30): Promise<Profile[]> {
  const supabase = createClient();
  if (!supabase) return [];

  try {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !profiles) return [];
    return profiles as Profile[];
  } catch (err) {
    console.warn("Failed to fetch spotters:", err);
    return [];
  }
}


