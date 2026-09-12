import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Create Battle — Head-to-Head Anomaly Matchup",
  description: "Select two candidate photographs and launch a community showdown in the Versus Arena.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function NewBattleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
