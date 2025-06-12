"use client";

import { useEffect, useState } from "react";
import { Post } from "@/components/post/post";
import { RecentPosts } from "@/components/recent-posts";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
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

export default function DashboardPage() {
  const [sortBy, setSortBy] = useState<SortOption>("latest");
  const { posts, loading, error, fetchAllPosts } = usePostStore();

  useEffect(() => {
    fetchAllPosts();
  }, [fetchAllPosts]);

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

  const renderPosts = () => {
    if (loading) {
      return Array(3).fill(0).map((_, index) => (
        <Skeleton key={index} className="w-full h-[200px] rounded-lg" />
      ));
    }

    if (error) {
      return (
        <div className="text-center py-8 text-red-500">
          Error loading posts: {error}
        </div>
      );
    }

    if (!sortedPosts.length) {
      return (
        <div className="text-center py-8 text-gray-500">
          No posts available
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
        community={post.community}
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
                <BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <main className="grid gap-4 p-4 w-full grid-cols-1 md:grid-cols-4 lg:grid-cols-8">
        <div className="col-span-1 md:col-span-3 lg:col-span-5 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">All Posts</h2>
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

        <div className="col-span-1 md:col-span-1 lg:col-span-3">
          {/* <div className="sticky top-4">
            <Tabs 
              defaultValue="recent" 
              className="w-full"
              onValueChange={(value) => setActiveTab(value as ActivityTab)}
              value={activeTab}
            >
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="recent" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recent
                </TabsTrigger>
                <TabsTrigger value="activity" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Activity
                </TabsTrigger>
              </TabsList>
              <TabsContent value="recent" className="mt-0"> */}
                <RecentPosts />
              {/* </TabsContent>
              <TabsContent value="activity" className="mt-0">
                <ActivityFeed />
              </TabsContent>
            </Tabs>
          </div> */}
        </div>
      </main>
    </>
  );
}