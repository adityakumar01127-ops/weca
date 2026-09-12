import React from "react";
import type { Metadata } from "next";
import { getPostById } from "@/lib/supabase/data";
import { PostDetailClient } from "@/components/posts/PostDetailClient";
import { PostJsonLd } from "@/components/seo/JsonLd";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = await getPostById(id);

  if (!post) {
    return {
      title: "Post Not Found",
      description: "The requested anomaly photograph could not be found.",
      robots: { index: false, follow: true },
    };
  }

  const authorName = post.profiles?.display_name || post.profiles?.username || "Anonymous";
  const title = post.caption
    ? `${post.caption.slice(0, 60)}${post.caption.length > 60 ? "…" : ""} by @${post.profiles?.username || "spotter"}`
    : `Candid Anomaly #${id.slice(0, 8)} by @${post.profiles?.username || "spotter"}`;

  const description = post.caption
    ? `${post.caption} — AI Vision Scored: ${post.weirdness_score ?? "N/A"}/100 Weirdness, ${post.uniqueness_score ?? "N/A"}/100 Uniqueness. Documented on ${SITE_NAME}.`
    : `Candid real-world anomaly photograph scored on the ${SITE_NAME} Global Weirdness Index.`;

  const canonicalUrl = `${SITE_URL}/posts/${id}`;

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
      type: "article",
      images: [
        {
          url: post.image_url,
          width: 1200,
          height: 630,
          alt: post.caption || "Candid real-world anomaly photograph",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [post.image_url],
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { id } = await params;
  const post = await getPostById(id);

  return (
    <>
      {post && (
        <PostJsonLd
          id={post.id}
          caption={post.caption}
          imageUrl={post.image_url}
          createdAt={post.created_at}
          authorName={post.profiles?.display_name}
          authorUsername={post.profiles?.username}
          authorAvatar={post.profiles?.avatar_url}
          weirdnessScore={post.weirdness_score}
          uniquenessScore={post.uniqueness_score}
          likesCount={post.likes_count}
          commentsCount={post.comments_count}
        />
      )}
      <PostDetailClient postId={id} initialPost={post} />
    </>
  );
}
