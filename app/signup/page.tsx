"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ArrowRight } from "lucide-react";

export default function SignUpPage() {
  const { signUp, loginAsDemo } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email || !password) {
      setError("Please fill out all required fields.");
      return;
    }

    if (username.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");

    const res = await signUp(email, password, cleanUsername, displayName.trim() || cleanUsername);
    if (res.error) {
      setError(res.error);
      setLoading(false);
    } else {
      router.push("/");
    }
  };

  const handleDemoLogin = () => {
    loginAsDemo();
    router.push("/");
  };

  return (
    <div className="max-w-sm mx-auto px-4 py-12 space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
          Create a Weca Account
        </h1>
        <p className="text-xs text-zinc-500 font-mono">
          Join the foundation and share photographs
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Username <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="wanderer"
            required
            className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Display Name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Wanderer"
            className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Email <span className="text-rose-500">*</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Password <span className="text-rose-500">*</span>
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 text-xs font-medium transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          {loading ? (
            <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white dark:border-zinc-900/40 dark:border-t-zinc-900 rounded-full animate-spin" />
          ) : (
            <>
              <span>Create account</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>

      <div className="relative flex items-center justify-center">
        <div className="border-t border-zinc-800 w-full" />
        <span className="bg-[#09090b] px-2 text-[10px] text-zinc-500 font-mono uppercase tracking-wider relative">
          or
        </span>
      </div>

      <button
        onClick={handleDemoLogin}
        className="w-full py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-xs text-zinc-600 dark:text-zinc-400 transition-colors"
      >
        Continue as Guest Explorer
      </button>

      <div className="text-center text-xs text-zinc-500">
        Already have an account?{" "}
        <Link href="/login" className="text-zinc-900 dark:text-white font-medium underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}
