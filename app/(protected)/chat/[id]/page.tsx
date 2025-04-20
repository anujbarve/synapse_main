import { ChatCard } from "@/components/community/chat-card";


export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
})  {
  const receiver_id = (await params).id;
    return (
      <div className="flex flex-col h-[calc(100vh-20px)]">
        <main className="flex-1 min-h-0"> 
        <ChatCard receiverId={receiver_id}/>
      </main>
      </div>
    );
  }