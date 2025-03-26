import { create } from 'zustand';
import { createClient } from "@/utils/supabase/client";

// Message Type Definition
export type MessageType = 'Text' | 'Image' | 'File';

// Base Message Interface
export interface Message {
  id: number;
  sender_id: string;
  community_id: number | null;
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

// Type Guards and Utility Functions
function isValidMessageType(type: any): type is MessageType {
  return ['Text', 'Image', 'File'].includes(type);
}

function safeMessageType(type: any): MessageType {
  return isValidMessageType(type) ? type : 'Text';
}

// Store Interface
interface MessageStore {
  messages: MessageWithSender[];
  currentMessage: MessageWithSender | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchAllMessages: () => Promise<void>;
  fetchMessagesByCommunity: (communityId: number) => Promise<void>;
  fetchMessagesByReceiver: (receiverId: string) => Promise<void>;
  sendMessage: (message: Omit<Message, 'id' | 'sent_at' | 'is_read'>) => Promise<MessageWithSender>;
  updateMessage: (messageId: number, updates: Partial<Message>) => Promise<void>;
  deleteMessage: (messageId: number) => Promise<void>;
  markMessageAsRead: (messageId: number) => Promise<void>;
  setCurrentMessage: (message: MessageWithSender | null) => void;
}

// Zustand Store Creation
export const useMessageStore = create<MessageStore>((set, get) => ({
  messages: [],
  currentMessage: null,
  loading: false,
  error: null,

  // Fetch All Messages
  fetchAllMessages: async () => {
    const supabase = createClient();
    set({ loading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!messages_sender_id_fkey (
            username,
            profile_picture
          ),
          community:community!messages_community_id_fkey (
            name,
            banner_picture
          )
        `)
        .order('sent_at', { ascending: false });

      if (error) throw error;

      const messagesWithSender: MessageWithSender[] = data.map((message: any) => ({
        id: message.id,
        sender_id: message.sender_id,
        community_id: message.community_id,
        receiver_id: message.receiver_id,
        content: message.content,
        message_type: safeMessageType(message.message_type),
        file_url: message.file_url,
        sent_at: message.sent_at || new Date().toISOString(),
        is_read: message.is_read || false,
        sender: {
          username: message.sender.username,
          profile_picture: message.sender.profile_picture,
        },
        community: message.community ? {
          name: message.community.name,
          banner_picture: message.community.banner_picture,
        } : undefined
      } as MessageWithSender));

      set({ messages: messagesWithSender, loading: false });
    } catch (error) {
      console.error('Error fetching messages:', error);
      set({ error: (error as Error).message, loading: false });
    }
  },

  // Fetch Messages by Community
  fetchMessagesByCommunity: async (communityId: number) => {
    const supabase = createClient();
    set({ loading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!messages_sender_id_fkey (
            username,
            profile_picture
          ),
          community:community!messages_community_id_fkey (
            name,
            banner_picture
          )
        `)
        .eq('community_id', communityId)
        .order('sent_at', { ascending: false });

      if (error) throw error;

      const messagesWithSender: MessageWithSender[] = data.map((message: any) => ({
        id: message.id,
        sender_id: message.sender_id,
        community_id: message.community_id,
        receiver_id: message.receiver_id,
        content: message.content,
        message_type: safeMessageType(message.message_type),
        file_url: message.file_url,
        sent_at: message.sent_at || new Date().toISOString(),
        is_read: message.is_read || false,
        sender: {
          username: message.sender.username,
          profile_picture: message.sender.profile_picture,
        },
        community: {
          name: message.community.name,
          banner_picture: message.community.banner_picture,
        }
      } as MessageWithSender));

      set({ messages: messagesWithSender, loading: false });
    } catch (error) {
      console.error('Error fetching community messages:', error);
      set({ error: (error as Error).message, loading: false });
    }
  },

  // Fetch Messages by Receiver
  fetchMessagesByReceiver: async (receiverId: string) => {
    const supabase = createClient();
    set({ loading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!messages_sender_id_fkey (
            username,
            profile_picture
          ),
          community:community!messages_community_id_fkey (
            name,
            banner_picture
          )
        `)
        .eq('receiver_id', receiverId)
        .order('sent_at', { ascending: false });

      if (error) throw error;

      const messagesWithSender: MessageWithSender[] = data.map((message: any) => ({
        id: message.id,
        sender_id: message.sender_id,
        community_id: message.community_id,
        receiver_id: message.receiver_id,
        content: message.content,
        message_type: safeMessageType(message.message_type),
        file_url: message.file_url,
        sent_at: message.sent_at || new Date().toISOString(),
        is_read: message.is_read || false,
        sender: {
          username: message.sender.username,
          profile_picture: message.sender.profile_picture,
        },
        community: message.community ? {
          name: message.community.name,
          banner_picture: message.community.banner_picture,
        } : undefined
      } as MessageWithSender));

      set({ messages: messagesWithSender, loading: false });
    } catch (error) {
      console.error('Error fetching receiver messages:', error);
      set({ error: (error as Error).message, loading: false });
    }
  },

  // Send Message
  sendMessage: async (message) => {
    const supabase = createClient();
    set({ loading: true, error: null });

    try {
      // Ensure message type is valid
      const safeMessage = {
        ...message,
        message_type: safeMessageType(message.message_type)
      };

      const { data, error } = await supabase
        .from('messages')
        .insert([safeMessage])
        .select(`
          *,
          sender:users!messages_sender_id_fkey (
            username,
            profile_picture
          ),
          community:community!messages_community_id_fkey (
            name,
            banner_picture
          )
        `)
        .single();

      if (error) throw error;

      const newMessage: MessageWithSender = {
        id: data.id,
        sender_id: data.sender_id,
        community_id: data.community_id,
        receiver_id: data.receiver_id,
        content: data.content,
        message_type: safeMessageType(data.message_type),
        file_url: data.file_url,
        sent_at: data.sent_at || new Date().toISOString(),
        is_read: data.is_read || false,
        sender: {
          username: data.sender.username,
          profile_picture: data.sender.profile_picture,
        },
        community: data.community ? {
          name: data.community.name,
          banner_picture: data.community.banner_picture,
        } : undefined
      };

      set((state) => ({
        messages: [newMessage, ...state.messages],
        loading: false,
      }));

      return newMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  // Update Message
  updateMessage: async (messageId, updates) => {
    const supabase = createClient();
    set({ loading: true, error: null });

    try {
      // Ensure message type is valid if provided
      const safeUpdates = updates.message_type 
        ? { ...updates, message_type: safeMessageType(updates.message_type) }
        : updates;

      const { data, error } = await supabase
        .from('messages')
        .update(safeUpdates)
        .eq('id', messageId)
        .select(`
          *,
          sender:users!messages_sender_id_fkey (
            username,
            profile_picture
          ),
          community:community!messages_community_id_fkey (
            name,
            banner_picture
          )
        `)
        .single();

      if (error) throw error;

      const updatedMessage: MessageWithSender = {
        id: data.id,
        sender_id: data.sender_id,
        community_id: data.community_id,
        receiver_id: data.receiver_id,
        content: data.content,
        message_type: safeMessageType(data.message_type),
        file_url: data.file_url,
        sent_at: data.sent_at || new Date().toISOString(),
        is_read: data.is_read || false,
        sender: {
          username: data.sender.username,
          profile_picture: data.sender.profile_picture,
        },
        community: data.community ? {
          name: data.community.name,
          banner_picture: data.community.banner_picture,
        } : undefined
      };

      set((state) => ({
        messages: state.messages.map((message) =>
          message.id === messageId ? updatedMessage : message
        ),
        currentMessage: state.currentMessage?.id === messageId ? updatedMessage : state.currentMessage,
        loading: false,
      }));
    } catch (error) {
      console.error('Error updating message:', error);
      set({ error: (error as Error).message, loading: false });
    }
  },

  // Delete Message
  deleteMessage: async (messageId) => {
    const supabase = createClient();
    set({ loading: true, error: null });

    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      set((state) => ({
        messages: state.messages.filter((message) => message.id !== messageId),
        currentMessage: state.currentMessage?.id === messageId ? null : state.currentMessage,
        loading: false,
      }));
    } catch (error) {
      console.error('Error deleting message:', error);
      set({ error: (error as Error).message, loading: false });
    }
  },

  // Mark Message as Read
  markMessageAsRead: async (messageId) => {
    const supabase = createClient();
    set({ loading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId)
        .select(`
          *,
          sender:users!messages_sender_id_fkey (
            username,
            profile_picture
          ),
          community:community!messages_community_id_fkey (
            name,
            banner_picture
          )
        `)
        .single();

      if (error) throw error;

      const updatedMessage: MessageWithSender = {
        id: data.id,
        sender_id: data.sender_id,
        community_id: data.community_id,
        receiver_id: data.receiver_id,
        content: data.content,
        message_type: safeMessageType(data.message_type),
        file_url: data.file_url,
        sent_at: data.sent_at || new Date().toISOString(),
        is_read: true,
        sender: {
          username: data.sender.username,
          profile_picture: data.sender.profile_picture,
        },
        community: data.community ? {
          name: data.community.name,
          banner_picture: data.community.banner_picture,
        } : undefined
      };

      set((state) => ({
        messages: state.messages.map((message) =>
          message.id === messageId ? updatedMessage : message
        ),
        currentMessage: state.currentMessage?.id === messageId ? updatedMessage : state.currentMessage,
        loading: false,
      }));
    } catch (error) {
      console.error('Error marking message as read:', error);
      set({ error: (error as Error).message, loading: false });
    }
  },

  // Set Current Message
  setCurrentMessage: (message) => set({ currentMessage: message }),
}));

