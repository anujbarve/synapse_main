"use client";

import * as React from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  Edit,
  MessageSquare,
  MoreVertical,
  Trash2,
  Share2Icon,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { PostWithAuthorAndVote, usePostStore } from "@/stores/post_store";
import { IKImage, IKVideo } from "imagekitio-next";
import {
  CommentWithAuthorAndVote,
  useCommentStore,
} from "@/stores/comment_store";
import { useUserStore } from "@/stores/user_store";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "../ui/alert-dialog";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

// Create Context for Comment Functions
interface CommentContextType {
  handleVoteComment: (
    commentId: number,
    voteType: "upvote" | "downvote"
  ) => Promise<void>;
  handleSubmitReply: (
    parentCommentId: number,
    content: string
  ) => Promise<void>;
  handleUpdateComment: (commentId: number, content: string) => Promise<void>;
  handleDeleteComment: (commentId: number) => Promise<void>;
  currentUserId: string | null;
  handleTimestampClick: (seconds: number) => void;
  isVideoPost: boolean;
}

const CommentContext = React.createContext<CommentContextType>({
  handleVoteComment: async () => {},
  handleSubmitReply: async () => {},
  handleUpdateComment: async () => {},
  handleDeleteComment: async () => {},
  currentUserId: null,
  handleTimestampClick: () => {},
  isVideoPost: false,
});

// Reply Input Component
const ReplyInput = React.memo(
  ({
    onSubmit,
    onCancel,
  }: {
    onSubmit: (content: string) => Promise<void>;
    onCancel: () => void;
  }) => {
    const [content, setContent] = React.useState("");
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    React.useEffect(() => {
      textareaRef.current?.focus();
    }, []);

    const handleSubmit = async () => {
      if (!content.trim()) return;

      try {
        setIsSubmitting(true);
        await onSubmit(content);
        setContent("");
      } catch (error) {
        console.error("Failed to submit reply:", error);
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="ml-8 mt-4">
        <Textarea
          ref={textareaRef}
          placeholder="Write a reply..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[100px] mb-2 bg-white dark:bg-[#0a0c16] border-[#b88ae0]/20 focus:border-[#3e31d3] focus:ring-[#3e31d3]"
        />
        <div className="flex justify-end gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onCancel}
            className="border-[#b88ae0]/30 text-[#03050c]/70 dark:text-white/70 hover:bg-[#eff3fb] dark:hover:bg-[#191c2a] hover:text-[#3e31d3]"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting || !content.trim()}
            className="bg-[#3e31d3] hover:bg-[#3e31d3]/90 text-white"
          >
            {isSubmitting ? "Posting..." : "Reply"}
          </Button>
        </div>
      </div>
    );
  }
);

ReplyInput.displayName = "ReplyInput";

// Comment Component
const CommentComponent = React.memo(
  ({ comment }: { comment: CommentWithAuthorAndVote }) => {
    const [isReplying, setIsReplying] = React.useState(false);
    const [isEditing, setIsEditing] = React.useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
    const [editContent, setEditContent] = React.useState(comment.content);
    const {
      handleVoteComment,
      handleSubmitReply,
      handleUpdateComment,
      handleDeleteComment,
      currentUserId,
      handleTimestampClick,
      isVideoPost
    } = React.useContext(CommentContext);

    const isCommentOwner = currentUserId === comment.user_id;
    const voteBalance = comment.upvotes - comment.downvotes;

    const handleEdit = async () => {
      try {
        await handleUpdateComment(comment.id, editContent);
        setIsEditing(false);
      } catch (error) {
        console.error("Failed to update comment:", error);
        toast.error("Failed to update comment");
      }
    };

    return (
      <div className="mb-4 group animate-in fade-in duration-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7 border-2 border-white dark:border-[#191c2a] shadow-sm">
              <AvatarImage src={comment.author.profile_picture || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-[#3e31d3] to-[#c062d5] text-white text-xs font-medium">
                {comment.author.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Link 
              href={`/account/${comment.user_id}`}
              className="text-sm font-medium text-[#03050c] dark:text-white hover:text-[#3e31d3] dark:hover:text-[#b88ae0] transition-colors"
            >
              {comment.author.username}
            </Link>
            <div className="flex items-center">
              <span className="inline-block w-1 h-1 rounded-full bg-[#03050c]/30 dark:bg-white/30 mx-1.5"></span>
              <span className="text-xs text-[#03050c]/60 dark:text-white/60 flex items-center">
                <Clock className="h-3 w-3 mr-1 opacity-70" />
                {formatDistanceToNow(new Date(comment.created_at!), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>

          {isCommentOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 rounded-full text-[#03050c]/60 dark:text-white/60 hover:bg-[#eff3fb] dark:hover:bg-[#191c2a] opacity-0 group-hover:opacity-100 transition-opacity focus-visible:opacity-100"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[160px] border-[#b88ae0]/20">
                <DropdownMenuItem 
                  onClick={() => setIsEditing(true)}
                  className="text-[#03050c] dark:text-white hover:text-[#3e31d3] dark:hover:text-[#3e31d3] cursor-pointer"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-[#c062d5] hover:text-[#c062d5]/80 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-2 pl-9">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[100px] resize-none bg-white dark:bg-[#0a0c16] border-[#b88ae0]/20 focus:border-[#3e31d3] focus:ring-[#3e31d3]"
              placeholder="Edit your comment..."
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(comment.content);
                }}
                className="border-[#b88ae0]/30 text-[#03050c]/70 dark:text-white/70 hover:bg-[#eff3fb] dark:hover:bg-[#191c2a] hover:text-[#3e31d3]"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleEdit}
                disabled={
                  !editContent.trim() || editContent === comment.content
                }
                className="bg-[#3e31d3] hover:bg-[#3e31d3]/90 text-white"
              >
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div className="pl-9 text-sm text-[#03050c]/90 dark:text-white/90 whitespace-pre-wrap leading-relaxed">
            {parseAndRenderTimestamps(
              comment.content,
              isVideoPost,
              handleTimestampClick
            )}
          </div>
        )}

        <div className="flex items-center gap-3 mt-2 pl-9">
          <div className="flex rounded-full bg-[#eff3fb] dark:bg-[#191c2a] p-0.5 h-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVoteComment(comment.id, "upvote")}
              className={cn(
                "h-7 px-2 rounded-l-full rounded-r-none border-r border-white/50 dark:border-black/20",
                "text-[#03050c]/70 dark:text-white/70 hover:text-[#3e31d3] hover:bg-[#3e31d3]/10",
                "focus-visible:ring-offset-0 focus-visible:ring-1 focus-visible:ring-[#3e31d3]",
                comment.userVote === "upvote" && "bg-[#3e31d3]/10 text-[#3e31d3] font-medium"
              )}
            >
              <ArrowUpIcon className="h-3.5 w-3.5" />
            </Button>
            
            <div className={cn(
              "inline-flex items-center justify-center min-w-[32px] text-xs font-medium",
              voteBalance > 0 ? "text-[#3e31d3]" : 
              voteBalance < 0 ? "text-[#c062d5]" : 
              "text-[#03050c]/60 dark:text-white/60"
            )}>
              {voteBalance}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVoteComment(comment.id, "downvote")}
              className={cn(
                "h-7 px-2 rounded-r-full rounded-l-none border-l border-white/50 dark:border-black/20",
                "text-[#03050c]/70 dark:text-white/70 hover:text-[#c062d5] hover:bg-[#c062d5]/10",
                "focus-visible:ring-offset-0 focus-visible:ring-1 focus-visible:ring-[#c062d5]",
                comment.userVote === "downvote" && "bg-[#c062d5]/10 text-[#c062d5] font-medium"
              )}
            >
              <ArrowDownIcon className="h-3.5 w-3.5" />
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsReplying(!isReplying)}
            className="h-8 px-3 rounded-full text-[#03050c]/70 dark:text-white/70 hover:bg-[#eff3fb] dark:hover:bg-[#191c2a] hover:text-[#3e31d3]"
          >
            <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
            <span className="text-xs">Reply</span>
          </Button>
        </div>

        {isReplying && (
          <div className="mt-3 pl-6 border-l-2 border-[#b88ae0]/20 dark:border-[#3e31d3]/20">
            <ReplyInput
              onSubmit={async (content) => {
                await handleSubmitReply(comment.id, content);
                setIsReplying(false);
              }}
              onCancel={() => setIsReplying(false)}
            />
          </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 pl-6 border-l-2 border-[#b88ae0]/20 dark:border-[#3e31d3]/20 space-y-4">
            {comment.replies.map((reply) => (
              <CommentComponent key={reply.id} comment={reply} />
            ))}
          </div>
        )}

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="sm:max-w-[425px] bg-white dark:bg-[#0a0c16] border-[#b88ae0]/20">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-[#03050c] dark:text-white">Delete Comment</AlertDialogTitle>
              <AlertDialogDescription className="text-[#03050c]/70 dark:text-white/70">
                Are you sure you want to delete this comment? This action cannot
                be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel 
                onClick={() => setShowDeleteDialog(false)}
                className="border-[#b88ae0]/30 text-[#03050c]/70 dark:text-white/70 hover:bg-[#eff3fb] dark:hover:bg-[#191c2a] hover:text-[#3e31d3]"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  try {
                    await handleDeleteComment(comment.id);
                    setShowDeleteDialog(false);
                    toast.success("Comment deleted successfully", {
                      className: "bg-[#eff3fb] text-[#03050c] border-[#3e31d3]/20",
                    });
                  } catch (error) {
                    console.error("Failed to delete comment:", error);
                    toast.error("Failed to delete comment", {
                      className: "bg-[#eff3fb] text-[#03050c] border-red-400/20",
                    });
                  }
                }}
                className="bg-[#c062d5] hover:bg-[#c062d5]/90 text-white"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }
);

CommentComponent.displayName = "CommentComponent";

export function DetailedPost({ post }: { post: PostWithAuthorAndVote }) {
  const { user } = useUserStore();
  const [newComment, setNewComment] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isMediaLoading, setIsMediaLoading] = React.useState(true);
  const { votePost, removeVote, currentPost, fetchPostById } = usePostStore();
  const {
    comments,
    createComment,
    voteComment,
    removeCommentVote,
    fetchComments,
    updateComment,
    deleteComment,
  } = useCommentStore();

  // Fetch post and comments data
  React.useEffect(() => {
    fetchPostById(post.id);
    fetchComments(post.id);
  }, [post.id, fetchPostById, fetchComments]);

  const handleUpdateComment = React.useCallback(
    async (commentId: number, content: string) => {
      try {
        await updateComment(commentId, content);
        toast.success("Comment updated successfully", {
          className: "bg-[#eff3fb] text-[#03050c] border-[#3e31d3]/20",
        });
      } catch (error) {
        console.error("Failed to update comment:", error);
        toast.error("Failed to update comment", {
          className: "bg-[#eff3fb] text-[#03050c] border-red-400/20",
        });
      }
    },
    [updateComment]
  );

  const handleDeleteComment = React.useCallback(
    async (commentId: number) => {
      try {
        await deleteComment(commentId);
        toast.success("Comment deleted successfully", {
          className: "bg-[#eff3fb] text-[#03050c] border-[#3e31d3]/20",
        });
      } catch (error) {
        console.error("Failed to delete comment:", error);
        toast.error("Failed to delete comment", {
          className: "bg-[#eff3fb] text-[#03050c] border-red-400/20",
        });
      }
    },
    [deleteComment]
  );

  const handleVotePost = async (voteType: "upvote" | "downvote") => {
    try {
      if (currentPost?.userVote === voteType) {
        await removeVote(post.id);
      } else {
        await votePost(post.id, voteType);
      }
    } catch (error) {
      console.error("Failed to vote on post:", error);
      toast.error("Failed to vote on post", {
        className: "bg-[#eff3fb] text-[#03050c] border-red-400/20",
      });
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    if (user == null) return;
    try {
      setIsSubmitting(true);
      await createComment({
        post_id: post.id,
        user_id: user.id,
        content: newComment,
        parent_id: null,
      });
      setNewComment("");
      toast.success("Your comment has been posted successfully", {
        className: "bg-[#eff3fb] text-[#03050c] border-[#3e31d3]/20",
      });
    } catch (error) {
      console.error("Failed to post comment:", error);
      toast.error("Failed to post comment", {
        className: "bg-[#eff3fb] text-[#03050c] border-red-400/20",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoteComment = React.useCallback(
    async (commentId: number, voteType: "upvote" | "downvote") => {
      try {
        const comment = comments.find((c) => c.id === commentId);
        if (comment?.userVote === voteType) {
          await removeCommentVote(commentId);
        } else {
          await voteComment(commentId, voteType);
        }
      } catch (error) {
        console.log("Failed to vote on comment:", error);
        toast.error("Failed to vote on comment", {
          className: "bg-[#eff3fb] text-[#03050c] border-red-400/20",
        });
      }
    },
    [comments, removeCommentVote, voteComment]
  );

  const handleSubmitReply = React.useCallback(
    async (parentCommentId: number, content: string) => {
      if (!user) return;
      try {
        await createComment({
          post_id: post.id,
          user_id: user.id,
          content,
          parent_id: parentCommentId,
        });
        toast.success("Reply added successfully", {
          className: "bg-[#eff3fb] text-[#03050c] border-[#3e31d3]/20",
        });
      } catch (error) {
        console.error("Failed to post reply:", error);
        toast.error("Failed to post reply", {
          className: "bg-[#eff3fb] text-[#03050c] border-red-400/20",
        });
      }
    },
    [createComment, post.id, user]
  );

  const commentContextValue = React.useMemo(
    () => ({
      handleVoteComment,
      handleSubmitReply,
      handleUpdateComment,
      handleDeleteComment,
      currentUserId: user?.id || null,
      handleTimestampClick: (seconds: number) => {
        const video = document.getElementById("main-video") as HTMLVideoElement;
        if (video) {
          try {
            video.currentTime = seconds;
            video.play().catch((error) => {
              console.error("Error playing video:", error);
            });
          } catch (error) {
            console.error("Error seeking video:", error);
          }
        }
      },
      isVideoPost: post.type === "Video",
    }),
    [
      handleVoteComment,
      handleSubmitReply,
      handleUpdateComment,
      handleDeleteComment,
      user?.id,
      post.type,
    ]
  );

  const postVoteBalance = (currentPost?.upvotes || 0) - (currentPost?.downvotes || 0);

  return (
    <div className="max-w-[1200px] mx-auto p-4 space-y-6">
      {/* Post Card */}
      <CommentContext.Provider value={commentContextValue}>
        <Card className="w-full border-[#b88ae0]/20 dark:border-[#3e31d3]/20 overflow-hidden bg-white dark:bg-[#0a0c16]">
          {/* Top accent bar */}
          <div className="h-1 bg-gradient-to-r from-[#3e31d3] to-[#c062d5]" />
          
          <CardHeader className="px-6 pt-6 pb-4">
            <div className="flex items-center gap-2 text-xs text-[#03050c]/60 dark:text-white/60 mb-3">
              <Avatar className="h-8 w-8 border-2 border-white dark:border-[#191c2a] shadow-sm">
                <AvatarImage src={post.author.profile_picture || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-[#3e31d3] to-[#c062d5] text-white font-medium">
                  {post.author.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <Link
                  href={`/account/${post.author.id}`}
                  className="font-medium text-[#3e31d3] dark:text-[#b88ae0] hover:underline"
                >
                  {post.author.username}
                </Link>

                {post.community && (
                  <>
                    <span className="inline-block w-1 h-1 rounded-full bg-[#03050c]/40 dark:bg-white/40"></span>
                    <Link
                      href={`/community/${post.community.name}`}
                      className="px-2 py-0.5 bg-[#eff3fb] dark:bg-[#191c2a] rounded-full text-[#3e31d3] dark:text-[#b88ae0] font-medium hover:bg-[#3e31d3]/10 dark:hover:bg-[#3e31d3]/20 transition-colors"
                    >
                      {post.community.name}
                    </Link>
                  </>
                )}
                
                <span className="inline-block w-1 h-1 rounded-full bg-[#03050c]/40 dark:bg-white/40"></span>
                <span className="inline-flex items-center">
                  <Clock className="w-3 h-3 mr-1 opacity-70" />
                  {formatDistanceToNow(new Date(post.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-[#03050c] dark:text-white leading-tight">
              {post.title}
            </h1>
          </CardHeader>

          <CardContent className="px-6 py-4">
            {post.description && (
              <div className="mb-6 border-l-4 border-[#3e31d3]/20 dark:border-[#b88ae0]/20 pl-4 py-2 bg-[#eff3fb]/50 dark:bg-[#191c2a]/50 rounded-r-md">
                <p className="text-sm text-[#03050c]/80 dark:text-white/80 italic">
                  {parseAndRenderTimestamps(
                    post.description,
                    post.type === "Video",
                    commentContextValue.handleTimestampClick
                  )}
                </p>
              </div>
            )}
            
            {post.type === "Image" && post.content && (
              <div className="relative aspect-video rounded-lg bg-[#eff3fb] dark:bg-[#191c2a] mb-4 overflow-hidden shadow-sm">
                {isMediaLoading && (
                  <Skeleton className="absolute inset-0 bg-[#eff3fb] dark:bg-[#191c2a]" />
                )}
                <IKImage
                  urlEndpoint={process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!}
                  src={post.content}
                  alt={`Post Image for ${post.title}`}
                  fill
                  className="object-cover rounded-lg"
                  onLoad={() => setIsMediaLoading(false)}
                />
              </div>
            )}
            
            {post.type === "Link" && post.content && (
              <a
                href={post.content}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-3 mt-2 rounded-md bg-[#eff3fb] dark:bg-[#191c2a] text-[#3e31d3] hover:bg-[#3e31d3]/10 dark:hover:bg-[#3e31d3]/20 transition-colors w-full text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3e31d3]"
              >
                <Share2Icon className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">{post.content}</span>
              </a>
            )}
            
            {post.type === "Text" && post.content && (
              <div className="text-[#03050c]/90 dark:text-white/90 text-base whitespace-pre-wrap leading-relaxed">
                {post.content}
              </div>
            )}
            
            {post.type === "Video" && post.content && (
              <div className="rounded-lg overflow-hidden mt-2 bg-[#eff3fb] dark:bg-[#191c2a] shadow-sm">
                {isMediaLoading && (
                  <Skeleton className="w-full aspect-video bg-[#eff3fb] dark:bg-[#191c2a]" />
                )}
                <IKVideo
                  urlEndpoint={process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!}
                  id="main-video"
                  controls
                  className="w-full rounded-lg"
                  src={post.content}
                  onLoadedData={() => setIsMediaLoading(false)}
                >
                  Your browser does not support the video tag.
                </IKVideo>
              </div>
            )}
          </CardContent>

          <CardFooter className="px-6 py-4 border-t border-[#eff3fb] dark:border-[#191c2a] flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex rounded-full bg-[#eff3fb] dark:bg-[#191c2a] p-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleVotePost("upvote")}
                  disabled={isSubmitting}
                  className={cn(
                    "h-9 px-3 rounded-l-full rounded-r-none border-r border-white/50 dark:border-black/20",
                    "text-[#03050c]/70 dark:text-white/70 hover:text-[#3e31d3] hover:bg-[#3e31d3]/10",
                    "focus-visible:ring-offset-0 focus-visible:ring-1 focus-visible:ring-[#3e31d3]",
                    currentPost?.userVote === "upvote" && "bg-[#3e31d3]/10 text-[#3e31d3] font-medium"
                  )}
                >
                  <ArrowUpIcon className="h-4 w-4 mr-1" />
                  <span className="text-xs">{currentPost?.upvotes || 0}</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleVotePost("downvote")}
                  disabled={isSubmitting}
                  className={cn(
                    "h-9 px-3 rounded-r-full rounded-l-none",
                    "text-[#03050c]/70 dark:text-white/70 hover:text-[#c062d5] hover:bg-[#c062d5]/10",
                    "focus-visible:ring-offset-0 focus-visible:ring-1 focus-visible:ring-[#c062d5]",
                    currentPost?.userVote === "downvote" && "bg-[#c062d5]/10 text-[#c062d5] font-medium"
                  )}
                >
                  <ArrowDownIcon className="h-4 w-4 mr-1" />
                  <span className="text-xs">{currentPost?.downvotes || 0}</span>
                </Button>
              </div>
              
              <div className={cn(
                "text-xs font-medium rounded-full px-3 py-1.5",
                postVoteBalance > 0 ? "bg-[#3e31d3]/10 text-[#3e31d3]" : 
                postVoteBalance < 0 ? "bg-[#c062d5]/10 text-[#c062d5]" : 
                "bg-[#eff3fb] dark:bg-[#191c2a] text-[#03050c]/60 dark:text-white/60"
              )}>
                {postVoteBalance > 0 ? "+" : ""}{postVoteBalance} votes
              </div>
            </div>
            
            <Separator orientation="vertical" className="h-8 bg-[#b88ae0]/20 dark:bg-[#3e31d3]/20" />
            
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                className="h-9 px-4 rounded-full text-[#03050c]/70 dark:text-white/70 hover:bg-[#eff3fb] dark:hover:bg-[#191c2a] hover:text-[#3e31d3]"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                {comments.length} Comments
              </Button>
            
            </div>
          </CardFooter>
        </Card>

        {/* Comments Section */}
        <Card className="w-full border-[#b88ae0]/20 dark:border-[#3e31d3]/20 bg-white dark:bg-[#0a0c16]">
          <CardContent className="p-6">
            {/* Comment Input */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Avatar className="h-8 w-8 border-2 border-white dark:border-[#191c2a]">
                  <AvatarImage src={user?.profile_picture || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-[#3e31d3] to-[#c062d5] text-white font-medium">
                    {user?.username?.slice(0, 2).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <p className="text-sm text-[#03050c]/80 dark:text-white/80">
                  Comment as <span className="font-medium text-[#3e31d3] dark:text-[#b88ae0]">{user?.username}</span>
                </p>
              </div>
              
              <Textarea
                                placeholder="What are your thoughts?"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[120px] mb-3 bg-white dark:bg-[#0a0c16] border-[#b88ae0]/20 focus:border-[#3e31d3] focus:ring-[#3e31d3] resize-none placeholder:text-[#03050c]/40 dark:placeholder:text-white/40"
              />
              
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmitComment}
                  disabled={isSubmitting || !newComment.trim()}
                  className="bg-[#3e31d3] hover:bg-[#3e31d3]/90 text-white px-5"
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      Posting...
                    </div>
                  ) : (
                    "Add Comment"
                  )}
                </Button>
              </div>
            </div>

            {comments.length > 0 ? (
              <>
                
                {/* Comments List */}
                <div className="space-y-6">
                  {comments.map((comment) => (
                    <div key={comment.id} className="group">
                      <CommentComponent comment={comment} />
                      {comments.indexOf(comment) !== comments.length - 1 && (
                        <Separator className="my-6 bg-[#b88ae0]/10 dark:bg-[#3e31d3]/10" />
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-[#eff3fb] dark:bg-[#191c2a] flex items-center justify-center mb-4">
                  <MessageSquare className="h-8 w-8 text-[#b88ae0] dark:text-[#3e31d3]/70" />
                </div>
                <h3 className="text-lg font-medium text-[#03050c] dark:text-white mb-2">No comments yet</h3>
                <p className="text-sm text-[#03050c]/60 dark:text-white/60 max-w-md">
                  Be the first to share your thoughts on this post!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </CommentContext.Provider>
    </div>
  );
}

// Utility function to parse and render timestamps in content
const parseAndRenderTimestamps = (
  content: string,
  isVideoPost: boolean,
  handleTimestampClick: (seconds: number) => void
) => {
  if (!isVideoPost) return content;

  const timeRegex = /(?:(\d{1,2}):)?(\d{1,2}):(\d{2})/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = timeRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }

    const timestamp = match[0];
    const [hours, minutes, seconds] = match;

    // Calculate total seconds
    const totalSeconds =
      (hours ? parseInt(hours) * 3600 : 0) +
      parseInt(minutes) * 60 +
      parseInt(seconds);

    parts.push(
      <button
        key={match.index}
        onClick={() => handleTimestampClick(totalSeconds)}
        className="inline-flex items-center px-1.5 py-0.5 rounded text-[#3e31d3] dark:text-[#b88ae0] bg-[#3e31d3]/10 dark:bg-[#3e31d3]/20 hover:bg-[#3e31d3]/20 dark:hover:bg-[#3e31d3]/30 cursor-pointer transition-colors text-xs font-medium"
      >
        <Clock className="h-3 w-3 mr-1" />
        {timestamp}
      </button>
    );

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts;
};