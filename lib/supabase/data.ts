import { createClient } from "./client";
import { createAdminClient } from "./admin";
import { Post, Profile, Comment, Battle, BattleVote, CreditTransaction, PayoutRequest, PayoutDetails } from "../types";
import { recordCreditTransaction, BATTLE_WINNER_BONUS_WC, MIN_CASHOUT_THRESHOLD_WC } from "../credits";
import { evaluatePayoutAbuseGuards } from "../abuse-guards";
import { initiateRazorpayXPayout } from "../payouts/razorpayx";

// In-memory demo store fallback for initial boot or offline testing
const DEMO_PROFILE: Profile = {
  id: "usr-demo",
  username: "weca_founder",
  display_name: "Weca Explorer",
  avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  bio: "Observing curious fragments in everyday spaces.",
  credits_balance: 0,
  created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
};

const DEMO_POSTS: Post[] = [
  {
    id: "post-1",
    user_id: "usr-demo",
    image_url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1200&auto=format&fit=crop&q=80",
    caption: "A vintage rotary phone half-melted into basalt lava stone.",
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    profiles: DEMO_PROFILE,
    likes_count: 14,
    comments_count: 3,
    user_has_liked: false,
  },
  {
    id: "post-2",
    user_id: "usr-demo",
    image_url: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=1200&auto=format&fit=crop&q=80",
    caption: "A single glowing mushroom sprouting through a computer circuit board.",
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    profiles: DEMO_PROFILE,
    likes_count: 29,
    comments_count: 5,
    user_has_liked: false,
  },
];

declare global {
  var __WECA_POSTS: Post[] | undefined;
  var __WECA_COMMENTS: Record<string, Comment[]> | undefined;
  var __WECA_LIKES: Record<string, Set<string>> | undefined;
  var __WECA_BATTLES: Battle[] | undefined;
  var __WECA_BATTLE_VOTES: BattleVote[] | undefined;
}

if (!global.__WECA_POSTS) {
  global.__WECA_POSTS = [...DEMO_POSTS];
}
if (!global.__WECA_COMMENTS) {
  global.__WECA_COMMENTS = {
    "post-1": [
      {
        id: "c-1",
        post_id: "post-1",
        user_id: "usr-demo",
        body: "The patina on the dial is astonishing.",
        created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
        profiles: DEMO_PROFILE,
      },
    ],
  };
}
if (!global.__WECA_LIKES) {
  global.__WECA_LIKES = {};
}
if (!global.__WECA_BATTLES) {
  global.__WECA_BATTLES = [];
}
if (!global.__WECA_BATTLE_VOTES) {
  global.__WECA_BATTLE_VOTES = [];
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
 * Fetch all posts ordered newest-first (Phase 1 Home Feed)
 */
export async function getPosts(currentUserId?: string): Promise<Post[]> {
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
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return (data as unknown as PostRow[]).map((item) => ({
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
      }
    } catch (err) {
      console.warn("Supabase posts query failed, falling back to local store:", err);
    }
  }

  // In-memory fallback
  return (global.__WECA_POSTS || []).map((p) => {
    const postLikes = global.__WECA_LIKES?.[p.id] || new Set();
    const postComments = global.__WECA_COMMENTS?.[p.id] || [];
    return {
      ...p,
      likes_count: (p.likes_count || 0) + postLikes.size,
      comments_count: postComments.length,
      user_has_liked: currentUserId ? postLikes.has(currentUserId) : false,
    };
  });
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

  // In-memory fallback
  const post = (global.__WECA_POSTS || []).find((p) => p.id === postId);
  if (!post) return null;

  const postLikes = global.__WECA_LIKES?.[postId] || new Set();
  const postComments = global.__WECA_COMMENTS?.[postId] || [];
  return {
    ...post,
    likes_count: (post.likes_count || 0) + postLikes.size,
    comments_count: postComments.length,
    user_has_liked: currentUserId ? postLikes.has(currentUserId) : false,
  };
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

  // In-memory fallback
  const newPost: Post = {
    id: `post-${Date.now()}`,
    user_id: params.userId,
    image_url: params.imageUrl,
    caption: params.caption,
    scoring_status: "scoring",
    created_at: new Date().toISOString(),
    profiles: params.authorProfile || DEMO_PROFILE,
    likes_count: 0,
    comments_count: 0,
    user_has_liked: false,
  };

  if (!global.__WECA_POSTS) global.__WECA_POSTS = [];
  global.__WECA_POSTS.unshift(newPost);

  // Trigger scoring in background
  if (typeof window !== "undefined") {
    fetch("/api/score-post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: newPost.id,
        image_url: newPost.image_url,
        caption: newPost.caption,
      }),
    }).catch((err) => console.warn("Local async scoring trigger:", err));
  }

  return newPost;
}

/**
 * Fetch all posts by a specific user ordered newest-first
 */
export async function getPostsByUserId(userId: string, currentUserId?: string): Promise<Post[]> {
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
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        return (data as unknown as PostRow[]).map((item) => ({
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
      }
    } catch (err) {
      console.warn("Supabase user posts query failed, falling back to local store:", err);
    }
  }

  // In-memory fallback
  return (global.__WECA_POSTS || [])
    .filter((p) => p.user_id === userId || (userId === "usr-demo" && (!p.user_id || p.user_id === "usr-demo")))
    .map((p) => {
      const postLikes = global.__WECA_LIKES?.[p.id] || new Set();
      const postComments = global.__WECA_COMMENTS?.[p.id] || [];
      return {
        ...p,
        likes_count: (p.likes_count || 0) + postLikes.size,
        comments_count: postComments.length,
        user_has_liked: currentUserId ? postLikes.has(currentUserId) : false,
      };
    });
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

  // In-memory fallback removal
  if (global.__WECA_POSTS) {
    const idx = global.__WECA_POSTS.findIndex(
      (p) => p.id === postId && (p.user_id === userId || userId === "usr-demo")
    );
    if (idx !== -1) {
      global.__WECA_POSTS.splice(idx, 1);
    }
  }

  return { success: true };
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

  // In-memory fallback
  if (global.__WECA_POSTS) {
    const post = global.__WECA_POSTS.find(
      (p) => p.id === postId && (p.user_id === userId || userId === "usr-demo")
    );
    if (post) {
      if (updates.caption !== undefined) post.caption = updates.caption;
      return { success: true, post };
    }
  }

  return { success: false, error: "Post not found or unauthorized" };
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

  // Local fallback
  const recentPosts = (global.__WECA_POSTS || []).filter(
    (p) => p.user_id === userId && new Date(p.created_at).getTime() > Date.now() - 3600000
  );
  const count = recentPosts.length;
  return {
    allowed: count < MAX_UPLOADS_PER_HOUR,
    remaining: Math.max(0, MAX_UPLOADS_PER_HOUR - count),
    max: MAX_UPLOADS_PER_HOUR,
  };
}

/**
 * Toggle like/unlike on a post
 */
export async function toggleLike(postId: string, userId: string): Promise<{ liked: boolean; likesCount: number }> {
  const supabase = createClient();

  if (supabase) {
    try {
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
      console.warn("Supabase like toggle failed, using memory:", err);
    }
  }

  // In-memory fallback
  if (!global.__WECA_LIKES) global.__WECA_LIKES = {};
  if (!global.__WECA_LIKES[postId]) global.__WECA_LIKES[postId] = new Set();

  const set = global.__WECA_LIKES[postId];
  let liked = false;
  if (set.has(userId)) {
    set.delete(userId);
    liked = false;
  } else {
    set.add(userId);
    liked = true;
  }

  const post = global.__WECA_POSTS?.find((p) => p.id === postId);
  const baseCount = post?.likes_count || 0;
  return { liked, likesCount: baseCount + set.size };
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

  return global.__WECA_COMMENTS?.[postId] || [];
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

  // In-memory fallback
  const newComment: Comment = {
    id: `c-${Date.now()}`,
    post_id: params.postId,
    user_id: params.userId,
    body: params.body.trim(),
    created_at: new Date().toISOString(),
    profiles: params.authorProfile || DEMO_PROFILE,
  };

  if (!global.__WECA_COMMENTS) global.__WECA_COMMENTS = {};
  if (!global.__WECA_COMMENTS[params.postId]) global.__WECA_COMMENTS[params.postId] = [];
  global.__WECA_COMMENTS[params.postId].push(newComment);

  return newComment;
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

  // In-memory fallback
  const profile = identifier === "usr-demo" || identifier === "weca_founder" ? DEMO_PROFILE : null;
  const posts = (global.__WECA_POSTS || []).filter((p) => p.user_id === profile?.id);
  return { profile, posts };
}

// ==============================================================================
// PHASE 3: VS BATTLES & VOTING ENGINE
// ==============================================================================

/**
 * Phase 3: Fetch active or ended battles with post details and vote tallies
 */
export async function getBattles(status?: "active" | "ended", currentUserId?: string): Promise<Battle[]> {
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
        .order("created_at", { ascending: false });

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

          // Check if age threshold hit (48h) or vote threshold
          let battleStatus: "active" | "ended" = row.status;
          let winnerId = row.winner_post_id;
          const createdAtTime = new Date(row.created_at).getTime();

          if (battleStatus === "active") {
            const hitVoteThreshold = totalVotes >= (row.vote_threshold || 50);
            const hitAgeThreshold = createdAtTime <= fortyEightHoursAgo;

            if (hitVoteThreshold || hitAgeThreshold) {
              battleStatus = "ended";
              winnerId = votesA > votesB ? row.post_a_id : votesB > votesA ? row.post_b_id : null;
              supabase
                .from("battles")
                .update({ status: "ended", winner_post_id: winnerId, ended_at: new Date().toISOString() })
                .eq("id", row.id)
                .then();
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

  // In-memory fallback
  let list = global.__WECA_BATTLES || [];
  if (status) {
    list = list.filter((b) => b.status === status);
  }
  return list;
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
            supabase
              .from("battles")
              .update({ status: "ended", winner_post_id: winnerId, ended_at: new Date().toISOString() })
              .eq("id", row.id)
              .then();
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

  return (global.__WECA_BATTLES || []).find((b) => b.id === id) || null;
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

  // Fallback check
  const oneHourAgo = Date.now() - 3600000;
  const count = (global.__WECA_BATTLES || []).filter(
    (b) => b.created_by === userId && new Date(b.created_at || Date.now()).getTime() >= oneHourAgo
  ).length;

  return {
    allowed: count < maxBattles,
    count,
    remaining: Math.max(0, maxBattles - count),
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

  // Fallback in-memory creation
  const newBattle: Battle = {
    id: "battle-" + Date.now(),
    post_a_id: params.post_a_id,
    post_b_id: params.post_b_id,
    created_by: params.created_by,
    status: "active",
    vote_threshold: params.vote_threshold || 50,
    created_at: new Date().toISOString(),
    votes_a_count: 0,
    votes_b_count: 0,
    total_votes: 0,
    is_creator: true,
  };
  global.__WECA_BATTLES = [newBattle, ...(global.__WECA_BATTLES || [])];
  return { success: true, battle: newBattle };
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

  // In-memory fallback
  const battle = (global.__WECA_BATTLES || []).find((b) => b.id === params.battle_id);
  if (!battle) return { success: false, error: "Battle not found" };
  if (battle.status !== "active") return { success: false, error: "Battle has ended" };
  if (battle.created_by === params.voter_id) return { success: false, error: "Creator cannot vote in own battle" };

  const existingVote = (global.__WECA_BATTLE_VOTES || []).find(
    (v) => v.battle_id === params.battle_id && v.voter_id === params.voter_id
  );
  if (existingVote) return { success: false, error: "You have already voted in this battle" };

  const newVote: BattleVote = {
    id: "vote-" + Date.now(),
    battle_id: params.battle_id,
    voter_id: params.voter_id,
    voted_for_post_id: params.voted_for_post_id,
    created_at: new Date().toISOString(),
  };
  global.__WECA_BATTLE_VOTES = [...(global.__WECA_BATTLE_VOTES || []), newVote];

  if (params.voted_for_post_id === battle.post_a_id) {
    battle.votes_a_count = (battle.votes_a_count || 0) + 1;
  } else {
    battle.votes_b_count = (battle.votes_b_count || 0) + 1;
  }
  battle.total_votes = (battle.total_votes || 0) + 1;
  battle.user_has_voted = true;
  battle.user_voted_for_post_id = params.voted_for_post_id;

  if (battle.total_votes >= (battle.vote_threshold || 50)) {
    battle.status = "ended";
    const aCount = battle.votes_a_count || 0;
    const bCount = battle.votes_b_count || 0;
    battle.winner_post_id = aCount > bCount ? battle.post_a_id : battle.post_b_id;
    battle.ended_at = new Date().toISOString();

    // Award bonus in memory fallback
    if (battle.winner_post_id) {
      const winningPost = (global.__WECA_POSTS || []).find((p) => p.id === battle.winner_post_id);
      if (winningPost) {
        recordCreditTransaction(null, {
          userId: winningPost.user_id,
          amount: BATTLE_WINNER_BONUS_WC,
          reason: "Versus Battle Victory Bonus: Post crowned winner",
          postId: winningPost.id,
          battleId: battle.id,
        });
      }
    }
  }

  return { success: true, battle };
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

  return (global.__WECA_CREDIT_TRANSACTIONS || []).filter((t) => t.user_id === userId);
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


