"use client";

import { create } from 'zustand';
import { createClient } from "@/utils/supabase/client";
import { useNotificationStore } from './notification_store';

interface ChannelData {
    id: number;
    name: string;
    community_id: number;
    type: string;
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
    addChannel: (channel: Omit<ChannelData, 'id'>, creatorName?: string) => Promise<void>;
    updateChannel: (channelId: number, updates: Partial<ChannelData>, updaterName?: string) => Promise<void>;
    deleteChannel: (channelId: number, channelName?: string, deleterName?: string) => Promise<void>;
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

    addChannel: async (channel: Omit<ChannelData, 'id'>, creatorName = "A community admin") => {
        const supabase = createClient();

        try {
            // Ensure the required fields are present
            if (!channel.community_id || !channel.name || !channel.type) {
                throw new Error("Required fields: community_id, name, and type must be provided.");
            }

            // Perform the insert operation
            const { data, error } = await supabase
                .from("channels")
                .insert([channel])
                .select();

            if (error) throw error;

            set((state) => ({
                channels: [...state.channels, ...(data || [])],
                error: null,
            }));

            // Get community members to notify
            const { data: members } = await supabase
                .from("community_members")
                .select("user_id")
                .eq("community_id", channel.community_id);

            if (members && members.length > 0) {
                const { createNotification } = useNotificationStore.getState();
                
                // Notify all community members about the new channel
                for (const member of members) {
                    await createNotification({
                        user_id: member.user_id,
                        content: `${creatorName} created a new ${channel.type.toLowerCase()} channel: ${channel.name}`,
                        is_public: true,
                        notification_type: 'channel_created',
                        related_id: `channel:${data?.[0]?.id}`
                    });
                }
            }

        } catch (error) {
            set({ error: (error as Error).message });
        }
    },

    updateChannel: async (channelId, updates, updaterName = "A community admin") => {
        const supabase = createClient();

        try {
            // First get the original channel data and community_id
            const { data: originalChannel } = await supabase
                .from("channels")
                .select("*")
                .eq("id", channelId)
                .single();

            if (!originalChannel) {
                throw new Error("Channel not found");
            }

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

            // Get community members to notify
            const { data: members } = await supabase
                .from("community_members")
                .select("user_id")
                .eq("community_id", originalChannel.community_id);

            if (members && members.length > 0) {
                const { createNotification } = useNotificationStore.getState();
                
                // Create a descriptive update message
                let updateMessage = `${updaterName} updated the channel ${originalChannel.name}`;
                if (updates.name && updates.name !== originalChannel.name) {
                    updateMessage = `${updaterName} renamed the channel from ${originalChannel.name} to ${updates.name}`;
                }
                
                // Notify all community members about the channel update
                for (const member of members) {
                    await createNotification({
                        user_id: member.user_id,
                        content: updateMessage,
                        is_public: true,
                        notification_type: 'channel_updated',
                        related_id: `channel:${channelId}`
                    });
                }
            }

        } catch (error) {
            set({ error: (error as Error).message });
        }
    },

    deleteChannel: async (channelId, channelName = "a channel", deleterName = "A community admin") => {
        const supabase = createClient();

        try {
            // First get the channel data to have community_id
            const { data: channelData } = await supabase
                .from("channels")
                .select("community_id, name")
                .eq("id", channelId)
                .single();

            if (!channelData) {
                throw new Error("Channel not found");
            }

            const { error } = await supabase
                .from("channels")
                .delete()
                .eq("id", channelId);

            if (error) throw error;

            set((state) => ({
                channels: state.channels.filter((channel) => channel.id !== channelId),
                error: null,
            }));

            // Get community members to notify
            const { data: members } = await supabase
                .from("community_members")
                .select("user_id")
                .eq("community_id", channelData.community_id);

            if (members && members.length > 0) {
                const { createNotification } = useNotificationStore.getState();
                const channelNameToUse = channelName || channelData.name;
                
                // Notify all community members about the channel deletion
                for (const member of members) {
                    await createNotification({
                        user_id: member.user_id,
                        content: `${deleterName} deleted the channel "${channelNameToUse}"`,
                        is_public: true,
                        notification_type: 'channel_deleted',
                        related_id: `community:${channelData.community_id}`
                    });
                }
            }

        } catch (error) {
            set({ error: (error as Error).message });
        }
    },
}));