"use client";

import { useState } from "react";
import { Post } from "@/components/post/post";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PostWithAuthorAndVote } from "@/stores/post_store";

type SortOption = "latest" | "top" | "controversial";

interface PostFeedProps {
  // Posts loaded on the server, with the current user's vote already applied
  posts: PostWithAuthorAndVote[];
  error: string | null;
}

export function PostFeed({ posts, error }: PostFeedProps) {
  const [sortBy, setSortBy] = useState<SortOption>("latest");

  const sortedPosts = [...posts].sort((a, b) => {
    switch (sortBy) {
      case "latest":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "top":
        return b.upvotes - a.upvotes;
      case "controversial":
        const aRatio = a.downvotes / (a.upvotes || 1);
        const bRatio = b.downvotes / (b.upvotes || 1);
        return bRatio - aRatio;
      default:
        return 0;
    }
  });

  const renderPosts = () => {
    if (error) {
      return (
        <div className="text-center py-8 text-red-500">
          Error loading posts: {error}
        </div>
      );
    }

    if (!sortedPosts.length) {
      return (
        <div className="text-center py-8 text-gray-500">
          No posts available
        </div>
      );
    }

    return sortedPosts.map((post) => (
      <Post
        key={post.id}
        id={post.id}
        roomId={post.community_id}
        userId={post.user_id}
        title={post.title}
        content={post.content}
        type={post.type}
        upvotes={post.upvotes}
        downvotes={post.downvotes}
        userVote={post.userVote}
        createdAt={post.created_at}
        author={post.author}
        community={post.community}
      />
    ));
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">All Posts</h2>
        <Select
          value={sortBy}
          onValueChange={(value) => setSortBy(value as SortOption)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">Latest</SelectItem>
            <SelectItem value="top">Most Upvoted</SelectItem>
            <SelectItem value="controversial">Controversial</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">{renderPosts()}</div>
    </>
  );
}
