"use client";

import * as React from "react";
import {
  ActivityIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChevronDownIcon,
  MessageSquareIcon,
  ClockIcon,
  TrendingUpIcon,
  RefreshCwIcon,
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
import { cn } from "@/lib/utils";

export function RecentPosts() {
  const { posts, loading, error, hasMore, currentPage, fetchRecentPosts } =
    useRecentPostsStore();
  const [animate, setAnimate] = React.useState(false);

  React.useEffect(() => {
    fetchRecentPosts(1);
    return () => {
      useRecentPostsStore.getState().resetPosts();
    };
  }, [fetchRecentPosts]);

  const loadMorePosts = React.useCallback(() => {
    if (!loading && hasMore) {
      setAnimate(true);
      fetchRecentPosts(currentPage + 1);
      setTimeout(() => setAnimate(false), 500);
    }
  }, [loading, hasMore, currentPage, fetchRecentPosts]);


  if (error) {
    return (
      <Card className="border-[#b88ae0]/20 dark:border-[#392cce]/20 bg-white dark:bg-[#080a14] shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-center flex-col gap-3 py-8">
            <div className="w-12 h-12 rounded-full bg-[#c062d5]/10 dark:bg-[#882a9d]/20 flex items-center justify-center">
              <ActivityIcon className="h-6 w-6 text-[#c062d5] dark:text-[#882a9d]" />
            </div>
            <div className="text-center text-[#c062d5] dark:text-[#882a9d] font-medium">
              Error loading posts
            </div>
            <p className="text-sm text-[#03050c]/70 dark:text-[#f3f5fc]/70 text-center max-w-xs">
              {error}
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchRecentPosts(1)}
              className="mt-2 border-[#b88ae0]/30 text-[#3e31d3] dark:text-[#392cce] hover:bg-[#3e31d3]/5 dark:hover:bg-[#392cce]/10"
            >
              <RefreshCwIcon className="h-3.5 w-3.5 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-[#b88ae0]/20 dark:border-[#392cce]/20 bg-white dark:bg-[#080a14] shadow-sm overflow-hidden">
      {/* Top accent bar */}
      <div className="h-1 bg-gradient-to-r from-[#3e31d3] to-[#c062d5] dark:from-[#392cce] dark:to-[#882a9d]" />
      
      <CardHeader className="px-5 pt-5 pb-3 border-b border-[#eff3fb] dark:border-[#040810]/60">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg font-semibold text-[#03050c] dark:text-[#f3f5fc]">
            <TrendingUpIcon className="h-5 w-5 text-[#3e31d3] dark:text-[#392cce]" />
            <span>Recent Activity</span>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0 divide-y divide-[#eff3fb] dark:divide-[#040810]/60">
        {loading && posts.length === 0 ? (
          <LoadingSkeletons />
        ) : posts.length === 0 ? (
          <div className="flex items-center justify-center flex-col gap-3 py-12">
            <div className="w-16 h-16 rounded-full bg-[#eff3fb] dark:bg-[#0a0c18] flex items-center justify-center">
              <ActivityIcon className="h-8 w-8 text-[#b88ae0] dark:text-[#4d1f75]" />
            </div>
            <p className="text-base font-medium text-[#03050c] dark:text-[#f3f5fc]">No recent activity</p>
            <p className="text-sm text-[#03050c]/60 dark:text-[#f3f5fc]/60">Check back later for updates</p>
          </div>
        ) : (
          <div>
            {posts.map((post, index) => (
              <div
                key={post.id}
                className={cn(
                  "relative hover:bg-[#eff3fb] dark:hover:bg-[#0a0c18] transition-colors",
                  animate && index >= posts.length - 5 && "animate-in fade-in-50 duration-300"
                )}
              >
                <div className="px-5 py-3.5 flex items-start gap-3">
                  {post.author && (
                    <div className="flex-shrink-0">
                      <Link href={`/account/${post.user_id}`}>
                        <Avatar className="h-10 w-10 border-2 border-white dark:border-[#080a14] hover:border-[#eff3fb] dark:hover:border-[#0a0c18] shadow-sm transition-all">
                          <AvatarImage
                            src={post.author.profile_picture || undefined}
                            alt={post.author.username}
                            className="object-cover"
                          />
                          <AvatarFallback className="bg-gradient-to-br from-[#3e31d3] to-[#c062d5] dark:from-[#392cce] dark:to-[#882a9d] text-white text-xs font-medium">
                            {post.author?.username?.[0]?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                    </div>
                  )}

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        {post.author && (
                          <Link 
                            href={`/account/${post.user_id}`}
                            className="text-sm font-medium text-[#03050c] dark:text-[#f3f5fc] hover:text-[#3e31d3] dark:hover:text-[#392cce] transition-colors"
                          >
                            {post.author.username}
                          </Link>
                        )}
                      
                      </div>
                      
                      <div className="flex items-center text-xs text-[#03050c]/60 dark:text-[#f3f5fc]/60">
                        <ClockIcon className="mr-1 h-3 w-3" />
                        {formatDistanceToNow(new Date(post.created_at), {
                          addSuffix: true,
                        })}
                      </div>
                    </div>

                    <Link href={`/post/${post.id}`} className="block">
                      <h3 className="text-sm font-medium text-[#03050c] dark:text-[#f3f5fc] hover:text-[#3e31d3] dark:hover:text-[#392cce] transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                    </Link>

                    <div className="flex items-center flex-wrap gap-x-3 gap-y-1.5 text-xs text-[#03050c]/60 dark:text-[#f3f5fc]/60 mt-1">
                      
                      {post._count && (
                        <div className="flex items-center gap-1">
                          <MessageSquareIcon className="h-3 w-3" />
                          <span>{post._count.comments}</span>
                        </div>
                      )}
                      
                      <div className={cn(
                        "flex items-center gap-1",
                        (post.upvotes - post.downvotes) > 0 ? "text-[#3e31d3]/70 dark:text-[#392cce]/70" :
                        (post.upvotes - post.downvotes) < 0 ? "text-[#c062d5]/70 dark:text-[#882a9d]/70" : ""
                      )}>
                        {(post.upvotes - post.downvotes) >= 0 ? (
                          <ArrowUpIcon className="h-3 w-3" />
                        ) : (
                          <ArrowDownIcon className="h-3 w-3" />
                        )}
                        <span>{Math.abs(post.upvotes - post.downvotes)}</span>
                      </div>
                    </div>
                    
                    {/* Post Action Link */}
                    <Link href={`/post/${post.id}`} className="absolute inset-0 z-10">
                      <span className="sr-only">View post {post.title}</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      {!loading && hasMore && (
        <CardFooter className="p-3 border-t border-[#eff3fb] dark:border-[#040810]/60">
          <Button
            variant="ghost"
            className="w-full h-10 rounded-md text-[#3e31d3] dark:text-[#392cce] hover:bg-[#eff3fb] dark:hover:bg-[#0a0c18] text-sm font-medium"
            onClick={loadMorePosts}
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-[#3e31d3]/30 dark:border-[#392cce]/30 border-t-[#3e31d3] dark:border-t-[#392cce] rounded-full animate-spin"></div>
                Loading...
              </div>
            ) : (
              <>
                Show More
                <ChevronDownIcon className="ml-1 h-4 w-4 transition-transform group-hover:translate-y-0.5" />
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

const LoadingSkeletons = () => (
  <div className="px-5 space-y-3 py-2">
    {Array(4).fill(0).map((_, index) => (
      <div key={index} className="flex items-start gap-3 animate-pulse">
        <Skeleton className="h-10 w-10 rounded-full bg-[#eff3fb] dark:bg-[#0a0c18]" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24 rounded-md bg-[#eff3fb] dark:bg-[#0a0c18]" />
            <Skeleton className="h-3 w-20 rounded-md bg-[#eff3fb] dark:bg-[#0a0c18]" />
          </div>
          <Skeleton className="h-4 w-full rounded-md bg-[#eff3fb] dark:bg-[#0a0c18]" />
          <Skeleton className="h-4 w-2/3 rounded-md bg-[#eff3fb] dark:bg-[#0a0c18]" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-3 w-16 rounded-md bg-[#eff3fb] dark:bg-[#0a0c18]" />
            <Skeleton className="h-3 w-12 rounded-md bg-[#eff3fb] dark:bg-[#0a0c18]" />
            <Skeleton className="h-3 w-12 rounded-md bg-[#eff3fb] dark:bg-[#0a0c18]" />
          </div>
        </div>
      </div>
    ))}
  </div>
);