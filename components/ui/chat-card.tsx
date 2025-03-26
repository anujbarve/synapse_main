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
import { useMessageStore } from "@/stores/messages_store";
import { useUserStore } from "@/stores/user_store";


interface ChatCardProps {
  communityId?: number;
  receiverId?: string;
  className?: string;
}

export function ChatCard({
  communityId,
  receiverId,
  className,
}: ChatCardProps) {

  const { user } = useUserStore();
  const [inputValue, setInputValue] = useState("");

  // Access store methods and state
  const { 
    messages, 
    fetchMessagesByCommunity, 
    fetchMessagesByReceiver, 
    sendMessage,
  } = useMessageStore();

  // Fetch messages based on community or receiver
  useEffect(() => {
    if (communityId) {
      fetchMessagesByCommunity(communityId);
    } else if (receiverId) {
      fetchMessagesByReceiver(receiverId);
    }
  }, [communityId, receiverId, fetchMessagesByCommunity, fetchMessagesByReceiver]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !user) return;

    try {
      await sendMessage({
        sender_id: user.id,
        content: inputValue,
        message_type: 'Text',
        community_id: communityId || null,
        receiver_id: receiverId || null,
        file_url: null
      });

      setInputValue("");
    } catch (error) {
      console.error("Failed to send message", error);
    }
  };

  if (!user) return null; // Prevent rendering if no user

  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b shrink-0">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-violet-500 flex items-center justify-center text-lg font-medium text-white">
              {communityId ? 'C' : 'M'}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2" />
          </div>
          <div>
            <h3 className="font-medium">
              {communityId ? 'Community Chat' : 'Direct Message'}
            </h3>
          </div>
        </div>
        <button
          type="button"
          className="p-2 rounded-full hover:bg-muted"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="flex items-start gap-3">
            <Image
              src={message.sender.profile_picture || '/default-avatar.png'}
              alt={message.sender.username}
              width={36}
              height={36}
              className="rounded-full"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">{message.sender.username}</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(message.sent_at).toLocaleTimeString()}
                </span>
              </div>
              <p className="break-words">{message.content}</p>
            </div>
            <div className="flex items-center self-end mb-1">
              {message.is_read ? (
                <CheckCheck className="w-4 h-4 text-blue-500" />
              ) : (
                <Check className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </div>
        ))}
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