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
import { useState } from "react";
import { Separator } from "@radix-ui/react-separator";
import { SidebarTrigger } from "./sidebar";

export interface Message {
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
  reactions?: Array<{
    emoji: string;
    count: number;
    reacted: boolean;
  }>;
}

interface ChatCardProps {
  chatName?: string;
  membersCount?: number;
  onlineCount?: number;
  initialMessages?: Message[];
  currentUser?: {
    name: string;
    avatar: string;
  };
  onSendMessage?: (message: string) => void;
  onReaction?: (messageId: string, emoji: string) => void;
  onMoreClick?: () => void;
  className?: string;
}

export function ChatCard({
  chatName = "Team Chat",
  membersCount = 3,
  onlineCount = 2,
  initialMessages = [],
  currentUser = {
    name: "You",
    avatar:
      "https://ferf1mheo22r9ira.public.blob.vercel-storage.com/avatar-03-n0x8HFv8EUetf9z6ht0wScJKoTHqf8.png",
  },
  onSendMessage,
  onReaction,
  onMoreClick,
  className,
}: ChatCardProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: {
        name: currentUser.name,
        avatar: currentUser.avatar,
        isOnline: true,
        isCurrentUser: true,
      },
      timestamp: new Date().toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
      status: "sent",
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputValue("");
    onSendMessage?.(inputValue);

    // Имитация получения статуса сообщения
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === newMessage.id ? { ...msg, status: "delivered" } : msg
        )
      );
    }, 1000);

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === newMessage.id ? { ...msg, status: "read" } : msg
        )
      );
    }, 2000);
  };

  const handleReaction = (messageId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((message) => {
        if (message.id === messageId) {
          const existingReaction = message.reactions?.find(
            (r) => r.emoji === emoji
          );
          const newReactions = message.reactions || [];

          if (existingReaction) {
            return {
              ...message,
              reactions: newReactions.map((r) =>
                r.emoji === emoji
                  ? {
                      ...r,
                      count: r.reacted ? r.count - 1 : r.count + 1,
                      reacted: !r.reacted,
                    }
                  : r
              ),
            };
          } else {
            return {
              ...message,
              reactions: [...newReactions, { emoji, count: 1, reacted: true }],
            };
          }
        }
        return message;
      })
    );
    onReaction?.(messageId, emoji);
  };

  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b shrink-0">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-violet-500 flex items-center justify-center text-lg font-medium text-white">
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
        {messages.map((message) => (
          <div key={message.id} className="flex items-start gap-3">
            <Image
              src={message.sender.avatar}
              alt={message.sender.name}
              width={36}
              height={36}
              className="rounded-full"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">{message.sender.name}</span>
                <span className="text-sm text-muted-foreground">
                  {message.timestamp}
                </span>
              </div>
              <p className="break-words">{message.content}</p>
              {message.reactions && message.reactions.length > 0 && (
                <div className="flex items-center gap-1 mt-2">
                  {message.reactions.map((reaction) => (
                    <button
                      key={reaction.emoji}
                      onClick={() => handleReaction(message.id, reaction.emoji)}
                      className={cn(
                        "px-2 py-1 rounded-lg text-sm flex items-center gap-1",
                        reaction.reacted
                          ? "bg-violet-500/20 text-violet-400"
                          : "bg-muted hover:bg-muted/80"
                      )}
                    >
                      <span>{reaction.emoji}</span>
                      <span>{reaction.count}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center self-end mb-1">
              {message.status === "read" && (
                <div className="flex">
                  <CheckCheck className="w-4 h-4 text-blue-500" />
                </div>
              )}
              {message.status === "delivered" && (
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
