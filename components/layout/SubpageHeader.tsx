"use client";

import React from "react";

export interface SubpageHeaderProps {
  currentPage?: string;
  category?: string;
  title?: string;
  activePath?: string;
}

/**
 * Unified Top Bar architecture:
 * The application has exactly ONE persistent top navigation bar (components/layout/Navbar.tsx)
 * rendered globally in app/layout.tsx. SubpageHeader returns null to eliminate duplicate stacked top bars.
 */
export const SubpageHeader: React.FC<SubpageHeaderProps> = () => {
  return null;
};
