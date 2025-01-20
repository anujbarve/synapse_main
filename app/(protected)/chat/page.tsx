"use client";
import { ChatCard } from "@/components/ui/chat-card";


export default function Page() {


  return (
    <div className="flex flex-col h-[calc(100vh-20px)]">
      <main className="flex-1 min-h-0">
        <ChatCard
          chatName="Team Chat"
          communityId={9} // for community messages
        />
      </main>
    </div>
  );
}
