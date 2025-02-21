"use client";
import { PostWithAuthorAndVote } from "@/stores/post_store";
import { Button } from "@/components/ui/button";
import {
  MoreVertical,
  ArrowUpIcon,
  ArrowDownIcon
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PostTileProps {
  post: PostWithAuthorAndVote;
  onDeleteClick: () => void;
  isDeleting: boolean;
  isOwner : boolean;
}

export function PostTile({ post, onDeleteClick, isDeleting, isOwner }: PostTileProps) {
  return (
    <div className="bg-card rounded-lg border p-3 hover:shadow-sm transition-shadow flex items-center justify-between gap-4">
      {/* Left side - Post info */}
      <div className="flex-1 min-w-0">
        <Link href={`/post/${post.id}`}>
          <h3 className="font-medium text-base truncate hover:text-primary">
            {post.title}
          </h3>
        </Link>
        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
          <span>
            {formatDistanceToNow(new Date(post.created_at), {
              addSuffix: true,
            })}
          </span>
          <div className="flex items-center gap-1">
            <ArrowUpIcon className="h-4 w-4" />
            {post.upvotes}
          </div>
          <div className="flex items-center gap-1">
            <ArrowDownIcon className="h-4 w-4" />
            {post.downvotes}
          </div>
        </div>
      </div>

      {/* Right side - Actions menu */}

      <DropdownMenu>
        {isOwner && (
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={isDeleting}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
        )}
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/post/${post.id}/edit`}>Edit Post</Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive"
            onClick={onDeleteClick}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Post"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
