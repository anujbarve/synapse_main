"use client";

import { create } from 'zustand';
import { createClient } from "@/utils/supabase/client";
import React from 'react';
import { useNotificationStore } from './notification_store';

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
  createCommunity: (communityData: Omit<Community, 'id' | 'created_at' | 'updated_at'>) => Promise<Community | null>;
  updateCommunity: (id: number, updates: Partial<Community>) => void;
  deleteCommunity: (id: number) => void;
  joinCommunity: (communityId: number, userId: string) => Promise<boolean>;
  leaveCommunity: (communityId: number, userId: string) => Promise<boolean>;
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

  createCommunity: async (communityData) => {
    set({ loading: true, error: null });
    const supabase = createClient();
    
    try {
      // Insert the new community
      const { data, error } = await supabase
        .from("community")
        .insert([communityData])
        .select()
        .single();
        
      if (error) throw error;
      
      // Add the creator as a member with 'admin' role
      await supabase
        .from("community_members")
        .insert({
          community_id: data.id,
          user_id: communityData.created_by,
          role: 'admin'
        });
      
      // Update local state
      set((state) => ({
        communities: [...state.communities, data],
        userCommunities: [...state.userCommunities, data],
        loading: false,
        error: null
      }));
      
      // Get creator's username for the notification
      const { data: userData } = await supabase
        .from("users")
        .select("username")
        .eq("id", communityData.created_by)
        .single();
      
      // Create a notification for the creator
      const { createNotification } = useNotificationStore.getState();
      await createNotification({
        user_id: communityData.created_by,
        content: `You created a new community: ${data.name}`,
        is_public: true,
        notification_type: 'community_created',
        related_id: `community:${data.id}`
      });
      
      return data;
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      return null;
    }
  },

  updateCommunity: async (id, updates) => {
    set({ loading: true, error: null });
    const supabase = createClient();
    
    try {
      // Get the original community data
      const { data: originalCommunity } = await supabase
        .from("community")
        .select("*")
        .eq("id", id)
        .single();
        
      if (!originalCommunity) throw new Error("Community not found");
      
      // Update the community
      const { data, error } = await supabase
        .from("community")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
        
      if (error) throw error;
      
      // Update local state
      set((state) => ({
        communities: state.communities.map((community) =>
          community.id === id ? { ...community, ...updates } : community
        ),
        userCommunities: state.userCommunities.map((community) =>
          community.id === id ? { ...community, ...updates } : community
        ),
        loading: false,
        error: null
      }));
      
      // Get community members to notify
      const { data: members } = await supabase
        .from("community_members")
        .select("user_id")
        .eq("community_id", id);
        
      if (members && members.length > 0) {
        const { createNotification } = useNotificationStore.getState();
        
        // Create a descriptive update message
        let updateMessage = `The community "${originalCommunity.name}" has been updated`;
        if (updates.name && updates.name !== originalCommunity.name) {
          updateMessage = `The community "${originalCommunity.name}" has been renamed to "${updates.name}"`;
        }
        
        // Notify all members about the community update
        for (const member of members) {
          await createNotification({
            user_id: member.user_id,
            content: updateMessage,
            is_public: false,
            notification_type: 'community_updated',
            related_id: `community:${id}`
          });
        }
      }
      
      return data;
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      return null;
    }
  },

  deleteCommunity: async (id) => {
    set({ loading: true, error: null });
    const supabase = createClient();
    
    try {
      // Get community data and members before deletion
      const { data: communityData } = await supabase
        .from("community")
        .select("name")
        .eq("id", id)
        .single();
        
      const { data: members } = await supabase
        .from("community_members")
        .select("user_id")
        .eq("community_id", id);
      
      // Delete the community
      const { error } = await supabase
        .from("community")
        .delete()
        .eq("id", id);
        
      if (error) throw error;
      
      // Update local state
      set((state) => ({
        communities: state.communities.filter((community) => community.id !== id),
        userCommunities: state.userCommunities.filter((community) => community.id !== id),
        loading: false,
        error: null
      }));
      
      // Notify members about the community deletion
      if (members && members.length > 0 && communityData) {
        const { createNotification } = useNotificationStore.getState();
        
        for (const member of members) {
          await createNotification({
            user_id: member.user_id,
            content: `The community "${communityData.name}" has been deleted`,
            is_public: false,
            notification_type: 'community_deleted',
          });
        }
      }
      
      return true;
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      return false;
    }
  },

  joinCommunity: async (communityId, userId) => {
    set({ loading: true, error: null });
    const supabase = createClient();
    
    try {
      // Check if already a member
      const { data: existingMember } = await supabase
        .from("community_members")
        .select("id")
        .eq("community_id", communityId)
        .eq("user_id", userId)
        .single();
        
      if (existingMember) {
        set({ loading: false });
        return true; // Already a member
      }
      
      // Get community data
      const { data: communityData } = await supabase
        .from("community")
        .select("name, created_by")
        .eq("id", communityId)
        .single();
        
      if (!communityData) throw new Error("Community not found");
      
      // Add user as a member
      const { error } = await supabase
        .from("community_members")
        .insert({
          community_id: communityId,
          user_id: userId,
          role: 'member'
        });
        
      if (error) throw error;
      
      // Refresh user communities
      await get().fetchUserCommunities(userId);
      
      // Get user data for notifications
      const { data: userData } = await supabase
        .from("users")
        .select("username")
        .eq("id", userId)
        .single();
        
      // Create notifications
      const { createNotification } = useNotificationStore.getState();
      
      // Notify the user who joined
      await createNotification({
        user_id: userId,
        content: `You joined the community "${communityData.name}"`,
        is_public: true,
        notification_type: 'community_joined',
        related_id: `community:${communityId}`
      });
      
      // Notify the community creator
      if (communityData.created_by !== userId) {
        await createNotification({
          user_id: communityData.created_by,
          content: `${userData?.username} joined your community "${communityData.name}"`,
          is_public: false,
          notification_type: 'community_member_joined',
          related_id: `community:${communityId}|user:${userId}`
        });
      }
      
      return true;
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      return false;
    }
  },

  leaveCommunity: async (communityId, userId) => {
    set({ loading: true, error: null });
    const supabase = createClient();
    
    try {
      // Get community data
      const { data: communityData } = await supabase
        .from("community")
        .select("name, created_by")
        .eq("id", communityId)
        .single();
        
      if (!communityData) throw new Error("Community not found");
      
      // Check if user is the creator
      if (communityData.created_by === userId) {
        throw new Error("Community creator cannot leave the community");
      }
      
      // Remove user from community
      const { error } = await supabase
        .from("community_members")
        .delete()
        .eq("community_id", communityId)
        .eq("user_id", userId);
        
      if (error) throw error;
      
      // Refresh user communities
      await get().fetchUserCommunities(userId);
      
      // Get user data for notifications
      const { data: userData } = await supabase
        .from("users")
        .select("username")
        .eq("id", userId)
        .single();
        
      // Create notifications
      const { createNotification } = useNotificationStore.getState();
      
      // Notify the user who left
      await createNotification({
        user_id: userId,
        content: `You left the community "${communityData.name}"`,
        is_public: false,
        notification_type: 'community_left',
        related_id: `community:${communityId}`
      });
      
      // Notify the community creator
      await createNotification({
        user_id: communityData.created_by,
        content: `${userData?.username} left your community "${communityData.name}"`,
        is_public: false,
        notification_type: 'community_member_left',
        related_id: `community:${communityId}|user:${userId}`
      });
      
      return true;
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      return false;
    }
  }
}));

export const useIsCommunityMember = (communityId: number) => {
  const { userCommunities } = useCommunityStore();
  return React.useMemo(() => userCommunities.some(community => community.id === communityId), [userCommunities, communityId]);
};