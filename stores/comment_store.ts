// commentStore.ts
import { create } from "zustand";
import { createClient } from "@/utils/supabase/client";

export interface Comment {
  id: number;
  post_id: number;
  user_id: string;
  content: string;
  parent_id: number | null;
  upvotes: number;
  downvotes: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface CommentWithAuthor extends Comment {
  author: {
    username: string;
    profile_picture: string | null;
  };
}

export interface CommentVote {
  id: number;
  user_id: string;
  comment_id: number;
  vote_type: "upvote" | "downvote";
  created_at: string;
}

export interface CommentWithAuthorAndVote extends CommentWithAuthor {
  userVote?: "upvote" | "downvote" | null;
  replies?: CommentWithAuthorAndVote[];
}

interface CommentStore {
  comments: CommentWithAuthorAndVote[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchComments: (postId: number) => Promise<void>;
  createComment: (
    comment: Omit<
      Comment,
      "id" | "created_at" | "updated_at" | "upvotes" | "downvotes"
    >
  ) => Promise<void>;
  updateComment: (commentId: number, content: string) => Promise<void>;
  deleteComment: (commentId: number) => Promise<void>;
  voteComment: (
    commentId: number,
    voteType: "upvote" | "downvote"
  ) => Promise<void>;
  removeCommentVote: (commentId: number) => Promise<void>;
}

export const useCommentStore = create<CommentStore>((set, get) => ({
  comments: [],
  loading: false,
  error: null,

  fetchComments: async (postId: number) => {
    const supabase = createClient();
    set({ loading: true, error: null });

    try {
      // Get the current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Fetch comments with their authors
      const { data: comments, error: commentsError } = await supabase
        .from("comments")
        .select(
          `
          id,
          post_id,
          user_id,
          content,
          parent_id,
          created_at,
          updated_at,
          author:users!comments_user_id_fkey (
            username,
            profile_picture
          )
        `
        )
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (commentsError) throw commentsError;

      // Fetch all votes for these comments
      const { data: votes, error: votesError } = await supabase
        .from("comment_votes")
        .select("*")
        .in(
          "comment_id",
          comments.map((c) => c.id)
        );

      if (votesError) throw votesError;

      const commentsWithAuthorAndVotes: CommentWithAuthorAndVote[] =
        comments.map((comment: any) => {
          // Get votes for this specific comment
          const commentVotes = votes.filter(
            (vote) => vote.comment_id === comment.id
          );

          // Calculate upvotes and downvotes
          const upvotes = commentVotes.filter(
            (vote) => vote.vote_type === "upvote"
          ).length;
          const downvotes = commentVotes.filter(
            (vote) => vote.vote_type === "downvote"
          ).length;

          // Get current user's vote if any
          const userVote = user
            ? (commentVotes.find((vote) => vote.user_id === user.id)
                ?.vote_type as "upvote" | "downvote" | undefined)
            : undefined;

          return {
            id: comment.id,
            post_id: comment.post_id,
            user_id: comment.user_id,
            content: comment.content,
            parent_id: comment.parent_id,
            upvotes,
            downvotes,
            created_at: comment.created_at,
            updated_at: comment.updated_at,
            author: {
              username: comment.author.username,
              profile_picture: comment.author.profile_picture,
            },
            userVote: userVote || null,
            replies: [],
          };
        });

      // Organize comments into a tree structure
      const commentTree = commentsWithAuthorAndVotes.reduce(
        (acc: CommentWithAuthorAndVote[], comment) => {
          if (!comment.parent_id) {
            acc.push(comment);
          } else {
            const parentComment = commentsWithAuthorAndVotes.find(
              (c) => c.id === comment.parent_id
            );
            if (parentComment) {
              parentComment.replies = parentComment.replies || [];
              parentComment.replies.push(comment);
            }
          }
          return acc;
        },
        []
      );

      set({ comments: commentTree, loading: false });
    } catch (error) {
      console.error("Error fetching comments:", error);
      set({ error: (error as Error).message, loading: false });
    }
  },

  createComment: async (comment) => {
    const supabase = createClient();
    set({ loading: true, error: null });

    try {
      const { data, error } = await supabase
        .from("comments")
        .insert([comment])
        .select(
          `
          *,
          author:users!comments_user_id_fkey (
            username,
            profile_picture
          )
        `
        )
        .single();

      if (error) throw error;

      const newComment: CommentWithAuthorAndVote = {
        id: data.id,
        post_id: data.post_id,
        user_id: data.user_id,
        content: data.content,
        parent_id: data.parent_id,
        upvotes: 0,
        downvotes: 0,
        created_at: data.created_at,
        updated_at: data.updated_at,
        author: {
          username: data.author.username,
          profile_picture: data.author.profile_picture,
        },
        userVote: null,
        replies: [],
      };

      set((state) => {
        if (newComment.parent_id) {
          // Add reply to parent comment
          return {
            comments: state.comments.map((comment) => {
              if (comment.id === newComment.parent_id) {
                return {
                  ...comment,
                  replies: [...(comment.replies || []), newComment],
                };
              }
              return comment;
            }),
            loading: false,
          };
        } else {
          // Add top-level comment
          return {
            comments: [...state.comments, newComment],
            loading: false,
          };
        }
      });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  updateComment: async (commentId: number, content: string) => {
    const supabase = createClient();
    set({ loading: true, error: null });

    try {
      const { data, error } = await supabase
        .from("comments")
        .update({ content })
        .eq("id", commentId)
        .select(
          `
          *,
          author:users!comments_user_id_fkey (
            username,
            profile_picture
          )
        `
        )
        .single();

      if (error) throw error;

      set((state) => ({
        comments: state.comments.map((comment) =>
          updateCommentRecursively(comment, commentId, data)
        ),
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  deleteComment: async (commentId: number) => {
    const supabase = createClient();
    set({ loading: true, error: null });

    try {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;

      set((state) => ({
        comments: state.comments.filter((comment) =>
          removeCommentRecursively(comment, commentId)
        ),
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  voteComment: async (commentId: number, voteType: "upvote" | "downvote") => {
    const supabase = createClient();
    set({ loading: true, error: null });

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("User not authenticated");

      // Remove existing vote if any
      await supabase
        .from("comment_votes")
        .delete()
        .eq("comment_id", commentId)
        .eq("user_id", user.id);

      // Insert new vote
      await supabase.from("comment_votes").insert([
        {
          comment_id: commentId,
          user_id: user.id,
          vote_type: voteType,
        },
      ]);

      // Get updated vote counts
      const { data: updatedVotes } = await supabase
        .from("comment_votes")
        .select("*")
        .eq("comment_id", commentId);

      const upvotes =
        updatedVotes?.filter((v) => v.vote_type === "upvote").length || 0;
      const downvotes =
        updatedVotes?.filter((v) => v.vote_type === "downvote").length || 0;

      // Update state
      set((state) => ({
        comments: state.comments.map((comment) =>
          updateCommentVoteRecursively(comment, commentId, {
            userVote: voteType,
            upvotes,
            downvotes,
          })
        ),
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  removeCommentVote: async (commentId: number) => {
    const supabase = createClient();
    set({ loading: true, error: null });

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("User not authenticated");

      // Remove the vote
      await supabase
        .from("comment_votes")
        .delete()
        .eq("comment_id", commentId)
        .eq("user_id", user.id);

      // Get updated vote counts
      const { data: updatedVotes } = await supabase
        .from("comment_votes")
        .select("*")
        .eq("comment_id", commentId);

      const upvotes =
        updatedVotes?.filter((v) => v.vote_type === "upvote").length || 0;
      const downvotes =
        updatedVotes?.filter((v) => v.vote_type === "downvote").length || 0;

      // Update state
      set((state) => ({
        comments: state.comments.map((comment) =>
          updateCommentVoteRecursively(comment, commentId, {
            userVote: null,
            upvotes,
            downvotes,
          })
        ),
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
}));

// Helper functions for recursive operations
function updateCommentRecursively(
  comment: CommentWithAuthorAndVote,
  targetId: number,
  updatedData: any
): CommentWithAuthorAndVote {
  if (comment.id === targetId) {
    return {
      ...comment,
      content: updatedData.content,
      updated_at: updatedData.updated_at,
    };
  }
  if (comment.replies) {
    return {
      ...comment,
      replies: comment.replies.map((reply) =>
        updateCommentRecursively(reply, targetId, updatedData)
      ),
    };
  }
  return comment;
}

function removeCommentRecursively(
  comment: CommentWithAuthorAndVote,
  targetId: number
): boolean {
  if (comment.id === targetId) {
    return false;
  }
  if (comment.replies) {
    comment.replies = comment.replies.filter((reply) =>
      removeCommentRecursively(reply, targetId)
    );
  }
  return true;
}

function updateCommentVoteRecursively(
  comment: CommentWithAuthorAndVote,
  targetId: number,
  updates: {
    userVote: "upvote" | "downvote" | null;
    upvotes: number;
    downvotes: number;
  }
): CommentWithAuthorAndVote {
  if (comment.id === targetId) {
    return {
      ...comment,
      userVote: updates.userVote,
      upvotes: updates.upvotes,
      downvotes: updates.downvotes,
    };
  }
  if (comment.replies) {
    return {
      ...comment,
      replies: comment.replies.map((reply) =>
        updateCommentVoteRecursively(reply, targetId, updates)
      ),
    };
  }
  return comment;
}
