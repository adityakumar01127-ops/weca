import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "Wica — Score the World's Weirdness",
  description: "A social platform where people upload real photos of strange or unique things, an AI scores each one on weirdness and rarity, and everyone browses the results.",
  icons: {
    icon: "/wica-logo.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-white text-ink antialiased">
      <head>
        <link rel="icon" href="/wica-logo.svg" type="image/svg+xml" />
      </head>
      <body className="min-h-full flex flex-col bg-white text-ink">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
