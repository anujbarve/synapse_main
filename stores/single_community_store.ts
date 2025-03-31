import { create } from "zustand";
import { createClient } from "@/utils/supabase/client";
import { useReputationStore } from "./reputation_store";

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
  currentCommunity: number;
  loading: boolean;
  error: string | null;

  setCurrentCommunity: (community_id: number) => Promise<void>;
  fetchCommunityData: (communityId: string) => Promise<void>;
  setCommunity: (communityData: Community | null) => void;
  setMembers: (membersData: CommunityMember[]) => void;
  
  joinCommunity: (communityId: string, userId: string) => Promise<void>;
  leaveCommunity: (communityId: string, userId: string) => Promise<void>;
  
  promoteMember: (
    communityId: string, 
    userId: string, 
    newRole: string, 
    promotedById: string
  ) => Promise<void>;
  
  muteMember: (
    communityId: string, 
    userId: string, 
    mutedById: string, 
    details: string
  ) => Promise<void>;
  
  banMember: (
    communityId: string, 
    userId: string, 
    bannedById: string, 
    details: string
  ) => Promise<void>;

  createCommunity: (
    communityData: Omit<Community, 'id' | 'created_at' | 'updated_at'>,
    userId: string
  ) => Promise<Community | null>;
}

export const useSingleCommunityStore = create<CommunityStore>((set, get) => ({
  community: null,
  members: [],
  currentCommunity: 0,
  loading: false,
  error: null,

  setCurrentCommunity: async (community_id) => {
    set({ 
      currentCommunity: community_id,
      loading: false,
      error: null 
    });
  },

  setCommunity: (communityData) => set({ community: communityData }),
  
  setMembers: (membersData) => set({ members: membersData }),

  fetchCommunityData: async (communityId: string) => {
    const supabase = createClient();
    set({ loading: true, error: null });

    try {
      // Fetch community data
      const { data: communityData, error: communityError } = await supabase
        .from("community")
        .select()
        .eq("id", communityId)
        .single();

      if (communityError) throw communityError;

      set({ community: communityData });

      // Fetch community members
      const { data: membersData, error: membersError } = await supabase
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

      if (membersError) throw membersError;

      if (membersData) {
        const formattedMembers: CommunityMember[] = membersData.map((member) => ({
          id: member.users.id,
          username: member.users.username,
          profile_picture: member.users.profile_picture,
          role: member.role,
          joined_at: member.joined_at || new Date().toISOString(),
        }));

        set({ 
          members: formattedMembers, 
          loading: false 
        });
      }
    } catch (error) {
      console.error("Error fetching community data:", error);
      set({ 
        error: (error as Error).message, 
        loading: false 
      });
    }
  },

  createCommunity: async (communityData, userId) => {
    const supabase = createClient();
    const { createReputationEntry } = useReputationStore.getState();
    set({ loading: true, error: null });

    try {
      // Insert new community
      const { data, error: insertError } = await supabase
        .from("community")
        .insert({
          ...communityData,
          created_by: userId,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Add first member (creator) to community
      const { error: memberError } = await supabase
        .from("community_members")
        .insert({
          community_id: data.id,
          user_id: userId,
          role: "admin",
        });

      if (memberError) throw memberError;

      // Add reputation entry for creating a community
      await createReputationEntry({
        user_id: userId,
        change_value: 10,
        reason: `Created community: ${data.name}`,
      });

      set({ 
        community: data, 
        members: [{
          id: userId,
          username: '', // You might want to fetch the actual username
          profile_picture: null,
          role: 'admin',
          joined_at: new Date().toISOString(),
        }],
        loading: false 
      });

      return data;
    } catch (error) {
      console.error("Error creating community:", error);
      set({ 
        error: (error as Error).message, 
        loading: false 
      });
      return null;
    }
  },

  joinCommunity: async (communityId, userId) => {
    const supabase = createClient();
    const { createReputationEntry } = useReputationStore.getState();
    set({ loading: true, error: null });

    try {
      // Insert community member
      const { error } = await supabase.from("community_members").insert({
        community_id: parseInt(communityId),
        user_id: userId,
        role: "member",
      });

      if (error) throw new Error(error.message);

      // Fetch community details for reputation reason
      const { data: communityData } = await supabase
        .from("community")
        .select("name")
        .eq("id", communityId)
        .single();

      // Add reputation entry for joining a community
      await createReputationEntry({
        user_id: userId,
        change_value: 2,
        reason: `Joined community: ${communityData?.name || 'Unknown Community'}`,
      });

      // Fetch and add new member to state
      const { data: userData } = await supabase
        .from("users")
        .select("id, username, profile_picture")
        .eq("id", userId)
        .single();

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
          loading: false 
        }));
      }
    } catch (error) {
      console.error("Error joining community:", error);
      set({ 
        error: (error as Error).message, 
        loading: false 
      });
    }
  },

  leaveCommunity: async (communityId, userId) => {
    const supabase = createClient();
    const { createReputationEntry } = useReputationStore.getState();
    set({ loading: true, error: null });

    try {
      // Fetch community details for reputation reason
      const { data: communityData } = await supabase
        .from("community")
        .select("name")
        .eq("id", communityId)
        .single();

      // Remove community membership
      const { error } = await supabase
        .from("community_members")
        .delete()
        .eq("community_id", parseInt(communityId))
        .eq("user_id", userId);

      if (error) throw new Error(error.message);

      // Deduct reputation for leaving community
      await createReputationEntry({
        user_id: userId,
        change_value: -1,
        reason: `Left community: ${communityData?.name || 'Unknown Community'}`,
      });

      set((state) => ({
        members: state.members.filter((member) => member.id !== userId),
        loading: false
      }));
    } catch (error) {
      console.error("Error leaving community:", error);
      set({ 
        error: (error as Error).message, 
        loading: false 
      });
    }
  },

  promoteMember: async (communityId, userId, newRole, promotedById) => {
    const supabase = createClient();
    const { createReputationEntry } = useReputationStore.getState();
    set({ loading: true, error: null });

    try {
      // Update member role
      const { error } = await supabase
        .from("community_members")
        .update({ role: newRole })
        .eq("community_id", parseInt(communityId))
        .eq("user_id", userId);

      if (error) throw new Error(error.message);

      // Fetch community details for reputation reason
      const { data: communityData } = await supabase
        .from("community")
        .select("name")
        .eq("id", communityId)
        .single();

      // Add reputation entries for promotion
      await Promise.all([
        // Reputation for the promoted member
        createReputationEntry({
          user_id: userId,
          change_value: 5,
          reason: `Promoted to ${newRole} in ${communityData?.name || 'Unknown Community'}`,
        }),
        // Reputation for the person doing the promotion
        createReputationEntry({
          user_id: promotedById,
          change_value: 2,
          reason: `Promoted member in ${communityData?.name || 'Unknown Community'}`,
        })
      ]);

      set((state) => ({
        members: state.members.map((member) =>
          member.id === userId ? { ...member, role: newRole } : member
        ),
        loading: false
      }));
    } catch (error) {
      console.error("Error promoting member:", error);
      set({ 
        error: (error as Error).message, 
        loading: false 
      });
    }
  },

  muteMember: async (communityId, userId, mutedById, details) => {
    const supabase = createClient();
    const { createReputationEntry } = useReputationStore.getState();
    set({ loading: true, error: null });

    try {
      // Log moderation action
      const { error } = await supabase.from("moderation_logs").insert({
        community_id: parseInt(communityId),
        user_id: userId,
        action: "Mute",
        details,
      });

      if (error) throw new Error(error.message);

      // Fetch community details for reputation reason
      const { data: communityData } = await supabase
        .from("community")
        .select("name")
        .eq("id", communityId)
        .single();

      // Add reputation entries for muting
      await Promise.all([
        // Deduct reputation for the muted member
        createReputationEntry({
          user_id: userId,
          change_value: -3,
          reason: `Muted in ${communityData?.name || 'Unknown Community'}: ${details}`,
        }),
        // Add reputation for the moderator
        createReputationEntry({
          user_id: mutedById,
          change_value: 1,
          reason: `Moderated member in ${communityData?.name || 'Unknown Community'}`,
        })
      ]);

      set({ loading: false });
    } catch (error) {
      console.error("Error muting member:", error);
      set({ 
        error: (error as Error).message, 
        loading: false 
      });
    }
  },

  banMember: async (communityId, userId, bannedById, details) => {
    const supabase = createClient();
    const { createReputationEntry } = useReputationStore.getState();
    set({ loading: true, error: null });

    try {
      // Remove community membership
      const { error } = await supabase
        .from("community_members")
        .delete()
        .eq("community_id", parseInt(communityId))
        .eq("user_id", userId);

      if (error) throw new Error(error.message);

      // Log moderation action
      await supabase.from("moderation_logs").insert({
        community_id: parseInt(communityId),
        user_id: userId,
        action: "Ban",
        details,
      });

      // Fetch community details for reputation reason
      const { data: communityData } = await supabase
        .from("community")
        .select("name")
        .eq("id", communityId)
        .single();

      // Add reputation entries for banning
      await Promise.all([
        // Significantly deduct reputation for the banned member
        createReputationEntry({
          user_id: userId,
          change_value: -10,
          reason: `Banned from ${communityData?.name || 'Unknown Community'}: ${details}`,
        }),
        // Add reputation for the moderator
        createReputationEntry({
          user_id: bannedById,
          change_value: 3,
          reason: `Banned member from ${communityData?.name || 'Unknown Community'}`,
        })
      ]);

      set((state) => ({
        members: state.members.filter((member) => member.id !== userId),
        loading: false
      }));
    } catch (error) {
      console.error("Error banning member:", error);
      set({ 
        error: (error as Error).message, 
        loading: false 
      });
    }
  },
}));