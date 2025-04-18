"use client";

import { create } from "zustand";
import { createClient } from "@/utils/supabase/client";

interface UserProfile {
  id: string;
  username: string;
  email: string;
  bio?: string | null;
  profile_picture?: string | null;
  reputation?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  post_count?: number;
  comment_count?: number;
}

interface UserProfileStore {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  fetchUserProfile: (userId: string) => Promise<void>;
  clearProfile: () => void;
}

export const useUserProfileStore = create<UserProfileStore>((set) => ({
  profile: null,
  loading: false,
  error: null,

  fetchUserProfile: async (userId) => {
    set({ loading: true, error: null });

    const supabase = createClient();

    try {
      // Fetch full user details
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (userError || !user) {
        set({ error: userError?.message || "User not found" });
        return;
      }

      // Fetch post count
      const { count: postCount, error: postError } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Fetch comment count
      const { count: commentCount, error: commentError } = await supabase
        .from("comments")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (postError || commentError) {
        set({ error: postError?.message || commentError?.message });
        return;
      }

      set({
        profile: {
          ...user,
          post_count: postCount ?? 0,
          comment_count: commentCount ?? 0,
        },
        error: null,
      });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  clearProfile: () => set({ profile: null, error: null }),
}));
