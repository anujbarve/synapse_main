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
import Image from "next/image";

// Define the valid types of posts
type PostType = "Text" | "Link" | "Image";

// Define the prop types for the Post component
interface PostProps {
  id: number; // Primary key of the post
  roomId: number; // Foreign key for the room
  userId: string; // Foreign key for the user
  title: string; // Title of the post
  content: string | null; // Content of the post (can be null)
  type: PostType; // Type of the post (Text, Link, or Image)
  upvotes?: number; // Number of upvotes (default: 0)
  downvotes?: number; // Number of downvotes (default: 0)
  createdAt: string; // ISO timestamp for post creation
}

export function Post({
  roomId,
  userId,
  title,
  content = "",
  type = "Text",
  upvotes = 0,
  downvotes = 0
}: PostProps) {
  return (
    <Card className="w-full max-w-3xl mx-auto mb-4">
      <CardHeader>
        {/* Post Title */}
        <CardTitle className="text-lg font-bold">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">
          Posted in Room #{roomId} by User {userId} on{" "}
        </p>
      </CardHeader>

      <CardContent>
        {/* Dynamic Content Rendering */}
        {type === "Image" && content && (
          <div className="aspect-video rounded-lg bg-muted/50 mb-4">
            <Image
              width={1024}
              height={1024}
              src={content} // Image URL
              alt={`Post Image for ${title}`}
              className="rounded-lg"
            />
          </div>
        )}
        {type === "Link" && content && (
          <a
            href={content}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline"
          >
            {content}
          </a>
        )}
        {type === "Text" && content && (
          <p className="text-sm text-muted-foreground">{content}</p>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between">
        {/* Vote and Action Buttons */}
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <ArrowUpIcon />
            {upvotes}
          </Button>
          <Button variant="outline">
            <ArrowDownIcon />
            {downvotes}
          </Button>
        </div>

        {/* Interaction Buttons */}
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
