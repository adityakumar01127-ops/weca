"use client";

import React from "react";
import { useParams } from "next/navigation";
import { ProfileView } from "@/components/profile/ProfileView";

export default function PublicProfilePage() {
  const params = useParams();
  const username = (params.username as string) || "";

  return <ProfileView username={username} />;
}
