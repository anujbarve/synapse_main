"use client"
import { create } from "zustand";
import { createClient } from "@/utils/supabase/client";

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

interface CommunityMember {
  id: string;
  username: string;
  profile_picture: string | null;
  role: string | null;
  joined_at: string | null;
}

interface CommunityStore {
  community: Community | null;
  members: CommunityMember[];
  currentCommunity : number;

  setCurrentCommunity : (community_id : number ) => Promise<void>;
  fetchCommunityData: (communityId: string) => Promise<void>;
  setCommunity: (communityData: Community | null) => void;
  setMembers: (membersData: CommunityMember[]) => void;
  joinCommunity: (communityId: string, userId: string) => Promise<void>;
  leaveCommunity: (communityId: string, userId: string) => Promise<void>;
}

export const useSingleCommunityStore = create<CommunityStore>((set) => ({
  community: null,
  members: [],
  currentCommunity : 0,
  
  setCurrentCommunity : async (community_id) => set({currentCommunity : community_id}),
  setCommunity: (communityData) => set({ community: communityData }),
  setMembers: (membersData) => set({ members: membersData }),

  fetchCommunityData: async (communityId: string) => {
    const supabase = createClient();

    try {
      // Fetch community data
      const { data: communityData } = await supabase
        .from("community")
        .select()
        .eq("id", communityId)
        .single();

      set({ community: communityData });

      // Fetch community members
      const { data: membersData } = await supabase
        .from("community_members")
        .select(
          `
          user_id,
          role,
          joined_at,
          users:user_id (
            id,
            username,
            profile_picture
          )
        `
        )
        .eq("community_id", communityId);

      if (membersData) {
        const formattedMembers: CommunityMember[] = membersData.map(
          (member) => ({
            id: member.users.id,
            username: member.users.username,
            profile_picture: member.users.profile_picture,
            role: member.role,
            joined_at: member.joined_at || new Date().toISOString(),
          })
        );

        set({ members: formattedMembers });
      }
    } catch (error) {
      console.error("Error fetching community data:", error);
    }
  },
  joinCommunity: async (communityId, userId) => {
    const supabase = createClient();

    try {
      // Insert community member data
      const { error: insertError } = await supabase.from("community_members").insert({
        community_id: parseInt(communityId),
        user_id: userId,
        role: "member",
      });

      if (insertError) {
        throw new Error(insertError.message);
      }

      // Fetch user data
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, username, profile_picture")
        .eq("id", userId)
        .single();

      if (userError) {
        throw new Error(userError.message);
      }

      if (userData) {
        const newMember = {
          id: userData.id,
          username: userData.username,
          profile_picture: userData.profile_picture,
          role: "member",
          joined_at: new Date().toISOString(),
        };


        set((state) => ({
          members: [...state.members, newMember],
        }));
      }
    } catch (error) {
      console.error("Error joining community:", error);
    }
  },
  leaveCommunity: async (communityId, userId) => {
    const supabase = createClient();
  
    try {
      // Delete the user from the community_members table
      const { error: deleteError } = await supabase
        .from("community_members")
        .delete()
        .eq("community_id", parseInt(communityId))
        .eq("user_id", userId);
  
      if (deleteError) {
        throw new Error(deleteError.message);
      }
  
      // Remove the user from the members state
      set((state) => ({
        members: state.members.filter((member) => member.id !== userId),
      }));
    } catch (error) {
      console.error("Error leaving community:", error);
      throw error; // Propagate error to be handled by the caller
    }
  }
}));
