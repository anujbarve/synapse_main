"use client";

import { useEffect } from "react";
import { CommunityBanner } from "@/components/community-banner";
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
import { useCommunityStore } from "@/stores/communities_store";
import { useUserStore } from "@/stores/user_store";

export default function Page() {
  const { communities, loading, error, fetchCommunities, userCommunities, fetchUserCommunities } = useCommunityStore();
  const { user } = useUserStore();

  useEffect(() => {
    fetchCommunities();
  }, [fetchCommunities]);

  useEffect(() => {
    if (user?.id) {
      fetchUserCommunities(user.id);
    }
  }, [user?.id, fetchUserCommunities]);

  const isMemberOfCommunity = (communityId: number) => {
    return userCommunities.some(community => community.id === communityId);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
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
                <BreadcrumbPage>Explore Communities</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <main className="grid w-full gap-4 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 w-full">
          {communities.map((community) => (
            <div className="col-span-1" key={community.id}>
              <CommunityBanner
                id={community.id.toString()}
                title={community.name}
                description={community.description}
                banner_picture={community.banner_picture} 
                isMember={isMemberOfCommunity(community.id)}
              />
            </div>
          ))}
        </div>
      </main>
    </>
  );
}