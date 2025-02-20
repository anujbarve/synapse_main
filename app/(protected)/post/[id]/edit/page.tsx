"use client";
import { UpdatePostForm } from "@/components/post/edit-post";
import { usePostStore } from "@/stores/post_store";
import { useEffect, useState } from "react";

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
import { toast } from "sonner";

export default function PostPage({
    params,
  }: {
    params: Promise<{ id: number }>;
  }) {
    const [ isLoading, setIsLoading] = useState(true);
    const { currentPost, error, fetchPostById } = usePostStore();
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
          ]);
        } catch (error : unknown) {
          console.error('Error loading post', error);
          toast.error("Failed to load post and comments");
        } finally {
          setIsLoading(false);
        }
      }
  
      loadPost();
  
      return () => {
        // Reset stores if needed
      };
    }, [postId, fetchPostById]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-destructive">
        Error: {error}
      </div>
    );
  }

  if (!currentPost) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Post not found
      </div>
    );
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
                <BreadcrumbLink href="/dashboard">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              {currentPost.community && (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbLink href={`/community/${currentPost.community_id}`}>
                      {currentPost.community.name}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                </>
              )}
              <BreadcrumbItem>
                <BreadcrumbLink href={`/post/${currentPost.id}`}>
                  {currentPost.title}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Edit Post</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <main className="grid w-full gap-4 p-4">
        <UpdatePostForm 
          post={currentPost}
        />
      </main>
    </>
  );
}