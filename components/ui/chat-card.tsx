"use client";

import {
  SmilePlus,
  Check,
  CheckCheck,
  MoreHorizontal,
  Send,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Separator } from "@radix-ui/react-separator";
import { SidebarTrigger } from "./sidebar";
import useMessagesStore from "@/stores/message_store";
import { Message as StoreMessage } from "@/types/messages";
import { useUserStore } from "@/stores/user_store";

const DEFAULT_AVATAR = "/default-avatar.png";

interface UIMessage {
  id: string;
  content: string;
  sender: {
    name: string;
    avatar: string;
    isOnline: boolean;
    isCurrentUser?: boolean;
  };
  timestamp: string;
  status: "sent" | "delivered" | "read";
}

interface ChatCardProps {
  chatName?: string;
  membersCount?: number;
  onlineCount?: number;
  receiverId?: string;
  communityId?: number;
  onMoreClick?: () => void;
  className?: string;
}

export function ChatCard({
  chatName = "Team Chat",
  membersCount = 3,
  onlineCount = 2,
  receiverId,
  communityId,
  onMoreClick,
  className,
}: ChatCardProps) {
  // All hooks must be called before any conditional returns
  const [inputValue, setInputValue] = useState("");
  const {
    messages,
    loading,
    error,
    fetchCommunityMessages,
    fetchDirectMessages,
    addMessage,
    subscribeToMessages,
  } = useMessagesStore();

  const { user } = useUserStore();

  const convertToUIMessage = (message: StoreMessage): UIMessage => ({
    id: message.id.toString(),
    content: message.content,
    sender: {
      name: message.sender_id === user?.id ? user?.username : "Other User",
      avatar: message.sender_id === user?.id 
        ? (user?.profile_picture || DEFAULT_AVATAR)
        : DEFAULT_AVATAR,
      isOnline: true,
      isCurrentUser: message.sender_id === user?.id,
    },
    timestamp: message.sent_at 
      ? new Date(message.sent_at).toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      : "",
    status: message.is_read ? "read" : "delivered",
  });

  useEffect(() => {
    if (!user?.id) return;

    const fetchMessages = async () => {
      try {
        if (communityId) {
          await fetchCommunityMessages(communityId);
        } else if (receiverId) {
          await fetchDirectMessages(user.id, receiverId);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();

    const channel = communityId
      ? `community-${communityId}`
      : `dm-${user.id}-${receiverId}`;

    const unsubscribe = subscribeToMessages(channel);
    return () => unsubscribe();
  }, [
    communityId,
    receiverId,
    user?.id,
    fetchCommunityMessages,
    fetchDirectMessages,
    subscribeToMessages,
  ]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !user?.id) return;

    if (!communityId && !receiverId) {
      console.error("No valid communityId or receiverId provided");
      return;
    }

    try {
      const newMessage: Omit<StoreMessage, "id"> = {
        sender_id: user.id,
        receiver_id: receiverId || null,
        community_id: communityId || null,
        content: inputValue.trim(),
        message_type: "Text",
        file_url: null,
        sent_at: new Date().toISOString(),
        is_read: false,
      };

      await addMessage(newMessage);
      setInputValue("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  // Conditional renders after all hooks
  if (!user) {
    return (
      <div className="h-full flex items-center justify-center">
        <p>Please sign in to access messages</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center text-red-500">
        Error: {error}
      </div>
    );
  }

  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b shrink-0">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="relative">
            <div className="w-10 h-10 rounded-lg bg-violet-500 flex items-center justify-center text-lg font-medium text-white">
              {chatName.charAt(0)}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2" />
          </div>
          <div>
            <h3 className="font-medium">{chatName}</h3>
            <p className="text-sm text-muted-foreground">
              {membersCount} members • {onlineCount} online
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onMoreClick}
          className="p-2 rounded-full hover:bg-muted"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const uiMessage = convertToUIMessage(message);
          return (
            <div key={uiMessage.id} className="flex items-start gap-3">
              <Image
                src={uiMessage.sender.avatar}
                alt={uiMessage.sender.name}
                width={36}
                height={36}
                className="rounded-full"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.src = DEFAULT_AVATAR;
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{uiMessage.sender.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {uiMessage.timestamp}
                  </span>
                </div>
                <p className="break-words">{uiMessage.content}</p>
              </div>
              <div className="flex items-center self-end mb-1">
                {uiMessage.status === "read" && (
                  <div className="flex">
                    <CheckCheck className="w-4 h-4 text-blue-500" />
                  </div>
                )}
                {uiMessage.status === "delivered" && (
                  <Check className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="p-4 border-t shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Write a message..."
              className="w-full px-4 py-2.5 rounded-lg bg-muted focus:outline-none focus:ring-1"
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-muted/80"
            >
              <SmilePlus className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={handleSendMessage}
            className="p-2.5 rounded-lg transition-colors bg-muted hover:bg-muted/80"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}