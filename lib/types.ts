// ==============================================================================
// WECA PHASE 1 DATA MODELS
// ==============================================================================

export type CreatorStatus = "viewer" | "enrolled" | "eligible" | "suspended";

export interface Profile {
  id: string;
  username: string;
  display_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  pronouns?: string | null;
  credits_balance: number;
  is_admin?: boolean;
  follower_count?: number;
  following_count?: number;
  total_impressions?: number;
  creator_status?: CreatorStatus;
  created_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  image_url: string;
  caption?: string | null;
  created_at: string;
  // Reserved for Phase 2 AI scoring
  weirdness_score?: number | null;
  uniqueness_score?: number | null;
  scoring_status?: "scoring" | "completed" | "failed";

  // Joined author and aggregated stats
  profiles?: Profile | null;
  likes_count?: number;
  comments_count?: number;
  user_has_liked?: boolean;
}

export interface Like {
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  post_id?: string;
  user_id: string;
  body: string;
  created_at: string;
  profiles?: Profile | null;
  // Compatibility
  image_id?: string;
  author?: {
    id: string;
    username: string;
    avatar_url?: string | null;
  };
}

// ==============================================================================
// COMPATIBILITY & PHASE 2 RESERVED TYPES
// ==============================================================================

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
  pronouns?: string | null;
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
  email?: string | null;
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
        text: "text-pink-500",
        bg: "bg-pink-50",
        border: "border-pink-200",
        glow: "shadow-[0_0_15px_rgba(255,77,141,0.3)]",
      };
    case "Certified Weird":
      return {
        text: "text-purple-600",
        bg: "bg-purple-50",
        border: "border-purple-200",
        glow: "shadow-[0_0_15px_rgba(124,92,252,0.3)]",
      };
    case "Mildly Odd":
    default:
      return {
        text: "text-cyan-600",
        bg: "bg-cyan-50",
        border: "border-cyan-200",
        glow: "shadow-[0_0_15px_rgba(34,211,238,0.3)]",
      };
  }
}

// ==============================================================================
// WECA PHASE 3: VS BATTLES & VOTING
// ==============================================================================

export interface BattleRecord {
  id: string;
  post_a_id: string;
  post_b_id: string;
  created_by: string;
  status: "active" | "ended";
  winner_post_id?: string | null;
  vote_threshold: number;
  created_at: string;
  ended_at?: string | null;
}

export interface BattleVote {
  id: string;
  battle_id: string;
  voter_id: string;
  voted_for_post_id: string;
  created_at: string;
}

export interface Battle {
  id: string;
  post_a_id?: string;
  post_b_id?: string;
  created_by?: string;
  status: "active" | "ended" | "completed";
  winner_post_id?: string | null;
  vote_threshold?: number;
  created_at?: string;
  ended_at?: string | null;

  // Joined relations & computed stats
  post_a?: Post | null;
  post_b?: Post | null;
  creator?: Profile | null;
  votes_a_count?: number;
  votes_b_count?: number;
  total_votes?: number;
  user_voted_for_post_id?: string | null;
  user_has_voted?: boolean;
  is_creator?: boolean;

  // Compatibility fields for legacy prototypes
  category?: Category;
  title?: string;
  image_a?: any;
  image_b?: any;
  votes_a?: number;
  votes_b?: number;
  ends_at?: string;
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

// ==============================================================================
// WECA PHASE 4: CREDITS, MONETIZATION & PAYOUTS
// ==============================================================================

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  post_id?: string | null;
  battle_id?: string | null;
  payout_request_id?: string | null;
  created_at: string;
}

export type PayoutMethod = "upi" | "bank_account";

export interface PayoutDetails {
  method: PayoutMethod;
  name: string;
  upi_id?: string;
  account_number?: string;
  ifsc?: string;
}

export type PayoutStatus = "pending" | "approved" | "paid" | "rejected";

export interface PayoutRequest {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: PayoutStatus;
  payout_details: PayoutDetails;
  risk_score: number;
  flagged_suspicious: boolean;
  suspicion_reasons: string[];
  admin_notes?: string | null;
  razorpayx_payout_id?: string | null;
  requested_at: string;
  processed_at?: string | null;
  processed_by?: string | null;
  user?: Profile | null;
}

export interface AbuseEvaluation {
  isSuspicious: boolean;
  riskScore: number;
  reasons: string[];
}

// ==============================================================================
// WECA PHASE 5: EARNINGS, CREATOR ELIGIBILITY & INTERACTIONS
// ==============================================================================

export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

export type ImpressionType = "view" | "dwell_3s" | "share" | "save";

export interface PostImpression {
  id: string;
  post_id: string;
  viewer_id: string;
  impression_type: ImpressionType;
  impression_date?: string;
  created_at: string;
}

export type EligibilityStatus = "pending" | "eligible" | "suspended";

export interface CreatorEligibility {
  user_id: string;
  status: EligibilityStatus;
  qualified_posts_count: number;
  follower_count: number;
  total_impressions: number;
  enrollment_date: string;
  qualification_date?: string | null;
  deadline_date?: string | null;
  last_checked_at: string;
  moderation_strikes: number;
}

export interface DailyEarningCap {
  user_id: string;
  cap_date: string;
  interaction_wc_earned: number;
  total_wc_earned: number;
}

export interface LoginStreak {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_login_date?: string | null;
  last_bonus_claimed_date?: string | null;
  total_bonus_earned: number;
}

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  reward_wc: number;
  iconName: string;
  category: "content" | "social" | "battles" | "milestones";
  threshold: number;
  checkField: string;
}

export interface InteractionCreditResult {
  success: boolean;
  new_balance: number;
  daily_used: number;
  capped: boolean;
}
