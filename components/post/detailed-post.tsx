"use client";

import * as React from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  Edit,
  Heart,
  MessageSquare,
  MoreVertical,
  Share,
  Trash2,
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
  handleTimestampClick: (seconds: number) => void; // Add this
  isVideoPost: boolean; // Add this
}

const CommentContext = React.createContext<CommentContextType>({
  handleVoteComment: async () => {},
  handleSubmitReply: async () => {},
  handleUpdateComment: async () => {},
  handleDeleteComment: async () => {},
  currentUserId: null, // Add this
  handleTimestampClick: () => {}, // Add this
  isVideoPost: false, // Add this
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
          className="min-h-[100px] mb-2"
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting || !content.trim()}
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
    } = React.useContext(CommentContext);

    const isCommentOwner = currentUserId === comment.user_id;

    const handleEdit = async () => {
      try {
        await handleUpdateComment(comment.id, editContent);
        setIsEditing(false);
      } catch (error) {
        console.error("Failed to update comment:", error);
        toast.error("Failed to update comment");
      }
    };

    const { handleTimestampClick, isVideoPost } =
      React.useContext(CommentContext);

    return (
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={comment.author.profile_picture || undefined} />
              <AvatarFallback>
                {comment.author.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">
              {comment.author.username}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at!), {
                addSuffix: true,
              })}
            </span>
          </div>

          {isCommentOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[160px]">
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[100px] resize-none"
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
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleEdit}
                disabled={
                  !editContent.trim() || editContent === comment.content
                }
              >
                Save
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-foreground/90 whitespace-pre-wrap">
            {parseAndRenderTimestamps(comment.content,isVideoPost,handleTimestampClick)}
          </p>
        )}

        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVoteComment(comment.id, "upvote")}
              className={`px-2 ${
                comment.userVote === "upvote" ? "text-orange-500" : ""
              }`}
            >
              <ArrowUpIcon className="h-4 w-4" />
              <span className="ml-1">{comment.upvotes}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVoteComment(comment.id, "downvote")}
              className={`px-2 ${
                comment.userVote === "downvote" ? "text-blue-500" : ""
              }`}
            >
              <ArrowDownIcon className="h-4 w-4" />
              <span className="ml-1">{comment.downvotes}</span>
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsReplying(!isReplying)}
            className="px-2"
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            Reply
          </Button>
        </div>

        {isReplying && (
          <div className="mt-4 pl-4 border-l-2 border-muted">
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
          <div className="mt-4 pl-4 border-l-2 border-muted space-y-4">
            {comment.replies.map((reply) => (
              <CommentComponent key={reply.id} comment={reply} />
            ))}
          </div>
        )}

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="sm:max-w-[425px]">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Comment</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this comment? This action cannot
                be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  try {
                    await handleDeleteComment(comment.id);
                    setShowDeleteDialog(false);
                    toast.success("Comment deleted successfully");
                  } catch (error) {
                    console.error("Failed to delete comment:", error);
                    toast.error("Failed to delete comment");
                  }
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
        toast.success("Comment updated successfully");
      } catch (error) {
        console.error("Failed to update comment:", error);
        toast.error("Failed to update comment");
      }
    },
    [updateComment]
  );

  const handleDeleteComment = React.useCallback(
    async (commentId: number) => {
      try {
        await deleteComment(commentId);
        toast.success("Comment deleted successfully");
      } catch (error) {
        console.error("Failed to delete comment:", error);
        toast.error("Failed to delete comment");
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
      toast.error("Failed to vote on post");
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    if (user == null) return;
    try {
      setIsSubmitting(true);
      await createComment({
        post_id: post.id,
        user_id: user.id, // Assuming this is the current user's ID
        content: newComment,
        parent_id: null,
      });
      setNewComment("");
      toast.success("Your comment has been posted successfully");
    } catch (error) {
      console.error("Failed to post comment:", error);
      toast.error("Failed to post comment");
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
        toast.error("Failed to vote on comment");
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
        toast.success("Reply added successfully");
      } catch (error) {
        console.error("Failed to post reply:", error);
        toast.error("Failed to post reply");
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
      }, // Add this
      isVideoPost: post.type === "Video", // Add this
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

  return (
    <div className="max-w-[1200px] mx-auto p-4 space-y-4">
      {/* Post Card */}
      <CommentContext.Provider value={commentContextValue}>
        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={post.author.profile_picture || undefined} />
                <AvatarFallback>
                  {post.author.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span>Posted by {post.author.username}</span>
              {post.community && (
                <>
                  <span>in {post.community.name}</span>
                </>
              )}
              <span>•</span>
              <span>
                {formatDistanceToNow(new Date(post.created_at), {
                  addSuffix: true,
                })}
              </span>
            </div>
            <h1 className="text-xl font-semibold">{post.title}</h1>
          </CardHeader>

          <CardContent>
            {post.description && (
              <div className="mb-6 border-l-4 border-muted-foreground/20 pl-4">
                <p className="text-sm text-muted-foreground italic">
                  {parseAndRenderTimestamps(
                    post.description,
                    post.type === "Video",
                    commentContextValue.handleTimestampClick
                  )}
                </p>
              </div>
            )}
            {post.type === "Image" && post.content && (
              <div className="relative aspect-video rounded-lg bg-muted/50 mb-4 overflow-hidden">
                <IKImage
                  urlEndpoint={process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!}
                  src={post.content}
                  alt={`Post Image for ${post.title}`}
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
            )}
            {post.type === "Link" && post.content && (
              <a
                href={post.content}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline break-all"
              >
                {post.content}
              </a>
            )}
            {post.type === "Text" && post.content && (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {post.content}
              </p>
            )}
            {post.type === "Video" && post.content && (
              <div className="video-container">
                <IKVideo
                  urlEndpoint={process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!}
                  id="main-video"
                  controls
                  className="w-full rounded-lg"
                  src={post.content}
                >
                  Your browser does not support the video tag.
                </IKVideo>
              </div>
            )}
          </CardContent>

          <CardFooter>
            <div className="flex items-center gap-4 w-full">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleVotePost("upvote")}
                  className={
                    currentPost?.userVote === "upvote" ? "text-orange-500" : ""
                  }
                >
                  <ArrowUpIcon className="h-4 w-4 mr-1" />
                  {currentPost?.upvotes || 0}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleVotePost("downvote")}
                  className={
                    currentPost?.userVote === "downvote" ? "text-blue-500" : ""
                  }
                >
                  <ArrowDownIcon className="h-4 w-4 mr-1" />
                  {currentPost?.downvotes || 0}
                </Button>
              </div>
              <Separator orientation="vertical" className="h-6" />
              <Button variant="ghost" size="sm">
                <MessageSquare className="h-4 w-4 mr-2" />
                {comments.length} Comments
              </Button>
              <Button variant="ghost" size="sm">
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="ghost" size="sm">
                <Heart className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Comments Section */}
        <Card>
          <CardContent className="p-6">
            {/* Comment Input */}
            <div className="mb-6">
              <p className="text-sm mb-2">Comment as {user?.username}</p>
              <Textarea
                placeholder="What are your thoughts?"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[100px] mb-2"
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmitComment}
                  disabled={isSubmitting || !newComment.trim()}
                >
                  {isSubmitting ? "Posting..." : "Comment"}
                </Button>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Comments List */}
            <div className="space-y-6">
              {comments.map((comment) => (
                <div key={comment.id} className="group">
                  <CommentComponent comment={comment} />
                  {comments.indexOf(comment) !== comments.length - 1 && (
                    <Separator className="my-4" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </CommentContext.Provider>
    </div>
  );
}

const parseAndRenderTimestamps = (
  content: string,
  isVideoPost: boolean,
  handleTimestampClick: (seconds: number) => void
) => {
  if (!isVideoPost) return content;

  const timeRegex = /(\d{1,2}):(\d{2})(?::(\d{2}))?/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = timeRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }

    const timestamp = match[0];
    const [ minutes, seconds, hours] = match;
    const totalSeconds =
      (hours ? parseInt(hours) * 3600 : 0) +
      parseInt(minutes) * 60 +
      parseInt(seconds);

    parts.push(
      <button
        key={match.index}
        onClick={() => handleTimestampClick(totalSeconds)}
        className="text-blue-500 hover:underline cursor-pointer"
      >
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
