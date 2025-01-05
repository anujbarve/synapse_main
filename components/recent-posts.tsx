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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"; // Change to your UI library's avatar

export function RecentPosts() {
  const posts = [
    {
      id: 1,
      avatar: "https://github.com/shadcn.png", // Example avatar URL
      username: "username123",
      content: "How to implement authentication in Next.js",
      timeAgo: "2h ago",
      comments: 24,
      upvotes: 156,
    },
    {
      id: 2,
      avatar: "https://github.com/shadcn.png",
      username: "techexpert",
      content: "10 VS Code extensions every developer should have",
      timeAgo: "5h ago",
      comments: 42,
      upvotes: 298,
    },
    {
      id: 3,
      avatar: "https://github.com/shadcn.png",
      username: "designpro",
      content: "What's your favorite UI component library?",
      timeAgo: "8h ago",
      comments: 86,
      upvotes: 175,
    },
    {
      id: 4,
      avatar: "https://github.com/shadcn.png",
      username: "newbie_coder",
      content: "Getting started with React - Complete beginner's guide",
      timeAgo: "12h ago",
      comments: 135,
      upvotes: 423,
    },
  ];

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
        {posts.map((post) => (
          <div key={post.id} className="flex flex-col items-center space-y-3">
            {/* Avatar */}
            <div className="relative w-12 h-12">
              <Avatar className="h-full w-full rounded-full ring-2 ring-muted">
                <AvatarImage
                  src={post.avatar}
                  alt={post.username}
                  className="rounded-full object-cover"
                />
                <AvatarFallback className="rounded-full bg-muted">
                  {post.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Post Content */}
            <div className="w-full text-center space-y-2">
              <div className="space-y-1">
                <p className="text-sm font-medium">{post.content}</p>
                <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
                  <span>{post.username}</span>
                  <span>•</span>
                  <span>{post.timeAgo}</span>
                </div>
              </div>

              {/* Engagement Metrics */}
              <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <MessageSquareIcon className="h-4 w-4" />
                  <span>{post.comments}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <ArrowUpIcon className="h-4 w-4" />
                  <span>{post.upvotes}</span>
                </div>
              </div>
            </div>

            {/* Divider */}
            {post.id !== posts.length && (
              <div className="w-full border-t border-muted mt-3" />
            )}
          </div>
        ))}
      </CardContent>
      <CardFooter>
        <Button variant="ghost" className="w-full text-muted-foreground">
          Load More
          <ChevronDownIcon className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}