import { WicaImage, User, Comment, Category, getTierFromScore, Tier } from "../types";
import { createServerSupabaseClient } from "../supabase/server";
import { createAdminClient } from "../supabase/admin";

interface SupabaseFeedItem extends WicaImage {
  likes?: { user_id: string }[];
  comments?: { id: string }[];
}

// Seed data for local demo or when Supabase is empty
const INITIAL_DEMO_USERS: User[] = [
  {
    id: "usr-demo",
    username: "curious_traveler",
    avatar_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
    total_wc: 180,
    tier: "Certified Weird",
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: "usr-1",
    username: "urban_stranger",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    total_wc: 342,
    tier: "Reality-Breaking",
    created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
  },
  {
    id: "usr-2",
    username: "botanical_glitch",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    total_wc: 288,
    tier: "Reality-Breaking",
    created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
  {
    id: "usr-3",
    username: "anomaly_hunter",
    avatar_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    total_wc: 460,
    tier: "Legendary Anomaly",
    created_at: new Date(Date.now() - 86400000 * 24).toISOString(),
  },
  {
    id: "usr-4",
    username: "karen_coincidence",
    avatar_url: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80",
    total_wc: 174,
    tier: "Certified Weird",
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

const INITIAL_DEMO_IMAGES: WicaImage[] = [
  {
    id: "img-1",
    user_id: "usr-3",
    storage_path: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80",
    category: "Objects",
    country: "Iceland",
    caption: "A vintage rotary phone half-melted into a solid basalt lava formation.",
    wica_score: 94,
    absurdity: 10,
    rarity: 10,
    craft: 8,
    cultural_novelty: 9,
    wit: 10,
    ai_verdict: "A geological punchline that turns telecommunications into an archaeological riddle.",
    moderation_status: "approved",
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    author: INITIAL_DEMO_USERS[3],
    likes_count: 42,
    comments_count: 7,
    user_has_liked: false,
  },
  {
    id: "img-2",
    user_id: "usr-2",
    storage_path: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&auto=format&fit=crop&q=80",
    category: "Nature",
    country: "New Zealand",
    caption: "A single glowing crimson mushroom growing upside down out of a cave ceiling stalactite.",
    wica_score: 88,
    absurdity: 9,
    rarity: 9,
    craft: 7,
    cultural_novelty: 9,
    wit: 10,
    ai_verdict: "Mycology defying gravity with unapologetic theatrical bioluminescence.",
    moderation_status: "approved",
    created_at: new Date(Date.now() - 3600000 * 11).toISOString(),
    author: INITIAL_DEMO_USERS[2],
    likes_count: 31,
    comments_count: 5,
    user_has_liked: true,
  },
  {
    id: "img-3",
    user_id: "usr-1",
    storage_path: "https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=800&auto=format&fit=crop&q=80",
    category: "Animals",
    country: "Japan",
    caption: "A cat sleeping soundly on anti-bird spikes, using the sharp spikes as acupuncture needles.",
    wica_score: 82,
    absurdity: 9,
    rarity: 7,
    craft: 8,
    cultural_novelty: 7,
    wit: 10,
    ai_verdict: "Feline nonchalance weaponizing hostile architecture into luxury acupressure.",
    moderation_status: "approved",
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    author: INITIAL_DEMO_USERS[1],
    likes_count: 58,
    comments_count: 12,
    user_has_liked: false,
  },
  {
    id: "img-4",
    user_id: "usr-4",
    storage_path: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&auto=format&fit=crop&q=80",
    category: "Food",
    country: "Italy",
    caption: "A croissant baked in the uncanny, hyper-detailed shape of a sleeping puppy.",
    wica_score: 76,
    absurdity: 8,
    rarity: 8,
    craft: 9,
    cultural_novelty: 5,
    wit: 8,
    ai_verdict: "A culinary optical illusion that sparks immediate moral conflict before breakfast.",
    moderation_status: "approved",
    created_at: new Date(Date.now() - 3600000 * 30).toISOString(),
    author: INITIAL_DEMO_USERS[4],
    likes_count: 24,
    comments_count: 4,
    user_has_liked: false,
  },
  {
    id: "img-5",
    user_id: "usr-1",
    storage_path: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80",
    category: "Human-Made",
    country: "Germany",
    caption: "A skyscraper with a missing floor designed like an open sky bridge with trees inside.",
    wica_score: 71,
    absurdity: 7,
    rarity: 8,
    craft: 9,
    cultural_novelty: 5,
    wit: 6,
    ai_verdict: "Structural engineering executing a literal gap in commercial reality.",
    moderation_status: "approved",
    created_at: new Date(Date.now() - 3600000 * 42).toISOString(),
    author: INITIAL_DEMO_USERS[1],
    likes_count: 19,
    comments_count: 2,
    user_has_liked: false,
  },
  {
    id: "img-6",
    user_id: "usr-2",
    storage_path: "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=800&auto=format&fit=crop&q=80",
    category: "Coincidences",
    country: "United States",
    caption: "Shadow of a streetlamp lining up with a sidewalk crack to draw a perfect cartoon face.",
    wica_score: 68,
    absurdity: 7,
    rarity: 7,
    craft: 6,
    cultural_novelty: 5,
    wit: 9,
    ai_verdict: "Astrophysical alignment meeting municipal pavement damage in an accidental portrait.",
    moderation_status: "approved",
    created_at: new Date(Date.now() - 3600000 * 50).toISOString(),
    author: INITIAL_DEMO_USERS[2],
    likes_count: 37,
    comments_count: 6,
    user_has_liked: false,
  },
];

const INITIAL_COMMENTS: Record<string, Comment[]> = {
  "img-1": [
    {
      id: "c-1",
      user_id: "usr-1",
      image_id: "img-1",
      body: "Who was on the other end of the line when the lava hit?!",
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      author: INITIAL_DEMO_USERS[1],
    },
    {
      id: "c-2",
      user_id: "usr-2",
      image_id: "img-1",
      body: "Straight out of an SCP foundation archive. 10/10 rarity.",
      created_at: new Date(Date.now() - 3600000).toISOString(),
      author: INITIAL_DEMO_USERS[2],
    },
  ],
  "img-3": [
    {
      id: "c-3",
      user_id: "usr-3",
      image_id: "img-3",
      body: "Spikes were designed by humans, completely misunderstood by cats. Peak comedy.",
      created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
      author: INITIAL_DEMO_USERS[3],
    },
  ],
};

// Global in-memory storage for local dev / demo mode
declare global {
  var __WICA_IMAGES: WicaImage[] | undefined;
  var __WICA_USERS: User[] | undefined;
  var __WICA_COMMENTS: Record<string, Comment[]> | undefined;
  var __WICA_LIKES: Set<string> | undefined; // "userId:imageId"
}

if (!global.__WICA_IMAGES) {
  global.__WICA_IMAGES = [...INITIAL_DEMO_IMAGES];
}
if (!global.__WICA_USERS) {
  global.__WICA_USERS = [...INITIAL_DEMO_USERS];
}
if (!global.__WICA_COMMENTS) {
  global.__WICA_COMMENTS = { ...INITIAL_COMMENTS };
}
if (!global.__WICA_LIKES) {
  global.__WICA_LIKES = new Set<string>(["usr-demo:img-2"]);
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

  const currentUserId = params?.currentUserId || "usr-demo";

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

      const { data: user } = await userQuery.maybeSingle();

      if (user) {
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
        const avg = imageList.length > 0
          ? Math.round(imageList.reduce((acc, img) => acc + (img.wica_score || 0), 0) / imageList.length)
          : 0;

        return {
          user,
          images: imageList,
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

  if (!user && (usernameOrId === "usr-demo" || usernameOrId === "curious_traveler")) {
    user = {
      id: "usr-demo",
      username: "curious_traveler",
      avatar_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      total_wc: 180,
      tier: "Certified Weird",
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    };
    global.__WICA_USERS?.push(user);
  }

  const userImages = (global.__WICA_IMAGES || []).filter(
    (img) => img.user_id === user?.id || (user && img.author?.username === user.username)
  );
  const avgScore = userImages.length > 0
    ? Math.round(userImages.reduce((sum, img) => sum + img.wica_score, 0) / userImages.length)
    : 0;
  const totalWC = user?.total_wc || userImages.reduce((sum, img) => sum + img.wica_score, 0);

  return {
    user,
    images: userImages,
    avgScore,
    totalWC,
  };
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

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.userId);
  const safeUserId = isUUID ? params.userId : "00000000-0000-0000-0000-000000000001";

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
      username: params.authorUser?.username || "curious_traveler",
      avatar_url: params.authorUser?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      tier: params.scoreBreakdown.tier,
    },
    likes_count: 0,
    comments_count: 0,
    user_has_liked: false,
  };

  if (!global.__WICA_IMAGES) {
    global.__WICA_IMAGES = [...INITIAL_DEMO_IMAGES];
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
