"use client";

import { create } from 'zustand';
import { createClient } from "@/utils/supabase/client";

// Define community interface
interface Community {
  id: number;
  name: string;
  description: string | null;
  banner_picture: string | null;
  created_at: string | null;
  created_by: string;
  is_private: boolean | null;
  updated_at: string | null;
}

interface CommunityStore {
  communities: Community[];
  loading: boolean;
  error: string | null;
  fetchCommunities: () => Promise<void>;
  setCommunities: (communities: Community[]) => void;
  addCommunity: (community: Community) => void;
  updateCommunity: (id: number, updates: Partial<Community>) => void;
  deleteCommunity: (id: number) => void;
}

export const useCommunityStore = create<CommunityStore>((set, get) => ({
  communities: [],
  loading: false,
  error: null,

  fetchCommunities: async () => {
    set({ loading: true, error: null });
    try {
        console.log("Community API Called");
      const supabase = createClient();
      const { data, error } = await supabase
        .from("community")
        .select()
        .order("created_at", { ascending: false });

      if (error) throw error;
      set({ communities: data || [] });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  setCommunities: (communities) => {
    set({ communities });
  },

  addCommunity: (community) => {
    set((state) => ({
      communities: [...state.communities, community],
    }));
  },

  updateCommunity: (id, updates) => {
    set((state) => ({
      communities: state.communities.map((community) =>
        community.id === id ? { ...community, ...updates } : community
      ),
    }));
  },

  deleteCommunity: (id) => {
    set((state) => ({
      communities: state.communities.filter((community) => community.id !== id),
    }));
  },
}));