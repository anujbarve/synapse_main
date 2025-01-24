"use client";
import { ChatCard, Message } from "@/components/ui/chat-card";
import { useState } from "react";

const CURRENT_USER = {
  name: "You",
  avatar:
    "https://ferf1mheo22r9ira.public.blob.vercel-storage.com/avatar-04-uuYHWIRvVPi01gEt6NwnGyjqLeeZhz.png",
};

const INITIAL_MESSAGES: Message[] = [
  {
    id: "1",
    content: "Hey team! I've just pushed the latest design changes 🎨",
    sender: {
      name: "Alex Chen",
      avatar:
        "https://ferf1mheo22r9ira.public.blob.vercel-storage.com/avatar-01-n0x8HFv8EUetf9z6ht0wScJKoTHqf8.png",
      isOnline: true,
    },
    timestamp: "10:24 AM",
    status: "read",
    reactions: [
      { emoji: "👍", count: 2, reacted: true },
      { emoji: "🎉", count: 1, reacted: false },
    ],
  },
  {
    id: "2",
    content: "Looking great! The new color scheme is perfect",
    sender: {
      name: "Sarah Kim",
      avatar:
        "https://ferf1mheo22r9ira.public.blob.vercel-storage.com/avatar-02-albo9B0tWOSLXCVZh9rX9KFxXIVWMr.png",
      isOnline: true,
    },
    timestamp: "10:26 AM",
    status: "delivered",
  },
  {
    id: "3",
    content: "Thanks! I'll prepare the documentation now.",
    sender: {
      name: CURRENT_USER.name,
      avatar: CURRENT_USER.avatar,
      isOnline: true,
      isCurrentUser: true,
    },
    timestamp: "10:30 AM",
    status: "delivered",
  },
];

export default function Page() {
    const [chats] = useState([
      {
        id: 1,
        name: "Team Chat",
        membersCount: 3,
        onlineCount: 2,
        messages: INITIAL_MESSAGES,
      },
    ]);
  
    return (
      <div className="flex flex-col h-[calc(100vh-20px)]">
        
  
        <main className="flex-1 min-h-0"> 
        <ChatCard
          chatName={chats[0].name}
          membersCount={chats[0].membersCount}
          onlineCount={chats[0].onlineCount}
          initialMessages={chats[0].messages}
          currentUser={CURRENT_USER}
          onSendMessage={(message) => console.log("Sent:", message)}
          onReaction={(messageId, emoji) =>
            console.log("Reaction:", messageId, emoji)
          }
          onMoreClick={() => console.log("More clicked")}
          className="rounded-none border-none"
        />
      </main>
      </div>
    );
  }