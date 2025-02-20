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
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { PostWithAuthorAndVote, usePostStore } from "@/stores/post_store";
import { useToast } from "@/hooks/use-toast";
import { IKImage, IKVideo } from "imagekitio-next";
import {
  CommentWithAuthorAndVote,
  useCommentStore,
} from "@/stores/comment_store";
import { useUserStore } from "@/stores/user_store";

// Create Context for Comment Functions
interface CommentContextType {
  handleVoteComment: (commentId: number, voteType: 'upvote' | 'downvote') => Promise<void>;
  handleSubmitReply: (parentCommentId: number, content: string) => Promise<void>;
}

const CommentContext = React.createContext<CommentContextType>({
  handleVoteComment: async () => {},
  handleSubmitReply: async () => {},
});

// Reply Input Component
const ReplyInput = React.memo(({ 
  onSubmit, 
  onCancel 
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
      console.error('Failed to submit reply:', error);
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
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
        >
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
});

ReplyInput.displayName = 'ReplyInput';

// Comment Component
const CommentComponent = React.memo(({ comment }: { comment: CommentWithAuthorAndVote }) => {
  const [isReplying, setIsReplying] = React.useState(false);
  const { handleVoteComment, handleSubmitReply } = React.useContext(CommentContext);

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Avatar className="h-6 w-6">
          <AvatarImage src={comment.author.profile_picture || undefined} />
          <AvatarFallback>
            {comment.author.username.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium">{comment.author.username}</span>
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(comment.created_at!), { addSuffix: true })}
        </span>
      </div>
      <p className="text-sm pl-8">{comment.content}</p>
      <div className="flex items-center gap-2 mt-2 pl-8">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => handleVoteComment(comment.id, 'upvote')}
          className={comment.userVote === 'upvote' ? 'text-orange-500' : ''}
        >
          <ArrowUpIcon className="h-4 w-4" />
          {comment.upvotes}
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => handleVoteComment(comment.id, 'downvote')}
          className={comment.userVote === 'downvote' ? 'text-blue-500' : ''}
        >
          <ArrowDownIcon className="h-4 w-4" />
          {comment.downvotes}
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setIsReplying(!isReplying)}
        >
          <MessageSquare className="h-4 w-4 mr-1" />
          Reply
        </Button>
      </div>

      {isReplying && (
        <ReplyInput
          onSubmit={async (content) => {
            await handleSubmitReply(comment.id, content);
            setIsReplying(false);
          }}
          onCancel={() => setIsReplying(false)}
        />
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-8 mt-4 border-l-2 border-muted pl-4">
          {comment.replies.map(reply => (
            <CommentComponent key={reply.id} comment={reply} />
          ))}
        </div>
      )}
    </div>
  );
});

CommentComponent.displayName = 'CommentComponent';



export function DetailedPost({ post }: { post: PostWithAuthorAndVote }) {
  const { user } = useUserStore();
  const [newComment, setNewComment] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();
  const { votePost, removeVote, currentPost, fetchPostById } = usePostStore();
  const { 
    comments, 
    createComment, 
    voteComment, 
    removeCommentVote,
    fetchComments 
  } = useCommentStore();

   // Fetch post and comments data
   React.useEffect(() => {
    fetchPostById(post.id);
    fetchComments(post.id);
  }, [post.id, fetchPostById, fetchComments]);
  
  const handleVotePost = async (voteType: 'upvote' | 'downvote') => {
    try {
      if (currentPost?.userVote === voteType) {
        await removeVote(post.id);
      } else {
        await votePost(post.id, voteType);
      }
    } catch (error) {
      console.error("Failed to vote on post:", error);
      toast({
        title: "Error",
        description: "Failed to vote on post",
        variant: "destructive",
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
        user_id: user.id, // Assuming this is the current user's ID
        content: newComment,
        parent_id: null
      });
      setNewComment("");
      toast({
        title: "Comment added",
        description: "Your comment has been posted successfully",
      });
    } catch (error) {
      console.error("Failed to post comment:", error);
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoteComment = async (commentId: number, voteType: 'upvote' | 'downvote') => {
    try {
      const comment = comments.find(c => c.id === commentId);
      if (comment?.userVote === voteType) {
        await removeCommentVote(commentId);
      } else {
        await voteComment(commentId, voteType);
      }
    } catch (error) {
      console.log("Failed to vote on comment:", error);
      toast({
        title: "Error",
        description: "Failed to vote on comment",
        variant: "destructive",
      });
    }
  };

  const handleSubmitReply = async (parentCommentId: number, content: string) => {
    if (user == null) return;
    try {
      await createComment({
        post_id: post.id,
        user_id: user.id,
        content,
        parent_id: parentCommentId,
      });
      toast({
        title: "Success",
        description: "Reply added successfully",
      });
    } catch (error) {
      console.error("Failed to post reply:", error);
      toast({
        title: "Error",
        description: "Failed to post reply",
        variant: "destructive",
      });
    }
  };

  const commentContextValue = React.useMemo(
    () => ({
      handleVoteComment,
      handleSubmitReply,
    }),
    [handleVoteComment, handleSubmitReply]
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
            <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
          </div>
          <h1 className="text-xl font-semibold">{post.title}</h1>
        </CardHeader>

        <CardContent>
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
          <IKVideo
            urlEndpoint={process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!}
            controls
            className="w-full rounded-lg"
            src={post.content}
          >
            Your browser does not support the video tag.
          </IKVideo>
        )}
      </CardContent>

        <CardFooter>
          <div className="flex items-center gap-4 w-full">
            <div className="flex items-center gap-1">
            <Button
                variant="ghost"
                size="sm"
                onClick={() => handleVotePost("upvote")}
                className={currentPost?.userVote === "upvote" ? "text-orange-500" : ""}
              >
                <ArrowUpIcon className="h-4 w-4 mr-1" />
                {currentPost?.upvotes || 0}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleVotePost("downvote")}
                className={currentPost?.userVote === "downvote" ? "text-blue-500" : ""}
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