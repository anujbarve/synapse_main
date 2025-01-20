export interface Message {
    id: number;
    sender_id: string;
    community_id: number | null;
    receiver_id: string | null;
    content: string;
    message_type: 'Text' | 'Image' | 'File';
    file_url: string | null;
    sent_at: string | null;
    is_read: boolean;
  }
  
  export interface MessagesState {
    messages: Message[];
    loading: boolean;
    error: string | null;
  
    fetchCommunityMessages: (communityId: number) => Promise<void>;
    fetchDirectMessages: (senderId: string, receiverId: string) => Promise<void>;
    addMessage: (messageData: Omit<Message, 'id'>) => Promise<void>;
    subscribeToMessages: (channel: string) => () => void;
  }