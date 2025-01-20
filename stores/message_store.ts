 
  // stores/useMessagesStore.ts
  import { create } from "zustand";
  import { createClient } from "@/utils/supabase/client";
  import { Message, MessagesState } from "@/types/messages";
  
  const supabase = createClient();
  
  const useMessagesStore = create<MessagesState>((set, get) => ({
    messages: [],
    loading: false,
    error: null,
  
    fetchCommunityMessages: async (communityId: number) => {
      set({ loading: true, error: null });
      try {
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("community_id", communityId)
          .order("sent_at", { ascending: true });
  
        if (error) throw error;
        set({ messages: (data as Message[]) || [] });
      } catch (error: any) {
        set({ error: error.message });
      } finally {
        set({ loading: false });
      }
    },
  
    fetchDirectMessages: async (senderId: string, receiverId: string) => {
      set({ loading: true, error: null });
      try {
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .or(
            `and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`
          )
          .is("community_id", null)
          .order("sent_at", { ascending: true });
  
        if (error) throw error;
        set({ messages: (data as Message[]) || [] });
      } catch (error: any) {
        set({ error: error.message });
      } finally {
        set({ loading: false });
      }
    },
  
    addMessage: async (messageData: Omit<Message, "id">) => {
      try {
        const { data, error } = await supabase
          .from("messages")
          .insert([{
            sender_id: messageData.sender_id,
            community_id: messageData.community_id || null,
            receiver_id: messageData.receiver_id || null,
            content: messageData.content,
            message_type: messageData.message_type,
            file_url: messageData.file_url || null,
            sent_at: messageData.sent_at || new Date().toISOString(),
            is_read: messageData.is_read
          }])
          .select();
  
        if (error) throw error;
  
        if (data) {
          const newMessages = data as Message[];
          set((state) => ({
            messages: [...state.messages, ...newMessages]
          }));
        } else {
          throw new Error("No data returned from Supabase");
        }
      } catch (error: any) {
        set({ error: error.message });
        throw error;
      }
    },
  
    subscribeToMessages: (channel: string) => {
      const subscription = supabase
        .channel(channel)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "messages" },
          (payload) => {
            if (payload.eventType === "INSERT") {
              // Ensure the new message matches our Message type
              const newMessage = payload.new as Message;
              if (newMessage.message_type === 'Text' || 
                  newMessage.message_type === 'Image' || 
                  newMessage.message_type === 'File') {
                set((state) => ({
                  messages: [...state.messages, newMessage]
                }));
              }
            }
          }
        )
        .subscribe();
  
      return () => {
        supabase.removeChannel(subscription);
      };
    },
  }));
  
  export default useMessagesStore;