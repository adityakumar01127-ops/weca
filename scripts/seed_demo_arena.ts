import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

if (typeof (globalThis as any).WebSocket === "undefined") {
  (globalThis as any).WebSocket = class DummyWebSocket {};
}

// Read and parse .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      process.env[key] = val;
    }
  });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

async function seed() {
  console.log("Seeding verified demo posts and battles for UI/UX inspection...");

  const { data: authList } = await supabaseAdmin.auth.admin.listUsers();
  const users = authList?.users || [];
  if (users.length < 2) throw new Error("Need 2 users");

  const u1 = users[0].id;
  const u2 = users[1].id;

  // Ensure profiles
  await supabaseAdmin.from("profiles").upsert([
    {
      id: u1,
      username: "alex_explorer",
      display_name: "Alex V.",
      avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      bio: "Hunting architectural and botanical glitches in Tokyo.",
      credits_balance: 140,
    },
    {
      id: u2,
      username: "aditya_k",
      display_name: "Aditya Kaushik",
      avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      bio: "Capturing surreal candid street moments.",
      credits_balance: 220,
    },
  ]);

  // Seed sample posts
  const demoImages = [
    {
      user_id: u1,
      image_url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80",
      caption: "A vintage payphone half-absorbed into a basalt moss boulder in Kyoto.",
      weirdness_score: 87,
      uniqueness_score: 93,
      scoring_status: "completed",
    },
    {
      user_id: u2,
      image_url: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&auto=format&fit=crop&q=80",
      caption: "Bioluminescent emerald fungi sprouting through a discarded mother board.",
      weirdness_score: 79,
      uniqueness_score: 88,
      scoring_status: "completed",
    },
    {
      user_id: u1,
      image_url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80",
      caption: "Mirrored glass skyscraper reflecting a cloud pattern forming a perfect concentric circle.",
      weirdness_score: 64,
      uniqueness_score: 72,
      scoring_status: "completed",
    },
  ];

  const seededPosts: any[] = [];
  for (const item of demoImages) {
    const { data: p } = await supabaseAdmin.from("posts").insert(item).select().single();
    if (p) seededPosts.push(p);
  }

  console.log(`Seeded ${seededPosts.length} posts.`);

  if (seededPosts.length >= 2) {
    // Seed 1 Active Battle
    const { data: activeBattle } = await supabaseAdmin.from("battles").insert({
      post_a_id: seededPosts[0].id,
      post_b_id: seededPosts[1].id,
      created_by: u1,
      status: "active",
      vote_threshold: 50,
    }).select().single();

    if (activeBattle) {
      console.log(`Created Active Battle: ${activeBattle.id}`);
      // Cast 1 vote from u2 for Challenger A
      await supabaseAdmin.from("battle_votes").insert({
        battle_id: activeBattle.id,
        voter_id: u2,
        voted_for_post_id: seededPosts[0].id,
      });
    }

    // Seed 1 Concluded Battle (if 3 posts exist)
    if (seededPosts.length >= 3) {
      const { data: endedBattle } = await supabaseAdmin.from("battles").insert({
        post_a_id: seededPosts[1].id,
        post_b_id: seededPosts[2].id,
        created_by: u2,
        status: "ended",
        winner_post_id: seededPosts[1].id,
        vote_threshold: 50,
        ended_at: new Date(Date.now() - 3600000 * 5).toISOString(),
      }).select().single();

      if (endedBattle) {
        console.log(`Created Concluded Battle: ${endedBattle.id}`);
        // Add sample votes
        await supabaseAdmin.from("battle_votes").insert([
          { battle_id: endedBattle.id, voter_id: u1, voted_for_post_id: seededPosts[1].id },
        ]);
      }
    }
  }

  console.log("Seeding complete!");
}

seed().catch(console.error);
