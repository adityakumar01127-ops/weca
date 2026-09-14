import { WicaImage, User, Comment, Category, getTierFromScore, Tier, Post } from "../types";
import { createServerSupabaseClient } from "../supabase/server";
import { createAdminClient } from "../supabase/admin";

interface SupabaseFeedItem extends WicaImage {
  likes?: { user_id: string }[];
  comments?: { id: string }[];
}

// Global in-memory storage for runtime caching
declare global {
  var __WICA_IMAGES: WicaImage[] | undefined;
  var __WICA_USERS: User[] | undefined;
  var __WICA_COMMENTS: Record<string, Comment[]> | undefined;
  var __WICA_LIKES: Set<string> | undefined; // "userId:imageId"
  var __WECA_POSTS: Post[] | undefined;
}

if (!global.__WICA_IMAGES) {
  global.__WICA_IMAGES = [];
}
if (!global.__WICA_USERS) {
  global.__WICA_USERS = [];
}
if (!global.__WICA_COMMENTS) {
  global.__WICA_COMMENTS = {};
}
if (!global.__WICA_LIKES) {
  global.__WICA_LIKES = new Set<string>();
}

export async function getFeedImages(params?: {
  category?: string;
  sortBy?: "score" | "latest";
  userId?: string;
  currentUserId?: string;
}): Promise<WicaImage[]> {
  const supabase = await createServerSupabaseClient();

  if (supabase) {
    try {
      let query = supabase
        .from("images")
        .select(`
          *,
          author:users!images_user_id_fkey(id, username, avatar_url, tier),
          likes(user_id),
          comments(id)
        `)
        .eq("moderation_status", "approved");

      if (params?.category && params.category !== "All") {
        query = query.eq("category", params.category);
      }

      if (params?.userId) {
        query = query.eq("user_id", params.userId);
      }

      if (params?.sortBy === "latest") {
        query = query.order("created_at", { ascending: false });
      } else {
        query = query.order("wica_score", { ascending: false });
      }

      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        return (data as unknown as SupabaseFeedItem[]).map((item) => ({
          ...item,
          author: item.author || {
            id: item.user_id,
            username: "explorer",
            avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${item.user_id}`,
            tier: getTierFromScore(item.wica_score),
          },
          likes_count: item.likes?.length || 0,
          comments_count: item.comments?.length || 0,
          user_has_liked: params?.currentUserId
            ? item.likes?.some((l) => l.user_id === params.currentUserId)
            : false,
        }));
      }
    } catch (err) {
      console.warn("Supabase feed query fallback to in-memory store:", err);
    }
  }

  // Local in-memory fallback
  let images = [...(global.__WICA_IMAGES || [])];

  // Only approved photos in public feed
  images = images.filter((img) => img.moderation_status === "approved");

  if (params?.category && params.category !== "All") {
    images = images.filter((img) => img.category === params.category);
  }

  if (params?.userId) {
    images = images.filter((img) => img.user_id === params.userId);
  }

  if (params?.sortBy === "latest") {
    images.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } else {
    images.sort((a, b) => b.wica_score - a.wica_score);
  }

  const currentUserId = params?.currentUserId || "";

  return images.map((img) => ({
    ...img,
    user_has_liked: global.__WICA_LIKES?.has(`${currentUserId}:${img.id}`) || false,
    comments_count: (global.__WICA_COMMENTS?.[img.id] || []).length,
  }));
}

export async function getImageById(id: string, currentUserId?: string): Promise<WicaImage | null> {
  const images = await getFeedImages({ currentUserId });
  const found = images.find((img) => img.id === id);
  if (found) return found;

  const mem = global.__WICA_IMAGES?.find((img) => img.id === id);
  return mem || null;
}

export async function toggleLike(imageId: string, userId: string): Promise<{ liked: boolean; count: number }> {
  const key = `${userId}:${imageId}`;
  const supabase = createAdminClient();

  let isLiked = false;

  if (supabase) {
    try {
      const { data: existing } = await supabase
        .from("likes")
        .select("*")
        .eq("image_id", imageId)
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) {
        await supabase.from("likes").delete().eq("image_id", imageId).eq("user_id", userId);
        isLiked = false;
      } else {
        await supabase.from("likes").insert({ image_id: imageId, user_id: userId });
        isLiked = true;
      }

      const { count } = await supabase
        .from("likes")
        .select("*", { count: "exact", head: true })
        .eq("image_id", imageId);

      return { liked: isLiked, count: count || 0 };
    } catch (err) {
      console.warn("Supabase toggleLike fallback:", err);
    }
  }

  // In-memory fallback
  if (global.__WICA_LIKES?.has(key)) {
    global.__WICA_LIKES.delete(key);
    isLiked = false;
  } else {
    global.__WICA_LIKES?.add(key);
    isLiked = true;
  }

  const img = global.__WICA_IMAGES?.find((i) => i.id === imageId);
  if (img) {
    img.likes_count = Math.max(0, (img.likes_count || 0) + (isLiked ? 1 : -1));
  }

  return { liked: isLiked, count: img?.likes_count || 0 };
}

export async function getComments(imageId: string): Promise<Comment[]> {
  const supabase = await createServerSupabaseClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("comments")
        .select(`
          *,
          author:users(id, username, avatar_url)
        `)
        .eq("image_id", imageId)
        .order("created_at", { ascending: true });

      if (!error && data) {
        return data;
      }
    } catch (err) {
      console.warn("Supabase getComments fallback:", err);
    }
  }

  return global.__WICA_COMMENTS?.[imageId] || [];
}

export async function addComment(imageId: string, userId: string, body: string, user?: Partial<User>): Promise<Comment> {
  const supabase = createAdminClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("comments")
        .insert({
          image_id: imageId,
          user_id: userId,
          body,
        })
        .select(`
          *,
          author:users(id, username, avatar_url)
        `)
        .single();

      if (!error && data) {
        return data;
      }
    } catch (err) {
      console.warn("Supabase addComment fallback:", err);
    }
  }

  // In-memory fallback
  const newComment: Comment = {
    id: `c-${Date.now()}`,
    user_id: userId,
    image_id: imageId,
    body,
    created_at: new Date().toISOString(),
    author: {
      id: userId,
      username: user?.username || "anonymous_weirdo",
      avatar_url: user?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${userId}`,
    },
  };

  if (!global.__WICA_COMMENTS) {
    global.__WICA_COMMENTS = {};
  }
  if (!global.__WICA_COMMENTS[imageId]) {
    global.__WICA_COMMENTS[imageId] = [];
  }
  global.__WICA_COMMENTS[imageId].push(newComment);

  const img = global.__WICA_IMAGES?.find((i) => i.id === imageId);
  if (img) {
    img.comments_count = (img.comments_count || 0) + 1;
  }

  return newComment;
}

export async function getUserProfile(usernameOrId: string): Promise<{
  user: User | null;
  images: WicaImage[];
  avgScore: number;
  totalWC: number;
}> {
  const supabase = await createServerSupabaseClient();

  if (supabase) {
    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(usernameOrId);
      const userQuery = isUUID
        ? supabase.from("users").select("*").eq("id", usernameOrId)
        : supabase.from("users").select("*").eq("username", usernameOrId);

      let { data: user } = await userQuery.maybeSingle();

      // Fallback to profiles table if not present in users table
      if (!user) {
        const profileQuery = isUUID
          ? supabase.from("profiles").select("*").eq("id", usernameOrId)
          : supabase.from("profiles").select("*").eq("username", usernameOrId);
        const { data: profile } = await profileQuery.maybeSingle();
        if (profile) {
          user = {
            id: profile.id,
            username: profile.username || "explorer",
            avatar_url: profile.avatar_url || "",
            total_wc: profile.credits_balance || 0,
            tier: "Certified Weird",
            created_at: profile.created_at,
          };
        }
      }

      if (user) {
        // 1. Fetch from images table
        const { data: images } = await supabase
          .from("images")
          .select(`
            *,
            author:users!images_user_id_fkey(id, username, avatar_url, tier),
            likes(user_id),
            comments(id)
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        const imageList = ((images || []) as unknown as SupabaseFeedItem[]).map((item) => ({
          ...item,
          author: item.author || user,
          likes_count: item.likes?.length || 0,
          comments_count: item.comments?.length || 0,
          user_has_liked: false,
        }));

        // 2. Fetch from posts table (created via createPost / upload flow)
        let postList: WicaImage[] = [];
        try {
          const { data: posts } = await supabase
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
              likes(user_id),
              comments(id)
            `)
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          if (posts) {
            postList = posts.map((p: any) => ({
              id: p.id,
              user_id: p.user_id,
              storage_path: p.image_url,
              category: "Objects" as Category,
              country: undefined,
              caption: p.caption || "",
              wica_score: p.weirdness_score || 85,
              absurdity: 8,
              rarity: 8,
              craft: 8,
              cultural_novelty: 7,
              wit: 8,
              ai_verdict: p.caption || "Community discovery",
              moderation_status: "approved" as const,
              created_at: p.created_at,
              author: user,
              likes_count: p.likes?.length || 0,
              comments_count: p.comments?.length || 0,
              user_has_liked: false,
            }));
          }
        } catch (postErr) {
          console.warn("Supabase profile posts fetch warning:", postErr);
        }

        // 3. Merge both sources avoiding duplicates, sorted newest first
        const combinedMap = new Map<string, WicaImage>();
        imageList.forEach((img) => combinedMap.set(img.id, img));
        postList.forEach((post) => combinedMap.set(post.id, post));
        const combined = Array.from(combinedMap.values()).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        const avg = combined.length > 0
          ? Math.round(combined.reduce((acc, img) => acc + (img.wica_score || 0), 0) / combined.length)
          : 0;

        return {
          user,
          images: combined,
          avgScore: avg,
          totalWC: Number(user.total_wc) || 0,
        };
      }
    } catch (err) {
      console.warn("Supabase profile fallback:", err);
    }
  }

  // In-memory fallback
  let user = global.__WICA_USERS?.find((u) => u.username === usernameOrId || u.id === usernameOrId) || null;

  if (!user) {
    return {
      user: null,
      images: [],
      avgScore: 0,
      totalWC: 0,
    };
  }

  const userImages = (global.__WICA_IMAGES || []).filter(
    (img) => img.user_id === user?.id || (user && img.author?.username === user.username)
  );

  // Merge in-memory posts from global.__WECA_POSTS
  const memPosts: WicaImage[] = (global.__WECA_POSTS || [])
    .filter((p: any) => p.user_id === user?.id)
    .map((p: any) => ({
      id: p.id,
      user_id: p.user_id,
      storage_path: p.image_url,
      category: "Objects" as Category,
      country: undefined,
      caption: p.caption || "",
      wica_score: p.weirdness_score || 85,
      absurdity: 8,
      rarity: 8,
      craft: 8,
      cultural_novelty: 7,
      wit: 8,
      ai_verdict: p.caption || "Community discovery",
      moderation_status: "approved" as const,
      created_at: p.created_at,
      author: user,
      likes_count: p.likes_count || 0,
      comments_count: p.comments_count || 0,
      user_has_liked: false,
    }));

  const combinedMemMap = new Map<string, WicaImage>();
  userImages.forEach((img) => combinedMemMap.set(img.id, img));
  memPosts.forEach((post) => combinedMemMap.set(post.id, post));
  const finalImages = Array.from(combinedMemMap.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const avgScore = finalImages.length > 0
    ? Math.round(finalImages.reduce((sum, img) => sum + img.wica_score, 0) / finalImages.length)
    : 0;
  const totalWC = user?.total_wc || finalImages.reduce((sum, img) => sum + img.wica_score, 0);

  return {
    user,
    images: finalImages,
    avgScore,
    totalWC,
  };
}

/**
 * Server-side delete image / post
 */
export async function deleteImage(
  imageId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient();

  if (supabase) {
    try {
      // 1. Try deleting from posts table
      await supabase.from("likes").delete().eq("post_id", imageId);
      await supabase.from("comments").delete().eq("post_id", imageId);
      await supabase
        .from("posts")
        .delete()
        .eq("id", imageId)
        .eq("user_id", userId);

      // 2. Try deleting from images table
      await supabase.from("likes").delete().eq("image_id", imageId);
      await supabase.from("comments").delete().eq("image_id", imageId);
      await supabase
        .from("images")
        .delete()
        .eq("id", imageId)
        .eq("user_id", userId);
    } catch (err) {
      console.warn("Server delete error:", err);
    }
  }

  // Also remove from in-memory stores
  if (global.__WICA_IMAGES) {
    const idx = global.__WICA_IMAGES.findIndex(
      (img) => img.id === imageId && img.user_id === userId
    );
    if (idx !== -1) global.__WICA_IMAGES.splice(idx, 1);
  }
  if (global.__WECA_POSTS) {
    const idx = global.__WECA_POSTS.findIndex(
      (p: any) => p.id === imageId && p.user_id === userId
    );
    if (idx !== -1) global.__WECA_POSTS.splice(idx, 1);
  }

  return { success: true };
}

/**
 * Server-side update image / post caption
 */
export async function updateImage(
  imageId: string,
  userId: string,
  updates: { caption?: string | null }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient();

  if (supabase) {
    try {
      await supabase
        .from("posts")
        .update({ caption: updates.caption })
        .eq("id", imageId)
        .eq("user_id", userId);

      await supabase
        .from("images")
        .update({ caption: updates.caption })
        .eq("id", imageId)
        .eq("user_id", userId);
    } catch (err) {
      console.warn("Server update error:", err);
    }
  }

  // Update in-memory stores
  if (global.__WICA_IMAGES) {
    const img = global.__WICA_IMAGES.find(
      (i) => i.id === imageId && i.user_id === userId
    );
    if (img && updates.caption !== undefined) {
      img.caption = updates.caption || "";
    }
  }
  if (global.__WECA_POSTS) {
    const post = global.__WECA_POSTS.find(
      (p: any) => p.id === imageId && p.user_id === userId
    );
    if (post && updates.caption !== undefined) {
      post.caption = updates.caption;
    }
  }

  return { success: true };
}

export async function saveScoredImage(params: {
  userId: string;
  storagePath: string;
  category: Category;
  caption?: string | null;
  country?: string | null;
  scoreBreakdown: {
    absurdity: number;
    rarity: number;
    craft: number;
    cultural_novelty: number;
    wit: number;
    one_line_verdict: string;
    flags: string[];
    composite_score: number;
    tier: Tier;
  };
  authorUser?: Partial<User>;
}): Promise<WicaImage> {
  const needsReview = params.scoreBreakdown.flags.includes("needs_moderation_review");
  const moderation_status = needsReview ? "pending_review" : "approved";

  const safeUserId = params.userId;

  const supabase = createAdminClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("images")
        .insert({
          user_id: safeUserId,
          storage_path: params.storagePath,
          category: params.category,
          caption: params.caption,
          country: params.country,
          wica_score: params.scoreBreakdown.composite_score,
          absurdity: params.scoreBreakdown.absurdity,
          rarity: params.scoreBreakdown.rarity,
          craft: params.scoreBreakdown.craft,
          cultural_novelty: params.scoreBreakdown.cultural_novelty,
          wit: params.scoreBreakdown.wit,
          ai_verdict: params.scoreBreakdown.one_line_verdict,
          moderation_status,
        })
        .select()
        .single();

      if (error) {
        console.error("Supabase saveScoredImage insert error:", error);
      }

      if (!error && data) {
        await supabase.from("credit_ledger").insert({
          user_id: safeUserId,
          amount: params.scoreBreakdown.composite_score,
          reason: `Upload score reward for ${params.category} discovery`,
        });

        const { data: userData } = await supabase
          .from("users")
          .select("total_wc")
          .eq("id", safeUserId)
          .single();

        const currentWc = Number(userData?.total_wc || 0);
        const newTotalWc = currentWc + params.scoreBreakdown.composite_score;

        await supabase
          .from("users")
          .update({
            total_wc: newTotalWc,
            tier: getTierFromScore(params.scoreBreakdown.composite_score),
          })
          .eq("id", safeUserId);

        return {
          ...data,
          author: {
            id: safeUserId,
            username: params.authorUser?.username || "curious_traveler",
            avatar_url: params.authorUser?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${safeUserId}`,
            tier: getTierFromScore(params.scoreBreakdown.composite_score),
          },
          likes_count: 0,
          comments_count: 0,
          user_has_liked: false,
        };
      }
    } catch (err) {
      console.warn("Supabase saveScoredImage exception:", err);
    }
  }

  // In-memory fallback
  const newImage: WicaImage = {
    id: `img-${Date.now()}`,
    user_id: params.userId,
    storage_path: params.storagePath,
    category: params.category,
    country: params.country || "Earth",
    caption: params.caption,
    wica_score: params.scoreBreakdown.composite_score,
    absurdity: params.scoreBreakdown.absurdity,
    rarity: params.scoreBreakdown.rarity,
    craft: params.scoreBreakdown.craft,
    cultural_novelty: params.scoreBreakdown.cultural_novelty,
    wit: params.scoreBreakdown.wit,
    ai_verdict: params.scoreBreakdown.one_line_verdict,
    moderation_status,
    created_at: new Date().toISOString(),
    author: {
      id: params.userId,
      username: params.authorUser?.username || "explorer",
      avatar_url: params.authorUser?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${params.userId}`,
      tier: params.scoreBreakdown.tier,
    },
    likes_count: 0,
    comments_count: 0,
    user_has_liked: false,
  };

  if (!global.__WICA_IMAGES) {
    global.__WICA_IMAGES = [];
  }
  global.__WICA_IMAGES.unshift(newImage);

  // Update or insert user in memory
  const user = global.__WICA_USERS?.find((u) => u.id === params.userId || u.username === params.authorUser?.username);
  if (user) {
    user.total_wc = (user.total_wc || 0) + params.scoreBreakdown.composite_score;
    user.tier = getTierFromScore(params.scoreBreakdown.composite_score);
  } else {
    const createdUser: User = {
      id: params.userId,
      username: params.authorUser?.username || "curious_traveler",
      avatar_url: params.authorUser?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      total_wc: params.scoreBreakdown.composite_score,
      tier: params.scoreBreakdown.tier,
      created_at: new Date().toISOString(),
    };
    global.__WICA_USERS?.push(createdUser);
  }

  return newImage;
}
