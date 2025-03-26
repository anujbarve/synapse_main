import { ChatCard } from "@/components/ui/chat-card";


export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
})  {
  const communityId = parseInt((await params).id,10);
    return (
      <div className="flex flex-col h-[calc(100vh-20px)]">
        <main className="flex-1 min-h-0"> 
        <ChatCard communityId={communityId}/>
      </main>
      </div>
    );
  }