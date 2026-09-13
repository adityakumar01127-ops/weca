"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Info, Globe, ChevronDown } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

interface SignUpPageViewProps {
  onProceedToConfirm: (formData: {
    email: string;
    password: string;
    username: string;
    fullName: string;
    dob: { day: string; month: string; year: string };
  }) => void;
  onBackToLogin?: () => void;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1));
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 90 }, (_, i) => String(CURRENT_YEAR - 13 - i));

export const SignUpPageView: React.FC<SignUpPageViewProps> = ({
  onProceedToConfirm,
  onBackToLogin,
}) => {
  const router = useRouter();

  const [identifier, setIdentifier] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [fullName, setFullName] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [day, setDay] = useState<string>("15");
  const [month, setMonth] = useState<string>("June");
  const [year, setYear] = useState<string>("2000");
  const [showDobTooltip, setShowDobTooltip] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim()) {
      setError("Please enter your email address");
      return;
    }
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    if (!username.trim()) {
      setError("Please choose a username");
      return;
    }

    const email = identifier.includes("@") ? identifier.trim() : `${identifier.trim()}@wica.ai`;

    onProceedToConfirm({
      email,
      password,
      username: username.toLowerCase().replace(/[^a-z0-9_]/g, ""),
      fullName: fullName.trim() || username.trim(),
      dob: { day, month, year },
    });
  };

  const handleBack = () => {
    if (onBackToLogin) {
      onBackToLogin();
    } else {
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 font-sans selection:bg-violet/20 transition-colors duration-200">
      
      {/* Top Header Row with Back Button */}
      <header className="w-full max-w-xl mx-auto px-4 sm:px-6 pt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          className="p-2 -ml-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
          aria-label="Go back to login"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200">
          <Logo size={20} showWordmark={true} />
        </div>

        <div className="w-9" /> {/* Spacer */}
      </header>

      {/* Main Form Section */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
        <div className="w-full max-w-[420px] mx-auto text-left">
          
          {/* Header Title & Subtitle */}
          <h1 className="font-display font-bold text-2xl sm:text-[28px] text-zinc-900 dark:text-white tracking-tight mb-2">
            Get started on Weca
          </h1>
          <p className="text-xs sm:text-[13px] text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
            Sign up to discover and score rare anomalies with the world.
          </p>

          {/* Error Notice */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-xs text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* 1. Mobile or email address */}
            <div>
              <label htmlFor="identifier" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Mobile number or email address
              </label>
              <input
                id="identifier"
                type="text"
                required
                placeholder="Mobile number or email address"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full px-4 py-3.5 text-sm bg-zinc-50/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl focus:outline-none focus:bg-white dark:focus:bg-zinc-900 focus:border-zinc-400 dark:focus:border-zinc-500 focus:ring-1 focus:ring-zinc-400 transition-all placeholder:text-zinc-400 font-sans"
              />
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1.5 leading-normal">
                You may receive notifications from us.{" "}
                <span className="text-violet hover:underline cursor-pointer">
                  Learn more about how we use your contact info.
                </span>
              </p>
            </div>

            {/* 2. Password */}
            <div>
              <label htmlFor="pass" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="pass"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-4 pr-11 py-3.5 text-sm bg-zinc-50/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl focus:outline-none focus:bg-white dark:focus:bg-zinc-900 focus:border-zinc-400 dark:focus:border-zinc-500 focus:ring-1 focus:ring-zinc-400 transition-all placeholder:text-zinc-400 font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 3. Date of birth (i) */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Date of birth
                </label>
                <button
                  type="button"
                  onClick={() => setShowDobTooltip(!showDobTooltip)}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 focus:outline-none"
                  aria-label="Info about date of birth"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>

              {showDobTooltip && (
                <div className="mb-2 p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[11px] text-zinc-600 dark:text-zinc-300">
                  This helps ensure the right experience for your age and won&apos;t be part of your public profile.
                </div>
              )}

              {/* 3 Dropdowns: Day | Month | Year */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="relative">
                  <select
                    value={day}
                    onChange={(e) => setDay(e.target.value)}
                    className="w-full appearance-none px-3.5 py-3 text-sm bg-zinc-50/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl focus:outline-none focus:bg-white dark:focus:bg-zinc-900 focus:border-zinc-400 dark:focus:border-zinc-500 focus:ring-1 focus:ring-zinc-400 cursor-pointer pr-8 font-mono"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">
                        {d}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3 top-3.5 pointer-events-none" />
                </div>

                <div className="relative">
                  <select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="w-full appearance-none px-3.5 py-3 text-sm bg-zinc-50/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl focus:outline-none focus:bg-white dark:focus:bg-zinc-900 focus:border-zinc-400 dark:focus:border-zinc-500 focus:ring-1 focus:ring-zinc-400 cursor-pointer pr-8"
                  >
                    {MONTHS.map((m) => (
                      <option key={m} value={m} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">
                        {m.slice(0, 3)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3 top-3.5 pointer-events-none" />
                </div>

                <div className="relative">
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full appearance-none px-3.5 py-3 text-sm bg-zinc-50/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl focus:outline-none focus:bg-white dark:focus:bg-zinc-900 focus:border-zinc-400 dark:focus:border-zinc-500 focus:ring-1 focus:ring-zinc-400 cursor-pointer pr-8 font-mono"
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">
                        {y}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3 top-3.5 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* 4. Name */}
            <div>
              <label htmlFor="fullname" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Name
              </label>
              <input
                id="fullname"
                type="text"
                placeholder="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3.5 text-sm bg-zinc-50/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl focus:outline-none focus:bg-white dark:focus:bg-zinc-900 focus:border-zinc-400 dark:focus:border-zinc-500 focus:ring-1 focus:ring-zinc-400 transition-all placeholder:text-zinc-400 font-sans"
              />
            </div>

            {/* 5. Username */}
            <div>
              <label htmlFor="uname" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Username
              </label>
              <input
                id="uname"
                type="text"
                required
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3.5 text-sm bg-zinc-50/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl focus:outline-none focus:bg-white dark:focus:bg-zinc-900 focus:border-zinc-400 dark:focus:border-zinc-500 focus:ring-1 focus:ring-zinc-400 transition-all placeholder:text-zinc-400 font-sans"
              />
            </div>

            {/* Legal Disclaimers (Matching Image 2) */}
            <div className="pt-2 text-[11px] text-zinc-500 dark:text-zinc-400 space-y-2 leading-relaxed">
              <p>
                People who use our service may have uploaded your contact information to Weca.{" "}
                <Link href="/learn-more" className="text-violet hover:underline cursor-pointer">Learn more</Link>
              </p>
              <p>
                By tapping Submit, you agree to create an account and to Weca&apos;s{" "}
                <Link href="/terms" className="text-violet hover:underline cursor-pointer">Terms</Link>,{" "}
                <Link href="/privacy" className="text-violet hover:underline cursor-pointer">Privacy Policy</Link> and{" "}
                <Link href="/anomaly-guidelines" className="text-violet hover:underline cursor-pointer">Anomaly Guidelines</Link>.
              </p>
              <p>
                The Privacy Policy describes the ways we can use the information we collect when you create an account. For example, we use this information to provide, personalize and improve our products, including our Gemini Vision AI scoring engine.
              </p>
            </div>

            {/* Submit Primary Button */}
            <button
              type="submit"
              className="w-full mt-3 py-3 px-4 rounded-xl bg-violet hover:bg-violet/90 text-white font-semibold text-sm shadow-sm transition-all active:scale-[0.98]"
            >
              Submit
            </button>

            {/* Already have an account Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleBack}
                className="w-full py-2.5 px-4 rounded-full bg-zinc-100 dark:bg-zinc-850 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold text-xs text-center transition-all active:scale-[0.98]"
              >
                Already have an account?
              </button>
            </div>

          </form>

        </div>
      </main>

      {/* Standard Minimal Footer */}
      <footer className="w-full py-8 text-xs text-zinc-400 border-t border-zinc-100 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 flex flex-col items-center gap-4 text-center">
          <div className="flex flex-wrap justify-center items-center gap-x-5 gap-y-2 text-[11px] text-zinc-500 dark:text-zinc-400">
            <Link href="/" className="hover:text-zinc-900 dark:hover:text-white transition-colors">World Feed</Link>
            <Link href="/about" className="hover:text-zinc-900 dark:hover:text-white transition-colors">About Weca</Link>
            <Link href="/scoring-engine" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Scoring Engine</Link>
            <Link href="/rarity-tiers" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Rarity Tiers</Link>
            <Link href="/directory" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Anomaly Directory</Link>
            <Link href="/community-guidelines" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Community Guidelines</Link>
            <Link href="/gemini-vision-api" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Gemini Vision API</Link>
            <Link href="/privacy" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Terms</Link>
            <Link href="/verified-anomalies" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Verified Anomalies</Link>
            <Link href="/anomaly-guidelines" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Anomaly Guidelines</Link>
            <Link href="/learn-more" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Learn More</Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-zinc-400 font-mono">
            <div className="flex items-center gap-1 cursor-pointer hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
              <Globe className="w-3.5 h-3.5" />
              <span>English (US)</span>
              <ChevronDown className="w-3 h-3" />
            </div>
            <span>© 2026 Weca — The Global Weirdness Index</span>
          </div>
        </div>
      </footer>

    </div>
  );
};
