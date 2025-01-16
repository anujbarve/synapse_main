"use client";

import { useEffect } from "react";
import { useCommunityPresence } from "@/stores/user_online_store";
import { CommunityInfoCard } from "@/components/community-info-card";
import { Post } from "@/components/post";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { CommunityPresenceProvider } from "@/components/community-presence";
import { useSingleCommunityStore } from "@/stores/single_community_store";
import { useUserStore } from "@/stores/user_store";

interface User {
  id: string;
  username: string;
  profile_picture: string | null;
  role?: "admin" | "moderator" | "member";
}

export function CommunityContent({ communityId }: { communityId: string }) {
  const { user } = useUserStore();
  const { community, members, fetchCommunityData,setCurrentCommunity } = useSingleCommunityStore();
  const { onlineCount, totalMembers, onlineMembers } = useCommunityPresence(
    parseInt(communityId)
  );
  useEffect(() => {
    fetchCommunityData(communityId);
    setCurrentCommunity(parseInt(communityId));
  }, [communityId, fetchCommunityData]);


  const getRoleAsType = (role: string | null): "admin" | "moderator" | "member" | undefined => {
    switch (role) {
      case 'admin': return 'admin';
      case 'moderator': return 'moderator';
      case 'member': return 'member';
      default: return undefined;
    }
  };

  const membersAsUsers: User[] = members.map((member) => ({
    id: member.id,
    username: member.username,
    profile_picture: member.profile_picture,
    role: getRoleAsType(member.role),
  }));

  const membersWithStatus = membersAsUsers.map((member) => ({
    ...member,
    isOnline: !!onlineMembers[member.id],
  }));

  if (!community) {
    return <div>Loading...</div>;
  }

  let isMember = false;
  if(user){
    isMember = members.some(member => member.id === user.id);
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">Communities</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{community?.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <CommunityPresenceProvider communityId={community?.id} />
      <main className="grid w-full gap-4 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4 w-full">
          <div className="col-span-1 md:col-span-1 md:order-2 lg:col-span-3 md:sticky md:top-4">
            <CommunityInfoCard
              name={community?.name}
              description={community?.description}
              banner_picture={community?.banner_picture}
              created_at={community?.created_at}
              members={totalMembers.toString()}
              online_members={onlineCount.toString()}
              users={membersWithStatus}
              communityId={parseInt(communityId)}
              isMember={isMember}
            />
          </div>

          <div className="col-span-1 md:col-span-3 md:order-1 lg:col-span-5 space-y-4">
            {/* <div className="mb-4">
              <CreateCommunity />
            </div> */}

            <div className="space-y-4">
              <Post
                id={1}
                roomId={123}
                userId="anujb"
                title="Welcome to Synapse!"
                content="https://images.pexels.com/photos/27495274/pexels-photo-27495274/free-photo-of-aerial-view-of-the-ocean-and-a-beach.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                type="Image"
                upvotes={150}
                downvotes={20}
                createdAt="2025-01-13T10:00:00Z"
              />
              <Post
                id={2}
                roomId={123}
                userId="anujb"
                title="Welcome to Synapse!"
                content="Hello Guys on Synapse"
                type="Text"
                upvotes={150}
                downvotes={20}
                createdAt="2025-01-13T10:00:00Z"
              />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}