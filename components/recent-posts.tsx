"use client";

import * as React from "react";
import {
  ActivityIcon,
  ArrowUpIcon,
  ChevronDownIcon,
  MessageSquareIcon,
  ClockIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecentPostsStore } from "@/stores/recent_posts_store";
import Link from "next/link";

export function RecentPosts() {
  const { posts, loading, error, hasMore, currentPage, fetchRecentPosts } =
    useRecentPostsStore();

  React.useEffect(() => {
    fetchRecentPosts(1);
    return () => {
      useRecentPostsStore.getState().resetPosts();
    };
  }, [fetchRecentPosts]);

  if (error) {
    return (
      <Card className="border-none shadow-none">
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            Error loading posts: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-none">
      <CardHeader className="px-0">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <ActivityIcon className="ml-5 h-5 w-5 text-primary" />
            <span>Recent Activity</span>
          </div>
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 mr-5">
            View All
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 space-y-4">
        {loading && posts.length === 0 ? (
          <LoadingSkeletons />
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="group relative rounded-lg hover:bg-muted/50 transition-colors p-4"
            >
              <div className="flex items-start gap-4">
                <Link href={`/account/${post.author.id}`}>
                  <Avatar className="h-10 w-10 ring-2 ring-primary/10 transition-all group-hover:ring-primary/20">
                    <AvatarImage
                      src={post.author.profile_picture || undefined}
                      alt={post.author.username}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-primary/5 text-primary">
                      {post.author.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <Link 
                      href={`/account/${post.author.id}`}
                      className="text-sm font-medium hover:text-primary"
                    >
                      {post.author.username}
                    </Link>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <ClockIcon className="mr-1 h-3 w-3" />
                      {formatDistanceToNow(new Date(post.created_at), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>

                  <Link 
                    href={`/post/${post.id}`}
                    className="block text-sm font-medium hover:text-primary"
                  >
                    {post.title}
                  </Link>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MessageSquareIcon className="h-3.5 w-3.5" />
                      <span>{post._count.comments} comments</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ArrowUpIcon className="h-3.5 w-3.5" />
                      <span>{post.upvotes} upvotes</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
      {!loading && hasMore && (
        <CardFooter className="px-0">
          <Button
            variant="ghost"
            className="w-full hover:bg-primary/5 hover:text-primary"
            onClick={() => !loading && hasMore && fetchRecentPosts(currentPage + 1)}
            disabled={loading}
          >
            {loading ? "Loading..." : "Show More"}
            <ChevronDownIcon className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

const LoadingSkeletons = () => (
  <>
    {Array(4).fill(0).map((_, index) => (
      <div key={index} className="flex items-start gap-4 p-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-4 w-full" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </div>
    ))}
  </>
);