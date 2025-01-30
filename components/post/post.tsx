"use client";

import * as React from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  Heart,
  MessageSquare,
  Share,
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
import { useToast } from "@/hooks/use-toast";
import { PostType } from "@/types/custom"; // Import your PostType
import Link from "next/link";
import { IKImage, IKVideo } from "imagekitio-next";

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
  community
}: PostProps) {
  const { upvotePost, downvotePost } = usePostStore();
  const { toast } = useToast();
  const [isUpvoting, setIsUpvoting] = React.useState(false);
  const [isDownvoting, setIsDownvoting] = React.useState(false);

  const handleUpvote = async () => {
    try {
      setIsUpvoting(true);
      await upvotePost(id);
      toast({
        title: "Success",
        description: "Post upvoted successfully",
      });
    } catch (error) {
      console.error("Error upvoting post:", error);
      toast({
        title: "Error",
        description: "Failed to upvote post",
        variant: "destructive",
      });
    } finally {
      setIsUpvoting(false);
    }
  };

  const handleDownvote = async () => {
    try {
      setIsDownvoting(true);
      await downvotePost(id);
      toast({
        title: "Success",
        description: "Post downvoted successfully",
      });
    } catch (error) {
      console.error("Error downvoting post:", error);
      toast({
        title: "Error",
        description: "Failed to downvote post",
        variant: "destructive",
      });
    } finally {
      setIsDownvoting(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarImage src={author.profile_picture || undefined} />
            <AvatarFallback>
              {author.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg font-bold">{title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Posted by {author.username} 
              {community && (
                <> in <Link href={`/community/${roomId}`} className="hover:underline">{community.name}</Link></>
              )}
              • {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {type === "Image" && content && (
          <div className="relative aspect-video rounded-lg bg-muted/50 mb-4 overflow-hidden">
            <IKImage
              urlEndpoint={process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!}
              src={content}
              alt={`Post Image for ${title}`}
              fill
              className="object-cover rounded-lg"
            />
          </div>
        )}
        {type === "Link" && content && (
          <a
            href={content}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline break-all"
          >
            {content}
          </a>
        )}
        {type === "Text" && content && (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {content}
          </p>
        )}
        {type === "Video" && content && (
          <IKVideo
            urlEndpoint={process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!}
            controls
            className="w-full rounded-lg"
            src={content}
          >
            Your browser does not support the video tag.
          </IKVideo>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleUpvote}
            disabled={isUpvoting}
          >
            <ArrowUpIcon className={isUpvoting ? "animate-bounce" : ""} />
            {upvotes}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleDownvote}
            disabled={isDownvoting}
          >
            <ArrowDownIcon className={isDownvoting ? "animate-bounce" : ""} />
            {downvotes}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <MessageSquare className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Heart className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Share className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}