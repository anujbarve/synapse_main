"use client";

import { create } from 'zustand';
import { createClient } from "@/utils/supabase/client";

interface UserData {
  id: string;
  username: string;
  email: string;
  bio?: string | null;
  profile_picture?: string | null;
  reputation?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface UserStore {
  user: UserData | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  setUser: (user: UserData | null) => void;
  fetchUser: () => Promise<void>;
  updateUser: (updates: Partial<UserData>) => Promise<void>;
  logout: () => Promise<void>;
}

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  loading: false,
  error: null,
  initialized: false,

  setUser: (user) => set({ user }),

  fetchUser: async () => {
    // Prevent multiple initial fetches
    if (get().loading || get().initialized) return;
    
    set({ loading: true, error: null });
    const supabase = createClient();

    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError || !authData.user) {
        set({ user: null, error: "Not authenticated" });
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (userError || !userData) {
        set({ user: null, error: userError?.message || "User data not found" });
        return;
      }

      set({ user: userData, error: null });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false, initialized: true });
    }
  },

  updateUser: async (updates) => {
    const supabase = createClient();
    const currentUser = get().user;

    if (!currentUser) {
      set({ error: "No user logged in" });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", currentUser.id)
        .single();

      if (error) throw error;

      set({ user: { ...currentUser, ...updates } });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  logout: async () => {
    const supabase = createClient();
    try {
      await supabase.auth.signOut();
      set({ user: null });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },
}));