export type Category = 
  | "Nature" 
  | "Food" 
  | "Human-Made" 
  | "Animals" 
  | "Objects" 
  | "Coincidences" 
  | "Other";

export const CATEGORIES: Category[] = [
  "Nature",
  "Food",
  "Human-Made",
  "Animals",
  "Objects",
  "Coincidences",
  "Other",
];

export type Tier = 
  | "Mildly Odd" 
  | "Certified Weird" 
  | "Reality-Breaking" 
  | "Legendary Anomaly";

export interface User {
  id: string;
  username: string;
  display_name?: string | null;
  country?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  website?: string | null;
  gender?: string | null;
  is_ai_profile?: boolean;
  show_suggestions?: boolean;
  note?: string | null;
  followers_count?: number;
  following_count?: number;
  total_wc: number;
  tier: Tier;
  created_at: string;
}

export interface WicaImage {
  id: string;
  user_id: string;
  storage_path: string;
  category: Category;
  country?: string | null;
  caption?: string | null;
  embedding?: number[] | null;
  wica_score: number;
  absurdity: number;
  rarity: number;
  craft: number;
  cultural_novelty: number;
  wit: number;
  ai_verdict: string;
  moderation_status: "approved" | "pending_review" | "rejected";
  created_at: string;
  
  // Joined or calculated fields
  author?: {
    id: string;
    username: string;
    avatar_url?: string | null;
    tier?: Tier;
  };
  likes_count?: number;
  comments_count?: number;
  user_has_liked?: boolean;
}

export interface Comment {
  id: string;
  user_id: string;
  image_id: string;
  body: string;
  created_at: string;
  author?: {
    id: string;
    username: string;
    avatar_url?: string | null;
  };
}

export interface ScoreBreakdown {
  absurdity: number;
  rarity: number;
  craft: number;
  cultural_novelty: number;
  wit: number;
  one_line_verdict: string;
  flags: string[];
  composite_score: number;
  tier: Tier;
}

export function getTierFromScore(score: number): Tier {
  if (score >= 85) return "Legendary Anomaly";
  if (score >= 65) return "Reality-Breaking";
  if (score >= 40) return "Certified Weird";
  return "Mildly Odd";
}

export function getTierColor(tier: Tier): { text: string; bg: string; border: string; glow: string } {
  switch (tier) {
    case "Legendary Anomaly":
      return {
        text: "text-amber-500",
        bg: "bg-amber-50",
        border: "border-amber-200",
        glow: "shadow-[0_0_15px_rgba(245,158,11,0.3)]",
      };
    case "Reality-Breaking":
      return {
        text: "text-magenta",
        bg: "bg-pink-50",
        border: "border-pink-200",
        glow: "shadow-[0_0_15px_rgba(255,77,141,0.3)]",
      };
    case "Certified Weird":
      return {
        text: "text-violet",
        bg: "bg-purple-50",
        border: "border-purple-200",
        glow: "shadow-[0_0_15px_rgba(124,92,252,0.3)]",
      };
    case "Mildly Odd":
    default:
      return {
        text: "text-cyan",
        bg: "bg-cyan-50",
        border: "border-cyan-200",
        glow: "shadow-[0_0_15px_rgba(34,211,238,0.3)]",
      };
  }
}

export interface Battle {
  id: string;
  category: Category;
  title?: string;
  image_a: WicaImage;
  image_b: WicaImage;
  votes_a: number;
  votes_b: number;
  ends_at: string;
  status: "active" | "completed";
  user_voted?: "a" | "b";
}

export interface Challenge {
  id: string;
  title: string;
  theme: string;
  description: string;
  category: Category;
  hashtag: string;
  ends_at: string;
  reward_wc: number;
  submissions_count: number;
  featured_images: WicaImage[];
  status: "active" | "completed";
  winner?: {
    hunter_name: string;
    anomaly_title: string;
    image_url: string;
    wica_score: number;
  };
}

export interface LeaderboardHunter {
  rank: number;
  user: User;
  top_anomaly?: WicaImage;
  accuracy_percent: number;
  streak_days: number;
  anomalies_count: number;
  trend: "up" | "down" | "same";
}

export interface WalletTransaction {
  id: string;
  amount: number;
  reason: string;
  type: "earn" | "spend" | "bonus" | "payout";
  created_at: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  reward_wc: number;
  iconName: string;
  unlocked: boolean;
  progress: number;
}

