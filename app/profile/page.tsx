"use client";

import React from "react";
import { ProtectedRoute } from "@/components/ui/ProtectedRoute";
import { ProfileView } from "@/components/profile/ProfileView";
import { useAuth } from "@/context/AuthContext";

export default function MyProfilePage() {
  const { user, profile } = useAuth();
  const username = profile?.username || user?.username || "weca_explorer";

  return (
    <ProtectedRoute>
      <ProfileView username={username} />
    </ProtectedRoute>
  );
}
