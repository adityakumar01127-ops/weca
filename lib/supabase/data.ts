import { createClient } from "./client";
import { Post, Profile, Comment } from "../types";

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
          created_at,
          profiles (
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
          created_at,
          profiles (
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
          scoring_status: data.scoring_status || (data.weirdness_score != null ? "completed" : "scoring"),
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
    } catch (err) {
      console.warn("Supabase insert post failed, using local store:", err);
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
