export const SITE_NAME = "Weca";
export const BRAND_ALT_NAME = "Weca";
export const SITE_TAGLINE = "The Global Weirdness Index";
export const SITE_SUBTITLE = "Real-World Candid Anomalies & Gemini Vision Multimodal Scoring";

export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "https://weca-kappa.vercel.app";
}

export const SITE_URL = getSiteUrl();

export const DEFAULT_TITLE = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const TITLE_TEMPLATE = `%s | ${SITE_NAME}`;

export const DEFAULT_DESCRIPTION =
  "The decentralized ledger and social discovery platform for authentic, unedited real-world anomalies. Candid photographs scored 0-100 by Google Gemini Vision for surrealism and rarity.";

export const DEFAULT_KEYWORDS = [
  "Weca",
  "weca.app",
  "Weca App",
  "The Global Weirdness Index",
  "Weca Score",
  "real world anomalies",
  "candid photography",
  "Gemini Vision AI",
  "multimodal scoring",
  "weird credits",
  "authentic photos",
  "anti-slop photography",
  "surreal phenomena",
  "anomaly directory",
  "photo leaderboard",
  "versus battles",
  "street photography anomalies",
];

export const TWITTER_HANDLE = "@weca_app";

export function getCanonicalUrl(path: string = "/"): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${cleanPath === "/" ? "" : cleanPath}`;
}
