import { create } from "zustand";
import { createClient } from "@/utils/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

// Message Type Definition
export type MessageType = "Text" | "Image" | "File";

// Base Message Interface
export interface Message {
  id: number;
  sender_id: string;
  community_id: number | null;
  channel_id: number | null;
  receiver_id: string | null;
  content: string;
  message_type: MessageType;
  file_url: string | null;
  sent_at: string;
  is_read: boolean;
}

// Message with Sender Details
export interface MessageWithSender extends Message {
  sender: {
    username: string;
    profile_picture: string | null;
  };
  community?: {
    name: string;
    banner_picture: string | null;
  };
}

// Pagination Interface
interface PaginationMeta {
  page: number;
  pageSize: number;
  totalCount: number;
  hasNextPage: boolean;
}

// Store Interface
interface MessageStore {
  // State
  messages: MessageWithSender[];
  currentMessage: MessageWithSender | null;
  loading: boolean;
  error: string | null;
  pagination: PaginationMeta;

  // Realtime Subscription
  messageSubscription: RealtimeChannel | null;

  // Actions
  fetchMessages: (params: {
    communityId?: number;
    channelId?: number;
    receiverId?: string;
    page?: number;
    pageSize?: number;
  }) => Promise<void>;

  sendMessage: (
    message: Omit<Message, "id" | "sent_at" | "is_read">
  ) => Promise<MessageWithSender>;
  updateMessage: (
    messageId: number,
    updates: Partial<Message>
  ) => Promise<MessageWithSender>;
  deleteMessage: (messageId: number) => Promise<void>;
  markMessageAsRead: (messageId: number) => Promise<void>;

  // Realtime Methods
  initializeRealtimeUpdates: (params?: {
    communityId?: number;
    channelId?: number;
    receiverId?: string;
  }) => () => void;

  // Utility Methods
  setCurrentMessage: (message: MessageWithSender | null) => void;
  clearMessages: () => void;
  resetPagination: () => void;
}

// Utility Functions
function isValidMessageType(type: any): type is MessageType {
  return ["Text", "Image", "File"].includes(type);
}

function safeMessageType(type: any): MessageType {
  return isValidMessageType(type) ? type : "Text";
}

export const useMessageStore = create<MessageStore>((set, get) => {
  const supabase = createClient();

  return {
    messages: [],
    currentMessage: null,
    loading: false,
    error: null,
    messageSubscription: null,
    pagination: {
      page: 1,
      pageSize: 20,
      totalCount: 0,
      hasNextPage: false,
    },

    // Fetch Messages with Advanced Filtering and Pagination
    fetchMessages: async ({
      communityId,
      channelId,
      receiverId,
      page = 1,
      pageSize = 20,
    }) => {
      set({ loading: true, error: null });

      try {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = supabase.from("messages").select(
          `
            *,
            sender:users!messages_sender_id_fkey (
              username,
              profile_picture
            ),
            community:community!messages_community_id_fkey (
              name,
              banner_picture
            )
          `,
          { count: "exact" }
        );

        if (communityId) query = query.eq("community_id", communityId);
        if (channelId) query = query.eq("channel_id", channelId);
        if (receiverId) query = query.eq("receiver_id", receiverId);

        query = query.order("sent_at", { ascending: false }).range(from, to);

        const { data, count, error } = await query;

        if (error) throw error;

        const messagesWithSender: MessageWithSender[] = (data || []).map(
          (message: any) => ({
            id: message.id,
            sender_id: message.sender_id,
            community_id: message.community_id,
            receiver_id: message.receiver_id,
            channel_id: message.channel_id,
            content: message.content,
            message_type: safeMessageType(message.message_type),
            file_url: message.file_url,
            sent_at: message.sent_at || new Date().toISOString(),
            is_read: message.is_read || false,
            sender: {
              username: message.sender.username,
              profile_picture: message.sender.profile_picture,
            },
            community: message.community
              ? {
                  name: message.community.name,
                  banner_picture: message.community.banner_picture,
                }
              : undefined,
          })
        );

        // Use a type-safe state update
        set(
          (state): Partial<MessageStore> => ({
            messages:
              page === 1
                ? messagesWithSender
                : [...state.messages, ...messagesWithSender],
            loading: false,
            pagination: {
              page,
              pageSize,
              totalCount: count || 0,
              hasNextPage: count ? count > page * pageSize : false,
            },
          })
        );

        get().initializeRealtimeUpdates({
          communityId,
          channelId,
          receiverId,
        });
      } catch (error) {
        console.error("Error fetching messages:", error);
        set(
          (state): Partial<MessageStore> => ({
            error: error instanceof Error ? error.message : "Unknown error",
            loading: false,
          })
        );
      }
    },

    // Send Message
    sendMessage: async (message) => {
      set({ loading: true, error: null });

      try {
        const { data, error } = await supabase
          .from("messages")
          .insert([message])
          .select(
            `
            *,
            sender:users!messages_sender_id_fkey (
              username,
              profile_picture
            ),
            community:community!messages_community_id_fkey (
              name,
              banner_picture
            )
          `
          )
          .single();

        if (error) throw error;

        const newMessage: MessageWithSender = {
          id: data.id,
          sender_id: data.sender_id,
          community_id: data.community_id,
          receiver_id: data.receiver_id,
          channel_id: data.channel_id,
          content: data.content,
          message_type: safeMessageType(data.message_type),
          file_url: data.file_url,
          sent_at: data.sent_at || new Date().toISOString(),
          is_read: false,
          sender: {
            username: data.sender.username,
            profile_picture: data.sender.profile_picture,
          },
          community: data.community
            ? {
                name: data.community.name,
                banner_picture: data.community.banner_picture,
              }
            : undefined,
        };

        // Prevent duplicate messages by checking if message already exists
        set((state) => {
          // Check if message already exists
          const existingMessage = state.messages.find(
            (m) =>
              m.content === newMessage.content &&
              m.sender_id === newMessage.sender_id &&
              m.sent_at === newMessage.sent_at
          );

          // Only add if not a duplicate
          if (!existingMessage) {
            return {
              messages: [newMessage, ...state.messages],
              loading: false,
            };
          }

          return { loading: false };
        });

        return newMessage;
      } catch (error) {
        console.error("Error sending message:", error);
        set({
          error: error instanceof Error ? error.message : "Unknown error",
          loading: false,
        });
        throw error;
      }
    },

    // Initialize Realtime Updates
    // Initialize Realtime Updates
    initializeRealtimeUpdates: () => {
      // Unsubscribe from previous subscription
      if (get().messageSubscription) {
        get().messageSubscription?.unsubscribe();
      }

      // Create new subscription
      const subscription = supabase
        .channel("messages_realtime")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "messages",
          },
          async (payload) => {
            console.log("Realtime payload:", payload);

            switch (payload.eventType) {
              case "INSERT":
                await handleInsert(payload.new);
                break;
              case "UPDATE":
                handleUpdate(payload.new);
                break;
              case "DELETE":
                handleDelete(payload.old.id);
                break;
            }
          }
        )
        .subscribe(async (status) => {
          console.log("Realtime subscription status:", status);
        });

      // Update store with new subscription
      set({ messageSubscription: subscription });

      // Handlers for different event types
      const handleInsert = async (newMessage: any) => {
        try {
          const { data } = await supabase
            .from("messages")
            .select(
              `
          *,
          sender:users!messages_sender_id_fkey (
            username,
            profile_picture
          ),
          community:community!messages_community_id_fkey (
            name,
            banner_picture
          )
        `
            )
            .eq("id", newMessage.id)
            .single();

          if (data) {
            const formattedMessage: MessageWithSender = {
              id: data.id,
              sender_id: data.sender_id,
              community_id: data.community_id,
              receiver_id: data.receiver_id,
              channel_id: data.channel_id,
              content: data.content,
              message_type: safeMessageType(data.message_type),
              file_url: data.file_url,
              sent_at: data.sent_at || new Date().toISOString(),
              is_read: data.is_read || false,
              sender: {
                username: data.sender.username,
                profile_picture: data.sender.profile_picture,
              },
              community: data.community
                ? {
                    name: data.community.name,
                    banner_picture: data.community.banner_picture,
                  }
                : undefined,
            };

            set((state) => {
              // Prevent duplicate messages
              const existingMessage = state.messages.find(
                (m) => m.id === formattedMessage.id
              );

              if (!existingMessage) {
                return {
                  messages: [formattedMessage, ...state.messages],
                };
              }

              return {};
            });
          }
        } catch (error) {
          console.error("Error handling real-time insert:", error);
        }
      };

      const handleUpdate = (updatedMessage: any) => {
        set((state) => ({
          messages: state.messages.map((message) =>
            message.id === updatedMessage.id
              ? { ...message, ...updatedMessage }
              : message
          ),
          currentMessage:
            state.currentMessage?.id === updatedMessage.id
              ? { ...state.currentMessage, ...updatedMessage }
              : state.currentMessage,
        }));
      };

      const handleDelete = (messageId: number) => {
        set((state) => ({
          messages: state.messages.filter(
            (message) => message.id !== messageId
          ),
          currentMessage:
            state.currentMessage?.id === messageId
              ? null
              : state.currentMessage,
        }));
      };

      // Return cleanup function
      return () => {
        subscription.unsubscribe();
        set({ messageSubscription: null });
      };
    },

    updateMessage: async (messageId, updates) => {
      set({ loading: true, error: null });

      try {
        const { data, error } = await supabase
          .from("messages")
          .update(updates)
          .eq("id", messageId)
          .select(
            `
            *,
            sender:users!messages_sender_id_fkey (
              username,
              profile_picture
            ),
            community:community!messages_community_id_fkey (
              name,
              banner_picture
            )
          `
          )
          .single();

        if (error) throw error;

        // Safely convert the message to MessageWithSender
        const updatedMessage: MessageWithSender = {
          id: data.id,
          sender_id: data.sender_id,
          community_id: data.community_id,
          receiver_id: data.receiver_id,
          channel_id: data.channel_id,
          content: data.content,
          message_type: safeMessageType(data.message_type),
          file_url: data.file_url,
          sent_at: data.sent_at || new Date().toISOString(),
          is_read: data.is_read || false,
          sender: {
            username: data.sender.username,
            profile_picture: data.sender.profile_picture,
          },
          community: data.community
            ? {
                name: data.community.name,
                banner_picture: data.community.banner_picture,
              }
            : undefined,
        };

        // Use a type-safe state update
        set(
          (state): Partial<MessageStore> => ({
            messages: state.messages.map((message) =>
              message.id === messageId ? updatedMessage : message
            ),
            loading: false,
          })
        );

        return updatedMessage;
      } catch (error) {
        console.error("Error updating message:", error);
        set(
          (state): Partial<MessageStore> => ({
            error: error instanceof Error ? error.message : "Unknown error",
            loading: false,
          })
        );
        throw error;
      }
    },

    deleteMessage: async (messageId) => {
      set({ loading: true, error: null });

      try {
        const { error } = await supabase
          .from("messages")
          .delete()
          .eq("id", messageId);

        if (error) throw error;

        set((state) => ({
          messages: state.messages.filter(
            (message) => message.id !== messageId
          ),
          loading: false,
        }));
      } catch (error) {
        console.error("Error deleting message:", error);
        set({
          error: error instanceof Error ? error.message : "Unknown error",
          loading: false,
        });
      }
    },

    markMessageAsRead: async (messageId) => {
      set({ loading: true, error: null });

      try {
        const { data, error } = await supabase
          .from("messages")
          .update({ is_read: true })
          .eq("id", messageId)
          .select()
          .single();

        if (error) throw error;

        set((state) => ({
          messages: state.messages.map((message) =>
            message.id === messageId ? { ...message, is_read: true } : message
          ),
          loading: false,
        }));
      } catch (error) {
        console.error("Error marking message as read:", error);
        set({
          error: error instanceof Error ? error.message : "Unknown error",
          loading: false,
        });
      }
    },

    // Utility Methods
    setCurrentMessage: (message) => set({ currentMessage: message }),

    clearMessages: () =>
      set({
        messages: [],
        pagination: {
          page: 1,
          pageSize: 20,
          totalCount: 0,
          hasNextPage: false,
        },
      }),

    resetPagination: () =>
      set({
        pagination: {
          page: 1,
          pageSize: 20,
          totalCount: 0,
          hasNextPage: false,
        },
      }),
  };
});
