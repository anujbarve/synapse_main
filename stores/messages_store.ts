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
  receiver_id: string | null; // Still needed for the DB schema
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
  // Community details are optional, especially for DMs
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

// --- Interface for Fetch Parameters ---
interface FetchMessagesParams {
    communityId?: number;
    channelId?: number;
    // Use userIds for Direct Messages (pair of user IDs)
    userIds?: [string, string];
    page?: number;
    pageSize?: number;
}

// Store Interface
interface MessageStore {
  // State
  messages: MessageWithSender[];
  currentMessage: MessageWithSender | null;
  loading: boolean;
  error: string | null;
  pagination: PaginationMeta;
  // Store the params used for the last fetch, useful for realtime context
  lastFetchParams: FetchMessagesParams | null;

  // Realtime Subscription
  messageSubscription: RealtimeChannel | null;

  // Actions
  fetchMessages: (params: FetchMessagesParams) => Promise<void>; // Updated params type

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
  initializeRealtimeUpdates: (params?: FetchMessagesParams) => () => void; // Updated params type

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

// Helper to check if a message belongs to the currently viewed context
const isMessageRelevant = (messageData: any, context?: FetchMessagesParams | null): boolean => {
    if (!context) return true; // If no context, assume relevant (or adjust as needed)

    if (context.userIds && context.userIds.length === 2) {
        // Direct Message Context
        const [user1, user2] = context.userIds;
        const sender = messageData.sender_id;
        const receiver = messageData.receiver_id;
        // Check if it's a DM (no community/channel) and involves the two users
        return !messageData.community_id && !messageData.channel_id &&
               ((sender === user1 && receiver === user2) || (sender === user2 && receiver === user1));
    } else if (context.communityId && context.channelId) {
        // Channel Context
        return messageData.community_id === context.communityId && messageData.channel_id === context.channelId;
    }
    // Fallback or other contexts - default to not relevant if specific context is set
    return false;
};


export const useMessageStore = create<MessageStore>((set, get) => {
  const supabase = createClient();

  return {
    messages: [],
    currentMessage: null,
    loading: false,
    error: null,
    messageSubscription: null,
    lastFetchParams: null, // Initialize fetch params tracker
    pagination: {
      page: 1,
      pageSize: 20,
      totalCount: 0,
      hasNextPage: false,
    },

    // --- Modified Fetch Messages ---
    fetchMessages: async ({
      communityId,
      channelId,
      userIds, // Use userIds for DMs
      page = 1,
      pageSize = 20,
    }) => {
      // Store the parameters used for this fetch
      set({ loading: true, error: null, lastFetchParams: { communityId, channelId, userIds, page, pageSize } });


      try {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = supabase.from("messages").select(
          `
            id, sender_id, community_id, channel_id, receiver_id, content, message_type, file_url, sent_at, is_read,
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

        // --- Filtering Logic ---
        if (userIds && userIds.length === 2) {
          // --- Direct Message Scenario ---
          const [user1, user2] = userIds;
          // Query for messages where (sender=user1 AND receiver=user2) OR (sender=user2 AND receiver=user1)
          // Also ensure it's a DM by checking community_id and channel_id are NULL
          query = query.or(
            `and(sender_id.eq.${user1},receiver_id.eq.${user2}),and(sender_id.eq.${user2},receiver_id.eq.${user1})`
          )
          .is('community_id', null) // Explicitly check for DM context
          .is('channel_id', null);

        } else if (communityId && channelId) {
          // --- Community/Channel Scenario ---
          query = query.eq("community_id", communityId);
          query = query.eq("channel_id", channelId);
          // Assuming DMs don't have community/channel IDs, this won't conflict.
        } else {
          // Handle invalid or incomplete parameters
          console.warn("fetchMessages called with invalid parameters. Provide valid userIds (for DMs) or both communityId & channelId.");
          set({ loading: false, error: "Invalid parameters for fetching messages.", messages: page === 1 ? [] : get().messages }); // Clear messages only on first page load with error
          return;
        }

        // Apply ordering and pagination AFTER filtering
        query = query.order("sent_at", { ascending: false }).range(from, to);

        const { data, count, error } = await query;

        if (error) throw error;

        // --- Map data (safe mapping, unchanged) ---
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
            sender: message.sender ? { // Check if sender exists (in case of DB inconsistency)
              username: message.sender.username,
              profile_picture: message.sender.profile_picture,
            } : { username: 'Unknown User', profile_picture: null }, // Fallback sender
            community: message.community
              ? {
                  name: message.community.name,
                  banner_picture: message.community.banner_picture,
                }
              : undefined,
          })
        );

        // --- Update State (unchanged logic, but uses current data) ---
        set(
          (state): Partial<MessageStore> => ({
            messages:
              page === 1
                ? messagesWithSender // Replace messages on first page
                : [...state.messages, ...messagesWithSender], // Append on subsequent pages
            loading: false,
            pagination: {
              page,
              pageSize,
              totalCount: count || 0,
              hasNextPage: count ? count > page * pageSize : false,
            },
          })
        );

        // Initialize or update realtime subscription based on the *current* context
        // Debounce or ensure this doesn't create excessive subscriptions if called rapidly
        get().initializeRealtimeUpdates({ communityId, channelId, userIds });

      } catch (error) {
        console.error("Error fetching messages:", error);
        set(
          (state): Partial<MessageStore> => ({
            error: error instanceof Error ? error.message : "Unknown error fetching messages",
            loading: false,
          })
        );
      }
    },

    // Send Message (no changes needed, assumes receiver_id is set correctly for DMs)
    sendMessage: async (message) => {
      // Ensure community_id and channel_id are null if it's a DM
      const messageToSend = {
          ...message,
          community_id: message.community_id ?? null,
          channel_id: message.channel_id ?? null,
          receiver_id: message.receiver_id ?? null,
      };

      set({ loading: true, error: null }); // Optimistic loading start

      try {
        const { data, error } = await supabase
          .from("messages")
          .insert([messageToSend]) // Use the potentially modified message
          .select(
             `
            id, sender_id, community_id, channel_id, receiver_id, content, message_type, file_url, sent_at, is_read,
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
          is_read: false, // New messages are unread
           sender: data.sender ? { // Check if sender exists
              username: data.sender.username,
              profile_picture: data.sender.profile_picture,
            } : { username: 'Unknown User', profile_picture: null }, // Fallback sender
          community: data.community
            ? {
                name: data.community.name,
                banner_picture: data.community.banner_picture,
              }
            : undefined,
        };

        // Add message immediately (Optimistic update handled by realtime, but this can be faster)
        // Check if relevant to current view before adding directly
        const currentParams = get().lastFetchParams;
        if (isMessageRelevant(newMessage, currentParams)) {
             set((state) => {
                // Prevent duplicate additions if realtime already handled it
                const exists = state.messages.some(m => m.id === newMessage.id);
                if (!exists) {
                    return {
                        messages: [newMessage, ...state.messages],
                        loading: false, // Set loading false here after successful insert AND state update
                         pagination: { // Increment total count
                            ...state.pagination,
                            totalCount: state.pagination.totalCount + 1,
                        }
                    };
                }
                return { loading: false }; // Already added, just stop loading
            });
        } else {
            set({ loading: false }); // Message sent but not relevant to current view
        }


        return newMessage;
      } catch (error) {
        console.error("Error sending message:", error);
        set({
          error: error instanceof Error ? error.message : "Unknown error sending message",
          loading: false,
        });
        throw error; // Re-throw error so the calling component knows it failed
      }
    },

    // --- Modified Initialize Realtime Updates ---
    initializeRealtimeUpdates: (params?: FetchMessagesParams) => {
      const currentSubscription = get().messageSubscription;
      const lastParams = get().lastFetchParams;

      // Basic check to avoid redundant subscriptions for the exact same context
      // Note: This is a simple check. Deep comparison might be needed for complex objects.
      if (currentSubscription && JSON.stringify(params) === JSON.stringify(lastParams)) {
        // console.log("Realtime subscription already active for this context.");
        // return () => {}; // Return a no-op cleanup
      }

      // Unsubscribe from previous subscription if it exists
      if (currentSubscription) {
        // console.log("Unsubscribing from previous realtime channel.");
        currentSubscription.unsubscribe();
        // set({ messageSubscription: null }); // Set null immediately
      }

       // Determine a unique channel name based on context for better scoping (Optional but Recommended)
       let channelName = "messages_realtime_public"; // Fallback public channel
       if (params?.userIds && params.userIds.length === 2) {
           // Create a consistent channel name for the DM pair by sorting IDs
           const sortedIds = [...params.userIds].sort();
           channelName = `dm-${sortedIds[0]}-${sortedIds[1]}`;
       } else if (params?.channelId) {
           channelName = `channel-${params.channelId}`;
       }

       console.log(`Subscribing to realtime channel: ${channelName}`);

      // Create new subscription
      const subscription = supabase
        .channel(channelName) // Use the context-specific channel name
        .on(
          "postgres_changes",
          {
            event: "*", // Listen for all changes (INSERT, UPDATE, DELETE)
            schema: "public",
            table: "messages",
            // Apply server-side filtering if possible and using a more generic channel.
            // Supabase Realtime RLS policies are the most robust way.
            // Simple filters here might have limitations with OR conditions needed for DMs.
            // filter: params?.channelId ? `channel_id=eq.${params.channelId}` : undefined
            // Filter for DMs via filter string is complex, relying on channelName or client-side check.
          },
          async (payload) => {
            console.log("Realtime payload received:", payload);
            const currentViewParams = get().lastFetchParams; // Get the context the user is currently viewing

            // --- Client-side relevance check is CRUCIAL ---
            // Especially if using a shared channel or if server filters are broad.
            const relevantData = payload.new || payload.old; // Use new for INSERT/UPDATE, old for DELETE check
            if (!relevantData || !isMessageRelevant(relevantData, currentViewParams)) {
                 console.log("Skipping irrelevant realtime message for context:", currentViewParams);
                 return; // Don't process if not relevant to the current view
            }

            switch (payload.eventType) {
              case "INSERT":
                await handleInsert(payload.new);
                break;
              case "UPDATE":
                // Ensure the update payload itself is validated or handled safely
                handleUpdate(payload.new);
                break;
              case "DELETE":
                 // payload.old might just contain primary keys depending on replica identity
                handleDelete(payload.old.id);
                break;
            }
          }
        )
        .subscribe(async (status, err) => {
          console.log(`Realtime channel ${channelName} status:`, status);
           if (err) {
                console.error(`Realtime subscription error on ${channelName}:`, err);
                // Optionally set an error state or attempt to resubscribe
                set({ error: `Realtime subscription failed: ${err.message}` });
            }
           if (status === 'SUBSCRIBED') {
                 // Connection successful
                 // Optionally trigger a fetch to ensure consistency after potential disconnect
                 // Be careful not to cause infinite loops
             }
             if (status === 'CLOSED') {
                 // Connection closed, maybe websocket was closed
             }
             if (status === 'CHANNEL_ERROR') {
                 console.error(`Realtime channel error for ${channelName}. Check RLS policies?`);
                 set({ error: `Realtime channel error. Permissions?` });
             }
        });

      // Update store with the new subscription
      set({ messageSubscription: subscription });

      // --- Realtime Event Handlers ---
      // These handlers now assume the message is relevant based on the check above

      const handleInsert = async (newMessageData: any) => {
        // Check if message already exists in the state (could happen due to race conditions)
         if (get().messages.some(m => m.id === newMessageData.id)) {
             console.log("Realtime INSERT skipped: Message already exists in state", newMessageData.id);
             return;
         }

        // The payload 'new' might not contain joined data (sender, community). Fetch it.
        try {
          const { data, error } = await supabase
            .from("messages")
            .select(
                `
                id, sender_id, community_id, channel_id, receiver_id, content, message_type, file_url, sent_at, is_read,
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
            .eq("id", newMessageData.id)
            .single();

          if (error) throw error;

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
                sender: data.sender ? {
                    username: data.sender.username,
                    profile_picture: data.sender.profile_picture,
                } : { username: 'Unknown User', profile_picture: null },
                community: data.community ? {
                    name: data.community.name,
                    banner_picture: data.community.banner_picture,
                } : undefined,
            };

            // Add the fully formed message to the beginning of the list
            set((state) => ({
              messages: [formattedMessage, ...state.messages],
               pagination: { // Increment total count
                    ...state.pagination,
                    totalCount: state.pagination.totalCount + 1,
                }
            }));
          }
        } catch (error) {
          console.error("Error fetching full message details on real-time insert:", error);
        }
      };

      const handleUpdate = (updatedMessageData: any) => {
          // Ensure the updated data includes necessary fields or merge carefully
         const updatedMessagePartial = {
             ...updatedMessageData,
             message_type: safeMessageType(updatedMessageData.message_type), // Ensure type safety
             // Add defaults for potentially missing fields if needed
             sent_at: updatedMessageData.sent_at || new Date().toISOString(),
             is_read: updatedMessageData.is_read ?? false,
         };

        set((state) => ({
          messages: state.messages.map((message) =>
            message.id === updatedMessagePartial.id
              ? { ...message, ...updatedMessagePartial } // Merge existing with new data
              : message
          ),
          // Also update currentMessage if it's the one being updated
          currentMessage:
            state.currentMessage?.id === updatedMessagePartial.id
              ? { ...state.currentMessage, ...updatedMessagePartial }
              : state.currentMessage,
        }));
      };

      const handleDelete = (messageId: number) => {
         // Check if the message exists before trying to filter/update count
         const messageExists = get().messages.some(msg => msg.id === messageId);

        set((state) => ({
          messages: state.messages.filter(
            (message) => message.id !== messageId
          ),
          currentMessage:
            state.currentMessage?.id === messageId
              ? null // Clear current message if it was deleted
              : state.currentMessage,
            pagination: messageExists ? { // Decrement count only if it existed
                ...state.pagination,
                totalCount: Math.max(0, state.pagination.totalCount - 1), // Prevent negative count
            } : state.pagination,
        }));
      };

      // Return cleanup function to be called on component unmount or context change
      return () => {
         console.log(`Unsubscribing from realtime channel: ${channelName}`);
        subscription.unsubscribe();
        set({ messageSubscription: null }); // Clear subscription from state
      };
    },

    // Update Message (no changes needed)
    updateMessage: async (messageId, updates) => {
       set({ loading: true, error: null });

       try {
         const { data, error } = await supabase
           .from("messages")
           .update(updates)
           .eq("id", messageId)
           .select(
               `
                id, sender_id, community_id, channel_id, receiver_id, content, message_type, file_url, sent_at, is_read,
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
             sender: data.sender ? {
                 username: data.sender.username,
                 profile_picture: data.sender.profile_picture,
             } : { username: 'Unknown User', profile_picture: null },
             community: data.community ? {
                 name: data.community.name,
                 banner_picture: data.community.banner_picture,
             } : undefined,
         };

         set(
           (state): Partial<MessageStore> => ({
             messages: state.messages.map((message) =>
               message.id === messageId ? updatedMessage : message // Replace with fully updated message
             ),
             loading: false,
              // Update currentMessage if it matches
             currentMessage: state.currentMessage?.id === messageId ? updatedMessage : state.currentMessage,
           })
         );

         return updatedMessage;
       } catch (error) {
         console.error("Error updating message:", error);
         set(
           (state): Partial<MessageStore> => ({
             error: error instanceof Error ? error.message : "Unknown error updating message",
             loading: false,
           })
         );
         throw error;
       }
    },

    // Delete Message (no changes needed)
    deleteMessage: async (messageId) => {
       // Optimistic delete (remove immediately) or wait for DB confirmation?
       // Let's keep it simple: update state after DB confirms. Realtime handles broadcast.
       set({ loading: true, error: null });

        try {
            const { error } = await supabase
                .from("messages")
                .delete()
                .eq("id", messageId);

            if (error) throw error;

            // Realtime DELETE handler should take care of removing it from state.
            // If realtime isn't guaranteed or fast enough, uncomment the state update here.
            /*
            set((state) => {
                 const messageExists = state.messages.some(msg => msg.id === messageId);
                 return {
                     messages: state.messages.filter(
                         (message) => message.id !== messageId
                     ),
                     loading: false,
                     currentMessage: state.currentMessage?.id === messageId ? null : state.currentMessage,
                     pagination: messageExists ? {
                        ...state.pagination,
                        totalCount: Math.max(0, state.pagination.totalCount - 1),
                     } : state.pagination,
                 };
            });
            */
           set({ loading: false }); // Set loading false after DB operation success

        } catch (error) {
            console.error("Error deleting message:", error);
            set({
                error: error instanceof Error ? error.message : "Unknown error deleting message",
                loading: false,
            });
             throw error; // Re-throw
        }
    },

    // Mark Message As Read (no changes needed)
    markMessageAsRead: async (messageId) => {
      // Avoid unnecessary updates if already read
      const message = get().messages.find(m => m.id === messageId);
      if (message?.is_read) {
        return; // Already marked as read
      }

      set({ loading: true, error: null }); // Can potentially skip loading state for this quick update

      try {
        const { error } = await supabase
          .from("messages")
          .update({ is_read: true })
          .eq("id", messageId)
          // No need to select data back if we update optimistically or rely on realtime update
          // .select()
          // .single();

        if (error) throw error;

         // Rely on realtime UPDATE handler, or update optimistically:
         set((state) => ({
             messages: state.messages.map((msg) =>
                 msg.id === messageId ? { ...msg, is_read: true } : msg
             ),
             loading: false,
             currentMessage: state.currentMessage?.id === messageId ? { ...state.currentMessage, is_read: true } : state.currentMessage,
         }));

      } catch (error) {
        console.error("Error marking message as read:", error);
        set({
          error: error instanceof Error ? error.message : "Unknown error marking message as read",
          loading: false,
        });
         // Don't throw error for this, maybe just log
      }
    },

    // --- Utility Methods (Unchanged) ---
    setCurrentMessage: (message) => set({ currentMessage: message }),

    clearMessages: () => {
      // Also unsubscribe from realtime when clearing messages
      get().messageSubscription?.unsubscribe();
      set({
        messages: [],
        currentMessage: null, // Clear current message as well
        pagination: {
          page: 1,
          pageSize: 20,
          totalCount: 0,
          hasNextPage: false,
        },
        lastFetchParams: null, // Clear last fetch params
        messageSubscription: null, // Clear subscription object
        error: null, // Clear any existing errors
      });
     },

    resetPagination: () =>
      set({
        pagination: {
          page: 1,
          pageSize: 20,
          totalCount: 0, // Keep totalCount? Usually reset on new fetch context
          hasNextPage: false,
        },
      }),
  };
});