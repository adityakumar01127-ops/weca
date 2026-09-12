"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTheme, Theme } from "@/context/ThemeContext";
import { Sun, Moon, Monitor, ChevronDown } from "lucide-react";

interface ThemeToggleProps {
  className?: string;
  variant?: "icon" | "dropdown" | "segmented";
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = "",
  variant = "icon",
  showLabel = false,
}) => {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  if (variant === "segmented") {
    return (
      <div
        className={`inline-flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono select-none ${className}`}
      >
        <button
          type="button"
          onClick={() => setTheme("light")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
            theme === "light"
              ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs font-semibold"
              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
          }`}
          title="Light theme"
        >
          <Sun className="w-3.5 h-3.5 text-amber-500" />
          <span>Light</span>
        </button>
        <button
          type="button"
          onClick={() => setTheme("dark")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
            theme === "dark"
              ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs font-semibold"
              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
          }`}
          title="Dark theme"
        >
          <Moon className="w-3.5 h-3.5 text-violet" />
          <span>Dark</span>
        </button>
        <button
          type="button"
          onClick={() => setTheme("system")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
            theme === "system"
              ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs font-semibold"
              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
          }`}
          title="System match"
        >
          <Monitor className="w-3.5 h-3.5 text-cyan" />
          <span>System</span>
        </button>
      </div>
    );
  }

  if (variant === "dropdown") {
    return (
      <div ref={dropdownRef} className={`relative inline-block ${className}`}>
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-mono text-zinc-700 dark:text-zinc-300 transition-colors shadow-xs cursor-pointer"
          aria-label="Theme selector"
        >
          {resolvedTheme === "dark" ? (
            <Moon className="w-3.5 h-3.5 text-violet" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-amber-500" />
          )}
          <span className="capitalize">{theme}</span>
          <ChevronDown className="w-3 h-3 opacity-60" />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-1.5 w-36 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl p-1 z-50 animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => {
                setTheme("light");
                setDropdownOpen(false);
              }}
              className={`flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors text-left ${
                theme === "light"
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white font-bold"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Light</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTheme("dark");
                setDropdownOpen(false);
              }}
              className={`flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors text-left ${
                theme === "dark"
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white font-bold"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-violet" />
              <span>Dark</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTheme("system");
                setDropdownOpen(false);
              }}
              className={`flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors text-left ${
                theme === "system"
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white font-bold"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <Monitor className="w-3.5 h-3.5 text-cyan" />
              <span>System</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // Default: Direct icon toggle button (switching between light and dark)
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex items-center justify-center p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-all shadow-xs cursor-pointer group ${className}`}
      title={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      <span className="sr-only">Toggle theme</span>
      <div className="relative w-4 h-4 flex items-center justify-center">
        <Sun
          className={`w-4 h-4 text-amber-500 transition-all duration-300 absolute ${
            resolvedTheme === "dark"
              ? "opacity-0 rotate-90 scale-50 pointer-events-none"
              : "opacity-100 rotate-0 scale-100"
          }`}
        />
        <Moon
          className={`w-4 h-4 text-violet transition-all duration-300 absolute ${
            resolvedTheme === "dark"
              ? "opacity-100 rotate-0 scale-100"
              : "opacity-0 -rotate-90 scale-50 pointer-events-none"
          }`}
        />
      </div>
      {showLabel && (
        <span className="ml-2 text-xs font-mono">
          {resolvedTheme === "dark" ? "Dark" : "Light"}
        </span>
      )}
    </button>
  );
};
