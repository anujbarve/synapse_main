"use client";

import { create } from 'zustand';
import { createClient } from "@/utils/supabase/client";

interface ChannelData {
    id: number; // Ensures 'id' is consistently a number
    name: string;
    community_id: number;
    type: string; // e.g., "Text" or "Voice"
    created_at?: string | null;
    updated_at?: string | null;
    description?: string | null;
}

interface ChannelStore {
    channels: ChannelData[];
    loading: boolean;
    error: string | null;
    initialized: boolean;
    fetchChannels: (communityId: string) => Promise<void>;
    addChannel: (channel: Omit<ChannelData, 'id'>) => Promise<void>;
    updateChannel: (channelId: number, updates: Partial<ChannelData>) => Promise<void>;
    deleteChannel: (channelId: number) => Promise<void>;
}

export const useChannelStore = create<ChannelStore>((set, get) => ({
    channels: [],
    loading: false,
    error: null,
    initialized: false,

    fetchChannels: async (communityId) => {
        if (get().loading || get().initialized) return;

        set({ loading: true, error: null });
        const supabase = createClient();

        try {
            const { data, error } = await supabase
                .from("channels")
                .select("*")
                .eq("community_id", communityId);

            if (error) throw error;
            console.log(data);

            set({ channels: data || [], error: null });
        } catch (error) {
            set({ error: (error as Error).message });
        } finally {
            set({ loading: false, initialized: true });
        }
    },

    addChannel: async (channel: Omit<ChannelData, 'id'>) => {
        const supabase = createClient();

        try {
            // Ensure the required fields are present
            if (!channel.community_id || !channel.name || !channel.type) {
                throw new Error("Required fields: community_id, name, and type must be provided.");
            }

            // Perform the insert operation
            const { data, error } = await supabase
                .from("channels")
                .insert([channel]) // Ensure it is passed as an array
                .select();

            if (error) throw error;

            set((state) => ({
                channels: [...state.channels, ...(data || [])],
                error: null,
            }));
        } catch (error) {
            set({ error: (error as Error).message });
        }
    },




    updateChannel: async (channelId, updates) => {
        const supabase = createClient();

        try {
            const { data, error } = await supabase
                .from("channels")
                .update(updates)
                .eq("id", channelId)
                .select();

            if (error) throw error;

            set((state) => ({
                channels: state.channels.map((channel) =>
                    channel.id === channelId ? { ...channel, ...updates, ...data?.[0] } : channel
                ),
                error: null,
            }));
        } catch (error) {
            set({ error: (error as Error).message });
        }
    },

    deleteChannel: async (channelId) => {
        const supabase = createClient();

        try {
            const { error } = await supabase
                .from("channels")
                .delete()
                .eq("id", channelId);

            if (error) throw error;

            set((state) => ({
                channels: state.channels.filter((channel) => channel.id !== channelId),
                error: null,
            }));
        } catch (error) {
            set({ error: (error as Error).message });
        }
    },
}));
