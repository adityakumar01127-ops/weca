import type { Metadata } from "next";
import DirectoryPage, { metadata as directoryMetadata } from "../directory/page";
import { SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  ...directoryMetadata,
  alternates: {
    canonical: `${SITE_URL}/directory`,
  },
};

export default DirectoryPage;
