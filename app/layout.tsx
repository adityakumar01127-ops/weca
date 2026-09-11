import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "Weca — Photo Sharing",
  description: "A minimal, restrained photo-sharing social app. Phase 1 foundation and core feed.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 antialiased">
      <body className="min-h-full flex flex-col bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 font-sans">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
