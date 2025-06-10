"use client";

import * as React from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  MessageSquare,
  Share2Icon,
  EyeIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { usePostStore } from "@/stores/post_store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { PostType } from "@/types/custom";
import Link from "next/link";
import { IKImage, IKVideo } from "imagekitio-next";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface PostProps {
  id: number;
  roomId: number;
  userId: string;
  title: string;
  content: string | null;
  type: PostType;
  upvotes: number;
  downvotes: number;
  createdAt: string;
  author: {
    id: string;
    username: string;
    profile_picture: string | null;
  };
  community?: {
    name: string;
    banner_picture: string | null;
  };
}

export function Post({
  id,
  roomId,
  title,
  content = "",
  type,
  upvotes = 0,
  downvotes = 0,
  createdAt,
  author,
  community,
}: PostProps) {
  const { votePost, removeVote, posts } = usePostStore();
  const [isVoting, setIsVoting] = React.useState(false);
  const [isMediaLoading, setIsMediaLoading] = React.useState(true);

  const currentPost = posts.find((p) => p.id === id);
  const userVote = currentPost?.userVote;
  const displayUpvotes = currentPost?.upvotes ?? upvotes;
  const displayDownvotes = currentPost?.downvotes ?? downvotes;
  const voteBalance = displayUpvotes - displayDownvotes;

  const handleVote = async (voteType: "upvote" | "downvote") => {
    try {
      setIsVoting(true);

      if (userVote === voteType) {
        await removeVote(id);
        toast.success("Your vote has been removed", {
          className: "bg-[#eff3fb] text-[#03050c] border-[#3e31d3]/20",
        });
      } else {
        await votePost(id, voteType);
        toast.success(`Post ${voteType}d successfully`, {
          className: "bg-[#eff3fb] text-[#03050c] border-[#3e31d3]/20",
        });
      }
    } catch (error) {
      console.error(`Error ${voteType}ing post:`, error);
      toast.error(`Failed to ${voteType} post`, {
        className: "bg-[#eff3fb] text-[#03050c] border-red-400/20",
      });
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto overflow-hidden border-[#b88ae0]/20 bg-white dark:bg-[#0a0c16] dark:border-[#3e31d3]/20 transition-all duration-200 hover:shadow-md hover:shadow-[#3e31d3]/5">
      {/* Top accent bar */}
      <div className="h-1 bg-gradient-to-r from-[#3e31d3] to-[#c062d5]" />
      
      <CardHeader className="px-5 pt-5 pb-3">
        <div className="flex items-start gap-3">
          <Link href={`/account/${author.id}`} className="flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3e31d3] rounded-full">
            <Avatar className="h-10 w-10 border-2 border-white dark:border-[#191c2a] shadow-sm">
              <AvatarImage src={author.profile_picture || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-[#3e31d3] to-[#c062d5] text-white font-medium">
                {author.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
          
          <div className="space-y-1 flex-1 min-w-0">
            <Link href={`/post/${id}`} className="group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3e31d3] rounded-sm">
              <CardTitle className="text-lg font-bold text-[#03050c] dark:text-white group-hover:text-[#3e31d3] transition-colors line-clamp-2">
                {title}
              </CardTitle>
            </Link>
            
            <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-[#03050c]/60 dark:text-white/60">
              <Link 
                href={`/account/${author.id}`}
                className="font-medium text-[#3e31d3] dark:text-[#b88ae0] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3e31d3] rounded-sm"
              >
                {author.username}
              </Link>
              
              {community && (
                <>
                  <span className="inline-block w-1 h-1 rounded-full bg-[#03050c]/40 dark:bg-white/40"></span>
                  <Link
                    href={`/community/${roomId}`}
                    className="px-2 py-0.5 bg-[#eff3fb] dark:bg-[#191c2a] rounded-full text-[#3e31d3] dark:text-[#b88ae0] font-medium hover:bg-[#3e31d3]/10 dark:hover:bg-[#3e31d3]/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3e31d3]"
                  >
                    {community.name}
                  </Link>
                </>
              )}
              
              <span className="inline-block w-1 h-1 rounded-full bg-[#03050c]/40 dark:bg-white/40"></span>
              <span className="inline-flex items-center">
                <EyeIcon className="w-3 h-3 mr-1 opacity-70" />
                {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-5 pt-2 pb-4">
        {type === "Image" && content && (
          <div className="relative aspect-video rounded-lg bg-[#eff3fb] dark:bg-[#191c2a] mb-3 overflow-hidden shadow-sm">
            {isMediaLoading && (
              <Skeleton className="absolute inset-0 bg-[#eff3fb] dark:bg-[#191c2a]" />
            )}
            <IKImage
              urlEndpoint={process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!}
              src={content}
              alt={`Post Image for ${title}`}
              fill
              className="object-cover rounded-lg"
              onLoad={() => setIsMediaLoading(false)}
            />
          </div>
        )}
        
        {type === "Link" && content && (
          <a
            href={content}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-3 mt-2 rounded-md bg-[#eff3fb] dark:bg-[#191c2a] text-[#3e31d3] hover:bg-[#3e31d3]/10 dark:hover:bg-[#3e31d3]/20 transition-colors w-full text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3e31d3]"
          >
            <Share2Icon className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="truncate">{content}</span>
          </a>
        )}
        
        {type === "Text" && content && (
          <div className="mt-2 text-[#03050c]/90 dark:text-white/90 text-sm whitespace-pre-wrap leading-relaxed line-clamp-6">
            {content}
          </div>
        )}
        
        {type === "Video" && content && (
          <div className="rounded-lg overflow-hidden mt-2 bg-[#eff3fb] dark:bg-[#191c2a] shadow-sm">
            {isMediaLoading && (
              <Skeleton className="w-full aspect-video bg-[#eff3fb] dark:bg-[#191c2a]" />
            )}
            <IKVideo
              urlEndpoint={process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!}
              controls
              className="w-full rounded-lg"
              src={content}
              onLoadedData={() => setIsMediaLoading(false)}
            >
              Your browser does not support the video tag.
            </IKVideo>
          </div>
        )}
      </CardContent>

      <CardFooter className="px-5 py-3 flex items-center justify-between border-t border-[#eff3fb] dark:border-[#191c2a]">
        <div className="flex items-center gap-2">
          <div className="flex rounded-full bg-[#eff3fb] dark:bg-[#191c2a] p-0.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote("upvote")}
              disabled={isVoting}
              className={cn(
                "h-8 px-3 rounded-l-full rounded-r-none border-r border-white/50 dark:border-black/20",
                "text-[#03050c]/70 dark:text-white/70 hover:text-[#3e31d3] hover:bg-[#3e31d3]/10",
                "focus-visible:ring-offset-0 focus-visible:ring-1 focus-visible:ring-[#3e31d3]",
                userVote === "upvote" && "bg-[#3e31d3]/10 text-[#3e31d3] font-medium"
              )}
            >
              <ArrowUpIcon className={cn("h-3.5 w-3.5 mr-1", isVoting && "animate-pulse")} />
              <span className="text-xs">{displayUpvotes}</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote("downvote")}
              disabled={isVoting}
              className={cn(
                "h-8 px-3 rounded-r-full rounded-l-none",
                "text-[#03050c]/70 dark:text-white/70 hover:text-[#c062d5] hover:bg-[#c062d5]/10",
                "focus-visible:ring-offset-0 focus-visible:ring-1 focus-visible:ring-[#c062d5]",
                userVote === "downvote" && "bg-[#c062d5]/10 text-[#c062d5] font-medium"
              )}
            >
              <ArrowDownIcon className={cn("h-3.5 w-3.5 mr-1", isVoting && "animate-pulse")} />
              <span className="text-xs">{displayDownvotes}</span>
            </Button>
          </div>
          
          <div className={cn(
            "text-xs font-medium rounded-full px-2 py-0.5",
            voteBalance > 0 ? "bg-[#3e31d3]/10 text-[#3e31d3]" : 
            voteBalance < 0 ? "bg-[#c062d5]/10 text-[#c062d5]" : 
            "bg-[#eff3fb] dark:bg-[#191c2a] text-[#03050c]/60 dark:text-white/60"
          )}>
            {voteBalance > 0 ? "+" : ""}{voteBalance}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Link href={`/post/${id}`}>
            <Button 
              variant="ghost" 
              size="sm"
              className="h-8 px-3 rounded-full text-[#03050c]/70 dark:text-white/70 hover:bg-[#eff3fb] dark:hover:bg-[#191c2a] hover:text-[#3e31d3] focus-visible:ring-offset-0 focus-visible:ring-1 focus-visible:ring-[#3e31d3]"
            >
              <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
              <span className="text-xs">Comments</span>
            </Button>
          </Link>
        
        </div>
      </CardFooter>
    </Card>
  );
}