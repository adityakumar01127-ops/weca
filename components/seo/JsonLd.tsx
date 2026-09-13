import React from "react";
import { SITE_NAME, BRAND_ALT_NAME, SITE_URL, DEFAULT_DESCRIPTION } from "@/lib/seo";

export function WebsiteAndOrgJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        alternateName: BRAND_ALT_NAME,
        url: SITE_URL,
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/wica-logo.svg`,
          width: 512,
          height: 512,
        },
        description: DEFAULT_DESCRIPTION,
        sameAs: [
          "https://x.com/weca_app",
          "https://github.com/adityakumar01127-ops/weca",
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        alternateName: BRAND_ALT_NAME,
        description: DEFAULT_DESCRIPTION,
        publisher: {
          "@id": `${SITE_URL}/#organization`,
        },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${SITE_URL}/directory?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
        inLanguage: "en-US",
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function PostJsonLd({
  id,
  caption,
  imageUrl,
  createdAt,
  authorName,
  authorUsername,
  authorAvatar,
  weirdnessScore,
  uniquenessScore,
  likesCount,
  commentsCount,
}: {
  id: string;
  caption?: string | null;
  imageUrl: string;
  createdAt: string;
  authorName?: string | null;
  authorUsername?: string | null;
  authorAvatar?: string | null;
  weirdnessScore?: number | null;
  uniquenessScore?: number | null;
  likesCount?: number;
  commentsCount?: number;
}) {
  const postUrl = `${SITE_URL}/posts/${id}`;
  const authorUrl = authorUsername ? `${SITE_URL}/profile/${authorUsername}` : SITE_URL;

  const schema = {
    "@context": "https://schema.org",
    "@type": "SocialMediaPosting",
    "@id": postUrl,
    url: postUrl,
    headline: caption ? caption.slice(0, 100) : "Candid Real-World Anomaly",
    articleBody: caption || "Candid photograph documented and scored on the Weca Weirdness Index.",
    datePublished: createdAt,
    dateModified: createdAt,
    image: [imageUrl],
    author: {
      "@type": "Person",
      name: authorName || authorUsername || "Anonymous Spotter",
      url: authorUrl,
      ...(authorAvatar ? { image: authorAvatar } : {}),
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/wica-logo.svg`,
      },
    },
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/LikeAction",
        userInteractionCount: likesCount || 0,
      },
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/CommentAction",
        userInteractionCount: commentsCount || 0,
      },
    ],
    ...(weirdnessScore != null
      ? {
          contentRating: `Weirdness Score: ${weirdnessScore}/100, Uniqueness Score: ${uniquenessScore ?? "N/A"}/100`,
        }
      : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function ProfileJsonLd({
  username,
  displayName,
  bio,
  avatarUrl,
  creditsBalance,
  createdAt,
}: {
  username: string;
  displayName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  creditsBalance?: number;
  createdAt?: string;
}) {
  const profileUrl = `${SITE_URL}/profile/${username}`;

  const schema = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": profileUrl,
    url: profileUrl,
    name: `${displayName || username} (@${username})`,
    mainEntity: {
      "@type": "Person",
      name: displayName || username,
      alternateName: username,
      description: bio || `Anomaly spotter documenting candid surrealism on Weca.`,
      url: profileUrl,
      ...(avatarUrl ? { image: avatarUrl } : {}),
      ...(createdAt ? { identifier: username } : {}),
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function FaqJsonLd({
  items,
}: {
  items: { question: string; answer: string }[];
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function BreadcrumbJsonLd({
  items,
}: {
  items: { name: string; path: string }[];
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: item.path.startsWith("http") ? item.path : `${SITE_URL}${item.path}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
