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
import Image from "next/image";

// Define the prop types for the DetailedPost component
type PostType = "Text" | "Link" | "Image";

interface DetailedPostProps {
  id: number; // Primary key of the post
  roomId: number; // Foreign key for the room
  userId: string; // Foreign key for the user
  title: string; // Title of the post
  content: string | null; // Content of the post (can be null)
  type: PostType | null; // Type of the post (Text, Link, or Image)
  upvotes?: number; // Number of upvotes (default: 0)
  downvotes?: number; // Number of downvotes (default: 0)
  createdAt: string; // ISO timestamp for post creation
  comments: Array<{ id: number; userId: string; content: string; createdAt: string }>; // Comments on the post
}

export function DetailedPost({
  roomId,
  userId,
  title,
  content = "",
  type = "Text",
  upvotes = 0,
  downvotes = 0,
  createdAt,
  comments,
}: DetailedPostProps) {
  return (
    <div className="w-full flex flex-col lg:flex-row gap-8 bg-white shadow-lg rounded-lg p-8">
      {/* Post Content Section */}
      <div className="flex-1">
        <div className="mb-4">
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-sm text-muted-foreground">
            Posted in Room #{roomId} by User {userId} on{" "}
            {new Date(createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="mb-6">
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
        </div>

        <div className="flex items-center justify-between">
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
        </div>
      </div>

      {/* Comments Section */}
      <div className="lg:w-1/3 bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-bold mb-4">Comments</h3>
        {comments.map((comment) => (
          <div key={comment.id} className="border-l-2 border-gray-300 pl-4 space-y-2 mb-4">
            <p className="font-medium">User {comment.userId}: {comment.content}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Button variant="outline" size="sm">
                <ArrowUpIcon className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <ArrowDownIcon className="h-4 w-4" />
              </Button>
              <span>{new Date(comment.createdAt).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
