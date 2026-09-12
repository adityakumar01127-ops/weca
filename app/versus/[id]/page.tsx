import React from "react";
import type { Metadata } from "next";
import { getBattleById } from "@/lib/supabase/data";
import { BattleDetailClient } from "@/components/versus/BattleDetailClient";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const battle = await getBattleById(id);

  if (!battle) {
    return {
      title: "Battle Not Found",
      description: "The requested anomaly showdown could not be found.",
      robots: { index: false, follow: true },
    };
  }

  const nameA = battle.post_a?.caption
    ? battle.post_a.caption.slice(0, 32)
    : "Challenger A";
  const nameB = battle.post_b?.caption
    ? battle.post_b.caption.slice(0, 32)
    : "Challenger B";

  const title = `VS: ${nameA} vs ${nameB}`;
  const description = `Two candidate candid photographs clash in the ${SITE_NAME} Versus Arena. Vote blindly to decide which breaks reality more and earn Weird Credits.`;
  const canonicalUrl = `${SITE_URL}/versus/${id}`;

  const ogImages: { url: string; alt?: string }[] = [];
  if (battle.post_a?.image_url) {
    ogImages.push({
      url: battle.post_a.image_url,
      alt: battle.post_a.caption || "Challenger A",
    });
  }
  if (battle.post_b?.image_url) {
    ogImages.push({
      url: battle.post_b.image_url,
      alt: battle.post_b.caption || "Challenger B",
    });
  }

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      type: "website",
      images: ogImages.length > 0 ? ogImages : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImages.map((img) => img.url),
    },
  };
}

export default async function BattlePage({ params }: Props) {
  const { id } = await params;
  const battle = await getBattleById(id);

  return <BattleDetailClient battleId={id} initialBattle={battle} />;
}
