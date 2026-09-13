import React from "react";
import type { Metadata } from "next";
import { SettingsView } from "@/components/settings/SettingsView";

export const metadata: Metadata = {
  title: "Settings • Edit Profile | Weca",
  description: "Customize your Weca profile, manage notification preferences, account privacy, and download 4K archival anomalies.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SettingsPage() {
  return <SettingsView />;
}
