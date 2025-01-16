"use client"
import { create } from "zustand";
import { createClient } from "@/utils/supabase/client";

type ChannelType = 'text' | 'audio' | 'video';

// Database types that match Supabase schema
interface DbChannel {
  id: number;
  community_id: number;
  name: string;
  description: string | null;
  type: ChannelType;
  is_private: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: string;
  position: number | null;
  is_default: boolean | null;
}

// Application Channel type with required fields
interface Channel {
  id: number;
  community_id: number;
  name: string;
  description: string | null;
  type: ChannelType;
  is_private: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  position: number;
  is_default: boolean;
}

interface CreateChannelData {
  name: string;
  description?: string;
  type: ChannelType;
  is_private?: boolean;
  position?: number;
  is_default?: boolean;
}

interface UpdateChannelData {
  name?: string;
  description?: string;
  is_private?: boolean;
  position?: number;
  is_default?: boolean;
}

interface ChannelStore {
  channels: Channel[];
  currentChannel: Channel | null;
  isLoading: boolean;
  error: string | null;

  fetchChannels: (communityId: number) => Promise<void>;
  createChannel: (communityId: number, userId: string, data: CreateChannelData) => Promise<Channel | null>;
  updateChannel: (channelId: number, userId: string, data: UpdateChannelData) => Promise<Channel | null>;
  deleteChannel: (channelId: number, userId: string) => Promise<boolean>;
  setCurrentChannel: (channel: Channel | null) => void;
  reorderChannels: (channelId: number, newPosition: number) => Promise<boolean>;
  setError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  clearChannels: () => void;
}

// Helper function to convert DB channel to application Channel
const normalizeChannel = (dbChannel: DbChannel): Channel => ({
  ...dbChannel,
  is_private: dbChannel.is_private ?? false,
  created_at: dbChannel.created_at ?? new Date().toISOString(),
  updated_at: dbChannel.updated_at ?? new Date().toISOString(),
  position: dbChannel.position ?? 0,
  is_default: dbChannel.is_default ?? false,
});

export const useChannelStore = create<ChannelStore>((set, get) => ({
  channels: [],
  currentChannel: null,
  isLoading: false,
  error: null,

  setError: (error) => set({ error }),
  setLoading: (isLoading) => set({ isLoading }),
  clearChannels: () => set({ channels: [], currentChannel: null }),
  setCurrentChannel: (channel) => set({ currentChannel: channel }),

  fetchChannels: async (communityId) => {
    const supabase = createClient();
    set({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('community_channels')
        .select('*')
        .eq('community_id', communityId)
        .order('position');

      if (error) throw error;

      const normalizedChannels = (data as DbChannel[]).map(normalizeChannel);
      set({ channels: normalizedChannels });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch channels";
      set({ error: errorMessage });
    } finally {
      set({ isLoading: false });
    }
  },

  createChannel: async (communityId, userId, data) => {
    const supabase = createClient();
    set({ isLoading: true, error: null });

    try {
      let position = data.position;
      if (position === undefined) {
        const { data: channels } = await supabase
          .from('community_channels')
          .select('position')
          .eq('community_id', communityId)
          .order('position', { ascending: false })
          .limit(1);

        position = channels && channels.length > 0 ? (channels[0].position ?? 0) + 1 : 0;
      }

      const { data: newChannel, error } = await supabase
        .from('community_channels')
        .insert({
          community_id: communityId,
          created_by: userId,
          position,
          ...data,
        })
        .select()
        .single();

      if (error) throw error;

      const normalizedChannel = normalizeChannel(newChannel as DbChannel);
      set((state) => ({
        channels: [...state.channels, normalizedChannel],
      }));

      return normalizedChannel;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create channel";
      set({ error: errorMessage });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  updateChannel: async (channelId, userId, data) => {
    const supabase = createClient();
    set({ isLoading: true, error: null });

    try {
      const { data: updatedChannel, error } = await supabase
        .from('community_channels')
        .update(data)
        .eq('id', channelId)
        .select()
        .single();

      if (error) throw error;

      const normalizedChannel = normalizeChannel(updatedChannel as DbChannel);
      set((state) => ({
        channels: state.channels.map(channel =>
          channel.id === channelId ? normalizedChannel : channel
        ),
        currentChannel: state.currentChannel?.id === channelId 
          ? normalizedChannel 
          : state.currentChannel,
      }));

      return normalizedChannel;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update channel";
      set({ error: errorMessage });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteChannel: async (channelId, userId) => {
    const supabase = createClient();
    set({ isLoading: true, error: null });

    try {
      const { error } = await supabase
        .from('community_channels')
        .delete()
        .eq('id', channelId);

      if (error) throw error;

      set((state) => ({
        channels: state.channels.filter(channel => channel.id !== channelId),
        currentChannel: state.currentChannel?.id === channelId ? null : state.currentChannel,
      }));

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete channel";
      set({ error: errorMessage });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  reorderChannels: async (channelId, newPosition) => {
    const supabase = createClient();
    set({ isLoading: true, error: null });

    try {
      const { channels } = get();
      const oldChannel = channels.find(c => c.id === channelId);
      if (!oldChannel) throw new Error("Channel not found");

      const { error } = await supabase
        .from('community_channels')
        .update({ position: newPosition })
        .eq('id', channelId);

      if (error) throw error;

      const updatedChannels = [...channels]
        .map(channel => {
          if (channel.id === channelId) {
            return { ...channel, position: newPosition };
          }
          if (newPosition > oldChannel.position) {
            if (channel.position <= newPosition && channel.position > oldChannel.position) {
              return { ...channel, position: channel.position - 1 };
            }
          } else {
            if (channel.position >= newPosition && channel.position < oldChannel.position) {
              return { ...channel, position: channel.position + 1 };
            }
          }
          return channel;
        })
        .sort((a, b) => a.position - b.position);

      set({ channels: updatedChannels });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to reorder channels";
      set({ error: errorMessage });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
}));