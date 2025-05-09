import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import React from "react";
import { MediaRoom } from "@/components/livekit/mediaroom";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string,roomId: string }>;
}) {
  const communityId = (await params).id;
  const roomId = (await params).roomId; // Assuming roomId is part of the params

  console.log("Community ID:", communityId);
  console.log("Room ID:", roomId);


  return (
    <>
      {/* Header with Sidebar Trigger and Breadcrumb */}
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Video Conference</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      

      <div className="grid grid-cols-1 h-full w-full p-4 pt-0">
        {/* MediaRoom component - displays the video/audio room */}
        <div className="col-span-1 w-full rounded-xl">
          <MediaRoom chatId={roomId} communityId={communityId} video={false} audio={false} />
        </div>
      </div>
    </>
  );
}
