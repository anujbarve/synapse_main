"use client";

import { create } from 'zustand';
import { createClient } from "@/utils/supabase/client";
import React from 'react';

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
  userCommunities: Community[];
  loading: boolean;
  error: string | null;
  fetchCommunities: () => Promise<void>;
  fetchUserCommunities: (userId: string) => Promise<void>;
  setCommunities: (communities: Community[]) => void;
  addCommunity: (community: Community) => void;
  updateCommunity: (id: number, updates: Partial<Community>) => void;
  deleteCommunity: (id: number) => void;
}

export const useCommunityStore = create<CommunityStore>((set, get) => ({
  communities: [],
  userCommunities: [],
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

  fetchUserCommunities: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      console.log("Fetching User Communities");
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from("community")
        .select(`
          *,
          community_members!inner (
            user_id,
            role
          )
        `)
        .eq('community_members.user_id', userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Filter out the nested community_members data to match the Community interface
      const cleanedData = data?.map(({ community_members, ...community }) => community) || [];
      set({ userCommunities: cleanedData });
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

export const useIsCommunityMember = (communityId: number) => {
  const { userCommunities } = useCommunityStore();
  return React.useMemo(() => userCommunities.some(community => community.id === communityId), [userCommunities, communityId]);
}