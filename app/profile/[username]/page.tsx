import React from "react";
import type { Metadata } from "next";
import { getProfileWithPosts } from "@/lib/supabase/data";
import { ProfileView } from "@/components/profile/ProfileView";
import { ProfileJsonLd } from "@/components/seo/JsonLd";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

type Props = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username);
  const { profile } = await getProfileWithPosts(decodedUsername);

  const displayName = profile?.display_name || decodedUsername;
  const title = `${displayName} (@${decodedUsername}) — Anomaly Spotter`;
  const description =
    profile?.bio ||
    `Explore @${decodedUsername}'s collection of candid anomalies, verified encounters, and Weird Credits on ${SITE_NAME}.`;
  const canonicalUrl = `${SITE_URL}/profile/${encodeURIComponent(decodedUsername)}`;

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
      type: "profile",
      images: profile?.avatar_url
        ? [
            {
              url: profile.avatar_url,
              alt: `${displayName}'s avatar`,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: profile?.avatar_url ? [profile.avatar_url] : undefined,
    },
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username);
  const { profile } = await getProfileWithPosts(decodedUsername);

  return (
    <>
      <ProfileJsonLd
        username={decodedUsername}
        displayName={profile?.display_name}
        bio={profile?.bio}
        avatarUrl={profile?.avatar_url}
        creditsBalance={profile?.credits_balance}
        createdAt={profile?.created_at}
      />
      <ProfileView username={decodedUsername} />
    </>
  );
}
