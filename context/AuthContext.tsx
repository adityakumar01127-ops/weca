"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User as SupabaseAuthUser } from "@supabase/supabase-js";
import { Profile, User } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

interface AuthContextType {
  user: User | null;
  authUser: SupabaseAuthUser | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, username: string, displayName?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  loginAsDemo: () => void;
  // Compatibility aliases
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithEmail: (email: string, password: string, username: string) => Promise<{ error?: string }>;
  openAuthModal: (mode?: unknown) => void;
  closeAuthModal: () => void;
  isAuthModalOpen: boolean;
  updateProfile: (data: Partial<User>) => Promise<void>;
  updateUserWC: (delta: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_PROFILE: Profile = {
  id: "00000000-0000-0000-0000-000000000001",
  username: "weca_explorer",
  display_name: "Weca Explorer",
  avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  bio: "Exploring and capturing unique moments.",
  credits_balance: 0,
  created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authUser, setAuthUser] = useState<SupabaseAuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const supabase = createClient();

  // Helper to fetch profile from public.profiles
  const fetchProfile = async (userId: string, email?: string) => {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (!error && data) {
        return data as Profile;
      }

      // If no profile exists yet, create one
      const rawUsername = email ? email.split("@")[0] : `user_${userId.slice(0, 6)}`;
      const newProfile: Profile = {
        id: userId,
        username: rawUsername,
        display_name: rawUsername,
        avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${rawUsername}`,
        bio: "",
        credits_balance: 0,
        created_at: new Date().toISOString(),
      };

      await supabase.from("profiles").insert(newProfile);
      return newProfile;
    } catch (err) {
      console.warn("Error fetching user profile:", err);
      return null;
    }
  };

  useEffect(() => {
    async function initAuth() {
      if (!supabase) {
        // Fallback for demo
        const storedDemo = typeof window !== "undefined" ? localStorage.getItem("weca_demo_user") : null;
        if (storedDemo) {
          setProfile(DEMO_PROFILE);
        }
        setLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          setAuthUser(session.user);
          const p = await fetchProfile(session.user.id, session.user.email);
          setProfile(p);
        } else {
          // Check demo storage
          const storedDemo = typeof window !== "undefined" ? localStorage.getItem("weca_demo_user") : null;
          if (storedDemo) {
            setProfile(DEMO_PROFILE);
          }
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
      } finally {
        setLoading(false);
      }

      // Subscribe to auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          setAuthUser(session.user);
          const p = await fetchProfile(session.user.id, session.user.email);
          setProfile(p);
        } else {
          setAuthUser(null);
          const storedDemo = typeof window !== "undefined" ? localStorage.getItem("weca_demo_user") : null;
          if (!storedDemo) {
            setProfile(null);
          }
        }
        setLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    }

    initAuth();
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    if (!supabase) {
      // Local demo sign in
      setProfile(DEMO_PROFILE);
      localStorage.setItem("weca_demo_user", "true");
      return {};
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        setAuthUser(data.user);
        const p = await fetchProfile(data.user.id, data.user.email);
        setProfile(p);
      }

      return {};
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sign in";
      return { error: msg };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    username: string,
    displayName?: string
  ): Promise<{ error?: string }> => {
    if (!supabase) {
      setProfile({
        ...DEMO_PROFILE,
        username,
        display_name: displayName || username,
      });
      localStorage.setItem("weca_demo_user", "true");
      return {};
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            display_name: displayName || username,
            avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${username}`,
          },
        },
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        setAuthUser(data.user);
        const p = await fetchProfile(data.user.id, data.user.email);
        setProfile(p);
      }

      return {};
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sign up";
      return { error: msg };
    }
  };

  const signOut = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("weca_demo_user");
    }
    setAuthUser(null);
    setProfile(null);

    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn("Sign out error:", err);
      }
    }
  };

  const loginAsDemo = () => {
    setProfile(DEMO_PROFILE);
    if (typeof window !== "undefined") {
      localStorage.setItem("weca_demo_user", "true");
    }
  };

  const openAuthModal = (..._args: unknown[]) => {
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const updateUserWC = (delta: number) => {
    if (profile) {
      setProfile({
        ...profile,
        credits_balance: Math.max(0, profile.credits_balance + delta),
      });
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!profile) return;
    const updated: Profile = {
      ...profile,
      username: data.username ?? profile.username,
      display_name: data.display_name ?? profile.display_name,
      avatar_url: data.avatar_url ?? profile.avatar_url,
      bio: data.bio ?? profile.bio,
      credits_balance: data.total_wc ?? profile.credits_balance,
    };
    setProfile(updated);
    if (supabase) {
      try {
        await supabase
          .from("profiles")
          .update({
            username: updated.username,
            display_name: updated.display_name,
            avatar_url: updated.avatar_url,
            bio: updated.bio,
            credits_balance: updated.credits_balance,
          })
          .eq("id", profile.id);
      } catch (e) {
        console.warn("Update profile error:", e);
      }
    }
  };

  // Construct derived User object for full compatibility with legacy components
  const user: User | null = profile
    ? {
        id: profile.id,
        username: profile.username,
        display_name: profile.display_name || profile.username,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
        total_wc: profile.credits_balance || 0,
        tier: "Certified Weird",
        created_at: profile.created_at,
        country: "Global",
        website: "",
        followers_count: 0,
        following_count: 0,
        is_ai_profile: false,
        show_suggestions: true,
        gender: "",
        email: authUser?.email,
      }
    : authUser
    ? {
        id: authUser.id,
        username: authUser.email?.split("@")[0] || "user",
        display_name: authUser.email?.split("@")[0] || "user",
        avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${authUser.id}`,
        bio: "",
        total_wc: 0,
        tier: "Mildly Odd",
        created_at: authUser.created_at,
        country: "Global",
        website: "",
        followers_count: 0,
        following_count: 0,
        is_ai_profile: false,
        show_suggestions: true,
        gender: "",
        email: authUser.email,
      }
    : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        authUser,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        loginAsDemo,
        signInWithEmail: signIn,
        signUpWithEmail: (email, pass, user) => signUp(email, pass, user),
        openAuthModal,
        closeAuthModal,
        isAuthModalOpen,
        updateProfile,
        updateUserWC,
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
