"use client";

import { useEffect, useState } from "react"; // Add useState
import { useCommunityPresence } from "@/stores/user_online_store";
import { CommunityInfoCard } from "@/components/community-info-card";
import { Post } from "@/components/post/post";
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
import { usePostStore } from "@/stores/post_store";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SortOption = "latest" | "top" | "controversial";

interface User {
  id: string;
  username: string;
  profile_picture: string | null;
  role?: "admin" | "moderator" | "member";
}

export function CommunityContent({ communityId }: { communityId: string }) {
  const [sortBy, setSortBy] = useState<SortOption>("latest");
  const { user } = useUserStore();
  const { community, members, fetchCommunityData, setCurrentCommunity } = useSingleCommunityStore();
  const { posts, loading: postsLoading, error: postsError, fetchPosts } = usePostStore();
  const { onlineCount, totalMembers, onlineMembers } = useCommunityPresence(
    parseInt(communityId)
  );

  useEffect(() => {
    fetchCommunityData(communityId);
    setCurrentCommunity(parseInt(communityId));
    fetchPosts(parseInt(communityId));
  }, [communityId, fetchCommunityData, setCurrentCommunity, fetchPosts]);

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

  const sortedPosts = [...posts].sort((a, b) => {
    switch (sortBy) {
      case "latest":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "top":
        return b.upvotes - a.upvotes;
      case "controversial":
        const aRatio = a.downvotes / (a.upvotes || 1);
        const bRatio = b.downvotes / (b.upvotes || 1);
        return bRatio - aRatio;
      default:
        return 0;
    }
  });

  if (!community) {
    return <div>Loading...</div>;
  }

  let isMember = false;
  if(user){
    isMember = members.some(member => member.id === user.id);
  }

  const renderPosts = () => {
    if (postsLoading) {
      return Array(3).fill(0).map((_, index) => (
        <Skeleton key={index} className="w-full h-[200px] rounded-lg" />
      ));
    }

    if (postsError) {
      return (
        <div className="text-center py-8 text-red-500">
          Error loading posts: {postsError}
        </div>
      );
    }

    if (!sortedPosts.length) {
      return (
        <div className="text-center py-8 text-gray-500">
          No posts in this community yet
        </div>
      );
    }

    return sortedPosts.map((post) => (
      <Post
        key={post.id}
        id={post.id}
        roomId={post.community_id}
        userId={post.user_id}
        title={post.title}
        content={post.content}
        type={post.type}
        upvotes={post.upvotes}
        downvotes={post.downvotes}
        createdAt={post.created_at}
        author={post.author}
      />
    ));
  };

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
            <div className="flex justify-end mb-4">
              <Select
                value={sortBy}
                onValueChange={(value) => setSortBy(value as SortOption)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Latest</SelectItem>
                  <SelectItem value="top">Most Upvoted</SelectItem>
                  <SelectItem value="controversial">Controversial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-4">
              {renderPosts()}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}