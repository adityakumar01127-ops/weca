import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { getAuthenticatedUser, isUserAdmin } from "@/lib/auth-server";

export const metadata: Metadata = {
  title: "Admin Control Panel",
  description: "Administrative console for managing payout requests and platform verifications.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/login?redirect=/admin/payouts");
  }

  const isAdmin = await isUserAdmin(user.id, user.email);
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-display font-black tracking-tight">Access Restricted</h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-mono">
            This console is reserved for verified platform administrators. Your account does not have permission to access this area.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 text-xs font-mono font-semibold transition-opacity hover:opacity-90 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Platform</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
}

