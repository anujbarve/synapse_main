"use client";

import { useEffect, useState } from "react";
import { useCommunityPresence } from "@/stores/user_online_store";
import { CommunityInfoCard } from "@/components/community-info-card";
import { CreateCommunity } from "@/components/create-community";
import { Post } from "@/components/post";
import { createClient } from "@/utils/supabase/client";
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

interface User {
  id: string;
  username: string;
  profile_picture: string | null;
  role?: "admin" | "moderator" | "member";
}

interface CommunityMember {
  id: string;
  username: string;
  profile_picture: string | null;
  role: string | null;
  joined_at: string | null;
}

interface Community {
    id: number;
    name: string;
    description: string | null;
    banner_picture: string | null;
    created_at: string | null;
    created_by: string;
    is_private: boolean | null;
    updated_at: string | null;
}

export function CommunityContent({ communityId }: { communityId: string }) {
  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const { onlineCount, totalMembers, onlineMembers } = useCommunityPresence(
    parseInt(communityId)
  );

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      // Fetch community data
      const { data: communityData } = await supabase
        .from("community")
        .select()
        .eq("id", communityId)
        .single();

      setCommunity(communityData);

      // Fetch community members
      const { data: membersData } = await supabase
        .from("community_members")
        .select(`
          user_id,
          role,
          joined_at,
          users:user_id (
            id,
            username,
            profile_picture
          )
        `)
        .eq("community_id", communityId);

      if (membersData) {
        const formattedMembers: CommunityMember[] = membersData.map((member) => ({
          id: member.users.id,
          username: member.users.username,
          profile_picture: member.users.profile_picture,
          role: member.role,
          joined_at: member.joined_at || new Date().toISOString(),
        }));
        setMembers(formattedMembers);
      }
    }

    fetchData();
  }, [communityId]);

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
              ranking={""}
              users={membersWithStatus}
              communityId={parseInt(communityId)}
            />
          </div>

          <div className="col-span-1 md:col-span-3 md:order-1 lg:col-span-5 space-y-4">
            <div className="mb-4">
              <CreateCommunity />
            </div>

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