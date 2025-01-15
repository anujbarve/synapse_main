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
import { useCommunityStore } from "@/providers/communities_store";

export default function Page() {
  const { communities, loading, error, fetchCommunities } = useCommunityStore();

  useEffect(() => {
    fetchCommunities();
  }, [fetchCommunities]);

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
              />
            </div>
          ))}
        </div>
      </main>
    </>
  );
}