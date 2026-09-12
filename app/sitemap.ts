import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { getPosts, getBattles } from "@/lib/supabase/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/directory`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/verified-anomalies`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/versus`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/map`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/leaderboard`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/challenges`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/scoring-engine`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/rarity-tiers`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/gemini-vision-api`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/pro`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/brand`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/anomaly-guidelines`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/community-guidelines`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/wallet`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/learn-more`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/signup`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.4,
    },
  ];

  const dynamicPostRoutes: MetadataRoute.Sitemap = [];
  const dynamicProfileRoutes: MetadataRoute.Sitemap = [];
  const dynamicBattleRoutes: MetadataRoute.Sitemap = [];

  try {
    const posts = await getPosts();
    const usernames = new Set<string>();

    for (const post of posts) {
      if (post.id) {
        dynamicPostRoutes.push({
          url: `${SITE_URL}/posts/${post.id}`,
          lastModified: post.created_at ? new Date(post.created_at) : new Date(),
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }
      if (post.profiles?.username) {
        usernames.add(post.profiles.username);
      }
    }

    for (const username of usernames) {
      dynamicProfileRoutes.push({
        url: `${SITE_URL}/profile/${username}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  } catch (err) {
    console.error("Error fetching posts for sitemap:", err);
  }

  try {
    const battles = await getBattles("active");
    for (const battle of battles) {
      if (battle.id) {
        dynamicBattleRoutes.push({
          url: `${SITE_URL}/versus/${battle.id}`,
          lastModified: new Date(),
          changeFrequency: "daily",
          priority: 0.7,
        });
      }
    }
  } catch (err) {
    console.error("Error fetching battles for sitemap:", err);
  }

  return [
    ...staticRoutes,
    ...dynamicPostRoutes,
    ...dynamicProfileRoutes,
    ...dynamicBattleRoutes,
  ];
}
