"use client";

import React from "react";
import { AuthConsole } from "@/components/auth/AuthConsole";

export default function LoginPage() {
  return <AuthConsole initialMode="signin" />;
}
