"use client"
import { DetailedPost } from "@/components/post/detailed-post";
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
import { useCommentStore } from "@/stores/comment_store";
import { usePostStore } from "@/stores/post_store";
import React, { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function PostPage({
  params,
}: {
  params: Promise<{ id: number }>;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const { currentPost, error, fetchPostById } = usePostStore();
  const { fetchComments } = useCommentStore();
  const [postId, setPostId] = useState<number | null>(null);

  useEffect(() => {
    async function getParams() {
      const resolvedParams = await params;
      setPostId(resolvedParams.id);
    }
    getParams();
  }, [params]);

  // Load post and comments once we have the ID
  useEffect(() => {
    async function loadPost() {
      if (!postId) return;
      
      try {
        setIsLoading(true);
        await Promise.all([
          fetchPostById(postId),
          fetchComments(postId)
        ]);
      } catch (error : unknown) {
        console.error('Error loading post and comments:', error);
        toast.error("Failed to load post and comments",);
      } finally {
        setIsLoading(false);
      }
    }

    loadPost();

    return () => {
      // Reset stores if needed
    };
  }, [postId, fetchPostById, fetchComments]);

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
      <Skeleton className="h-[300px] w-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );

  const ErrorDisplay = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center p-8">
      <h2 className="text-xl font-semibold text-red-500">Error</h2>
      <p className="text-gray-600">{message}</p>
    </div>
  );

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              {currentPost?.community && (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink href={`/c/${currentPost.community.name}`}>
                      {currentPost.community.name}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              )}
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {isLoading ? "Loading..." : currentPost?.title || "Post"}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <main className="p-4">
        <div className="container mx-auto max-w-7xl">
          {isLoading ? (
            <LoadingSkeleton />
          ) : error ? (
            <ErrorDisplay message={error} />
          ) : currentPost ? (
            <DetailedPost
              post={currentPost}
            />
          ) : (
            <ErrorDisplay message="Post not found" />
          )}
        </div>
      </main>
    </>
  );
}
