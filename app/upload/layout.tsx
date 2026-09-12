import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Upload Anomaly — Submit to the Index",
  description: "Submit authentic candid photographs to the Wica AI scoring engine to analyze weirdness and uniqueness.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function UploadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
