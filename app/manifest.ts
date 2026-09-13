import type { MetadataRoute } from "next";
import { SITE_NAME, DEFAULT_DESCRIPTION } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — The Global Weirdness Index`,
    short_name: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    start_url: "/?source=pwa",
    id: "/?source=pwa",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    background_color: "#09090b",
    theme_color: "#09090b",
    orientation: "portrait",
    categories: ["photography", "social", "entertainment"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/weca-logo.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "Upload Anomaly",
        short_name: "Upload",
        description: "Submit a photo to the Weca Vision scoring engine",
        url: "/upload?source=pwa_shortcut",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Versus Battles",
        short_name: "Versus",
        description: "Vote on head-to-head physical anomalies",
        url: "/versus?source=pwa_shortcut",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Anomaly Map",
        short_name: "Map",
        description: "Explore geolocated high-strangeness reports",
        url: "/map?source=pwa_shortcut",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Verified Vault",
        short_name: "Vault",
        description: "Browse curated Tier 1-5 verified anomalies",
        url: "/verified-anomalies?source=pwa_shortcut",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
