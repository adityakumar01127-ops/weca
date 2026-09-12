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
    <html lang="en" className="dark h-full bg-[#09090b] text-zinc-100 antialiased selection:bg-zinc-800">
      <body className="min-h-full flex flex-col bg-[#09090b] text-zinc-100 font-sans">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 w-full">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
