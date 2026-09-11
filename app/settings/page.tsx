import React from "react";
import type { Metadata } from "next";
import { SettingsView } from "@/components/settings/SettingsView";

export const metadata: Metadata = {
  title: "Settings • Edit Profile | Wica",
  description: "Customize your Wica profile, manage notification preferences, account privacy, and download 4K archival anomalies.",
};

export default function SettingsPage() {
  return <SettingsView />;
}
