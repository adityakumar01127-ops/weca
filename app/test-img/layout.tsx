import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Image Diagnostic",
  robots: {
    index: false,
    follow: false,
  },
};

export default function TestImgLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
