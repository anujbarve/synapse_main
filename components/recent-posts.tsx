"use client";

import * as React from "react";
import {
  ActivityIcon,
  ArrowUpIcon,
  ChevronDownIcon,
  MessageSquareIcon,
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

    // Cleanup function
    return () => {
      useRecentPostsStore.getState().resetPosts();
    };
  }, [fetchRecentPosts]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchRecentPosts(currentPage + 1);
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            Error loading posts: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ActivityIcon className="h-5 w-5 text-muted-foreground" />
            <span>Recent Activity</span>
          </div>
          <Button variant="ghost" size="sm">
            View All
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading && posts.length === 0
          ? // Loading skeletons
            Array(4)
              .fill(0)
              .map((_, index) => (
                <div key={index} className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                  {index !== 3 && <Skeleton className="h-[1px] w-full" />}
                </div>
              ))
          : posts.map((post, index) => (
              <div
                key={post.id}
                className="flex flex-col items-center space-y-3"
              >
                <div className="relative w-12 h-12">
                  <Avatar className="h-full w-full rounded-full ring-2 ring-muted">
                    <AvatarImage
                      src={post.author.profile_picture || undefined}
                      alt={post.author.username}
                      className="rounded-full object-cover"
                    />
                    <AvatarFallback className="rounded-full bg-muted">
                      {post.author.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="w-full text-center space-y-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      <Link 
                        href={`/post/${post.id}`}
                        className="hover:underline"
                        >{post.title}
                      </Link>
                    </p>
                    <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
                      <span>
                        <Link
                          href={`/account/${post.author.id}`}
                          className="hover:underline"
                        >
                          {post.author.username}
                        </Link>
                      </span>
                      <span>•</span>
                      <span>
                        {formatDistanceToNow(new Date(post.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <MessageSquareIcon className="h-4 w-4" />
                      <span>{post._count.comments}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <ArrowUpIcon className="h-4 w-4" />
                      <span>{post.upvotes}</span>
                    </div>
                  </div>
                </div>

                {index !== posts.length - 1 && (
                  <div className="w-full border-t border-muted mt-3" />
                )}
              </div>
            ))}
      </CardContent>
      {!loading && hasMore && (
        <CardFooter>
          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={handleLoadMore}
            disabled={loading}
          >
            {loading ? "Loading..." : "Load More"}
            <ChevronDownIcon className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
