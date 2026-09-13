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

const getStoredProfile = (): Profile | null => {
  if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
    const saved = localStorage.getItem("weca_custom_profile");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
  }
  return null;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authUser, setAuthUser] = useState<SupabaseAuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [userExtras, setUserExtras] = useState<{
    pronouns?: string | null;
    website?: string | null;
    is_ai_profile?: boolean;
    note?: string | null;
    gender?: string | null;
  }>({
    pronouns: "they/them",
    website: "https://weca.ai",
    is_ai_profile: true,
    note: "Just curious...",
    gender: "Explorer",
  });

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
          setAuthUser(null);
          setProfile(null);
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
          setProfile(null);
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
      return { error: "Authentication service unavailable. Missing configuration." };
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
      return { error: "Authentication service unavailable. Missing configuration." };
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
    if (process.env.NODE_ENV === "production") {
      console.warn("Demo login is disabled in production.");
      return;
    }
    const devProfile = getStoredProfile();
    if (devProfile) {
      setProfile(devProfile);
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
    const updatedExtras = {
      pronouns: data.pronouns !== undefined ? data.pronouns : userExtras.pronouns,
      website: data.website !== undefined ? data.website : userExtras.website,
      is_ai_profile: data.is_ai_profile !== undefined ? data.is_ai_profile : userExtras.is_ai_profile,
      note: data.note !== undefined ? data.note : userExtras.note,
      gender: data.gender !== undefined ? data.gender : userExtras.gender,
    };
    setUserExtras(updatedExtras);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("weca_user_extras", JSON.stringify(updatedExtras));
      } catch {}
    }

    if (!profile) return;
    const updated: Profile = {
      ...profile,
      username: data.username ?? profile.username,
      display_name: data.display_name ?? profile.display_name,
      avatar_url: data.avatar_url !== undefined ? data.avatar_url : profile.avatar_url,
      bio: data.bio !== undefined ? data.bio : profile.bio,
      pronouns: data.pronouns !== undefined ? data.pronouns : profile.pronouns,
      credits_balance: data.total_wc ?? profile.credits_balance,
    };
    setProfile(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("weca_custom_profile", JSON.stringify(updated));
      } catch {}
    }
    if (supabase && authUser) {
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
        pronouns: profile.pronouns || userExtras.pronouns || "they/them",
        total_wc: profile.credits_balance || 0,
        tier: "Certified Weird",
        created_at: profile.created_at,
        country: "Global",
        website: userExtras.website || "",
        followers_count: 0,
        following_count: 0,
        is_ai_profile: userExtras.is_ai_profile ?? false,
        show_suggestions: true,
        gender: userExtras.gender || "Explorer",
        note: userExtras.note || "Just curious...",
        email: authUser?.email,
      }
    : authUser
    ? {
        id: authUser.id,
        username: authUser.email?.split("@")[0] || "user",
        display_name: authUser.email?.split("@")[0] || "user",
        avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${authUser.id}`,
        bio: "",
        pronouns: userExtras.pronouns || "they/them",
        total_wc: 0,
        tier: "Mildly Odd",
        created_at: authUser.created_at,
        country: "Global",
        website: userExtras.website || "",
        followers_count: 0,
        following_count: 0,
        is_ai_profile: userExtras.is_ai_profile ?? false,
        show_suggestions: true,
        gender: userExtras.gender || "",
        note: userExtras.note || "Just curious...",
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
