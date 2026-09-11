"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Tier, getTierFromScore } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUpWithEmail: (email: string, password: string, username: string) => Promise<{ error?: string }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  loginAsDemo: () => void;
  updateUserWC: (scoreToAdd: number) => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  openAuthModal: () => void;
  isAuthModalOpen: boolean;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_DEMO_USER: User = {
  id: "00000000-0000-0000-0000-000000000001",
  username: "curious_traveler",
  avatar_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
  total_wc: 180,
  tier: "Certified Weird",
  created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  const supabase = createClient();

  useEffect(() => {
    async function initAuth() {
      if (supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();

          if (session?.user) {
            // Fetch profile
            const { data: profile } = await supabase
              .from("users")
              .select("*")
              .eq("id", session.user.id)
              .maybeSingle();

            if (profile) {
              setUser({
                id: profile.id,
                username: profile.username || session.user.email?.split("@")[0] || "user",
                avatar_url: profile.avatar_url,
                total_wc: Number(profile.total_wc) || 0,
                tier: (profile.tier as Tier) || "Mildly Odd",
                created_at: profile.created_at,
              });
            } else {
              // Create default profile for session user
              const newProfile: User = {
                id: session.user.id,
                username: session.user.user_metadata?.username || session.user.email?.split("@")[0] || "explorer",
                avatar_url: session.user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${session.user.id}`,
                total_wc: 0,
                tier: "Mildly Odd",
                created_at: new Date().toISOString(),
              };
              setUser(newProfile);
            }
          } else {
            checkLocalSession();
          }

          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
              const { data: profile } = await supabase
                .from("users")
                .select("*")
                .eq("id", session.user.id)
                .maybeSingle();

              if (profile) {
                setUser({
                  id: profile.id,
                  username: profile.username || session.user.email?.split("@")[0] || "user",
                  avatar_url: profile.avatar_url,
                  total_wc: Number(profile.total_wc) || 0,
                  tier: (profile.tier as Tier) || "Mildly Odd",
                  created_at: profile.created_at,
                });
              }
            } else {
              checkLocalSession();
            }
          });

          return () => {
            subscription.unsubscribe();
          };
        } catch (err) {
          console.warn("Supabase auth init error:", err);
          checkLocalSession();
        }
      } else {
        checkLocalSession();
      }
      setLoading(false);
    }

    function checkLocalSession() {
      const stored = localStorage.getItem("wica_user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && (parsed.id === "usr-demo" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(parsed.id))) {
            parsed.id = DEFAULT_DEMO_USER.id;
            localStorage.setItem("wica_user", JSON.stringify(parsed));
          }
          setUser(parsed);
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    }

    initAuth();
  }, []);

  const signUpWithEmail = async (email: string, password: string, username: string) => {
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`,
          },
        },
      });

      if (error) {
        if (error.message?.toLowerCase().includes("rate limit")) {
          const fallbackUser: User = {
            id: `usr-${Date.now()}`,
            username: username.toLowerCase().replace(/[^a-z0-9_]/g, ""),
            avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`,
            total_wc: 0,
            tier: "Mildly Odd",
            created_at: new Date().toISOString(),
          };
          setUser(fallbackUser);
          localStorage.setItem("wica_user", JSON.stringify(fallbackUser));
          return {};
        }
        return { error: error.message };
      }

      if (data.user) {
        const newUser: User = {
          id: data.user.id,
          username,
          avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`,
          total_wc: 0,
          tier: "Mildly Odd",
          created_at: new Date().toISOString(),
        };
        setUser(newUser);
        localStorage.setItem("wica_user", JSON.stringify(newUser));
      }
      return {};
    }

    // Local simulated auth
    const newUser: User = {
      id: `usr-${Date.now()}`,
      username: username.toLowerCase().replace(/[^a-z0-9_]/g, ""),
      avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`,
      total_wc: 0,
      tier: "Mildly Odd",
      created_at: new Date().toISOString(),
    };
    setUser(newUser);
    localStorage.setItem("wica_user", JSON.stringify(newUser));
    return {};
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { error: error.message };
      return {};
    }

    // Local simulated auth
    const username = email.split("@")[0] || "explorer";
    const loggedUser: User = {
      id: `usr-${Date.now()}`,
      username,
      avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`,
      total_wc: 120,
      tier: "Certified Weird",
      created_at: new Date().toISOString(),
    };
    setUser(loggedUser);
    localStorage.setItem("wica_user", JSON.stringify(loggedUser));
    return {};
  };

  const loginAsDemo = () => {
    setUser(DEFAULT_DEMO_USER);
    localStorage.setItem("wica_user", JSON.stringify(DEFAULT_DEMO_USER));
  };

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem("wica_user");
  };

  const updateUserWC = (scoreToAdd: number) => {
    setUser((prev) => {
      if (!prev) return null;
      const newTotal = (prev.total_wc || 0) + scoreToAdd;
      const updated: User = {
        ...prev,
        total_wc: newTotal,
        tier: getTierFromScore(scoreToAdd),
      };
      localStorage.setItem("wica_user", JSON.stringify(updated));
      return updated;
    });
  };

  const updateProfile = async (updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated: User = {
        ...prev,
        ...updates,
      };
      localStorage.setItem("wica_user", JSON.stringify(updated));
      return updated;
    });

    if (supabase && user?.id) {
      try {
        await supabase
          .from("users")
          .update({
            username: updates.username,
            avatar_url: updates.avatar_url,
            country: updates.country,
          })
          .eq("id", user.id);
      } catch (e) {
        console.error("Supabase profile update warning:", e);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signUpWithEmail,
        signInWithEmail,
        signOut,
        loginAsDemo,
        updateUserWC,
        updateProfile,
        openAuthModal: () => setIsAuthModalOpen(true),
        isAuthModalOpen,
        closeAuthModal: () => setIsAuthModalOpen(false),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
