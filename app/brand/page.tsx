import { Metadata } from "next";
import { getCanonicalUrl, SITE_NAME } from "@/lib/seo";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { BrandKitViewer } from "@/components/brand/BrandKitViewer";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Brand Identity, Vector Assets & Logo System",
  description:
    "Official identity guidelines, vector SVG lockups, color architecture, and interactive logo engine for Weca and the Global Weirdness Index.",
  alternates: {
    canonical: getCanonicalUrl("/brand"),
  },
  openGraph: {
    title: `Brand Identity & Vector Assets | ${SITE_NAME}`,
    description:
      "Official brand guidelines, SVG vector emblems, color specifications, and interactive logo system for Weca.",
    url: getCanonicalUrl("/brand"),
  },
  twitter: {
    card: "summary_large_image",
    title: `Brand Guidelines & Logo System | ${SITE_NAME}`,
    description:
      "Explore official Weca & Wica vector logos, Golden Ledger archival seals, and brand color tokens.",
  },
};

export default function BrandPage() {
  const breadcrumbItems = [
    { name: "Home", path: "/" },
    { name: "Brand Guidelines & Logo System", path: "/brand" },
  ];

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-20">
      <BreadcrumbJsonLd items={breadcrumbItems} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Navigation & Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
          <span className="text-zinc-600">/</span>
          <span className="text-zinc-200">Brand Identity & Assets</span>
        </div>

        {/* Hero Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan/10 border border-cyan/30 text-cyan text-xs font-mono font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>OFFICIAL BRAND SYSTEM & ARCHIVAL KIT</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
            Visual Identity & Logo System
          </h1>
          <p className="text-lg text-zinc-400 max-w-3xl leading-relaxed">
            The visual grammar of the Global Weirdness Index. Explore precision-engineered
            chromatic aperture geometry, download standardized production vector SVGs, and
            calibrate responsive lockups for any surface.
          </p>
        </div>

        {/* Interactive Viewer & Download Suite */}
        <BrandKitViewer />
      </div>
    </div>
  );
}
