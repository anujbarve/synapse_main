// Shared post/comment data helpers.
// Used by server components (route loaders) and client stores.
// Only *type* imports from the stores are allowed here so this module can be
// imported from server code without pulling in "use client" store modules.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/types/supabase";
import type { PostType, PostWithAuthorAndVote } from "@/stores/post_store";
import type { CommentWithAuthorAndVote } from "@/stores/comment_store";

export type VoteType = "upvote" | "downvote";
export type AppSupabaseClient = SupabaseClient<Database>;

export const RECENT_POSTS_PER_PAGE = 4;

// Runtime guard for posts.type values coming from the database
export function isPostType(value: string): value is PostType {
  return (
    value === "Text" || value === "Link" || value === "Image" || value === "Video"
  );
}

// Runtime guard for post_votes / comment_votes vote_type values
export function isVoteType(value: string | null | undefined): value is VoteType {
  return value === "upvote" || value === "downvote";
}

// Unknown post types are rendered as "Text" and logged, so the row still shows.
export function resolvePostType(value: string, postId: number): PostType {
  if (isPostType(value)) return value;
  console.error(`Post ${postId} has unknown type "${value}", rendering as Text`);
  return "Text";
}

type AuthorJoin = {
  id: string;
  username: string;
  profile_picture: string | null;
};

type CommunityJoin = {
  name: string;
  banner_picture: string | null;
};

type PostRow = Tables<"posts"> & {
  author: AuthorJoin;
  community: CommunityJoin | null;
};

type CommentRow = Pick<
  Tables<"comments">,
  "id" | "post_id" | "user_id" | "content" | "parent_id" | "created_at" | "updated_at"
> & {
  author: { username: string; profile_picture: string | null };
};

type CommentVoteRow = {
  comment_id: number;
  user_id: string;
  vote_type: string;
};

const POST_WITH_AUTHOR_AND_COMMUNITY = `
  *,
  author:users!posts_user_id_fkey (
    id,
    username,
    profile_picture
  ),
  community:community!posts_community_id_fkey (
    name,
    banner_picture
  )
`;

function toPostWithAuthorAndVote(
  row: PostRow,
  userVote: VoteType | null
): PostWithAuthorAndVote {
  return {
    id: row.id,
    community_id: row.community_id,
    user_id: row.user_id,
    title: row.title,
    content: row.content,
    description: row.description,
    type: resolvePostType(row.type, row.id),
    upvotes: row.upvotes || 0,
    downvotes: row.downvotes || 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
    author: {
      id: row.author.id,
      username: row.author.username,
      profile_picture: row.author.profile_picture,
    },
    community: row.community
      ? {
          name: row.community.name,
          banner_picture: row.community.banner_picture,
        }
      : undefined,
    userVote,
  };
}

async function getCurrentUserId(supabase: AppSupabaseClient): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// Returns post_id -> vote for one user (optionally restricted to one post).
// Rows with an unknown vote_type are logged and ignored.
async function loadUserVoteMap(
  supabase: AppSupabaseClient,
  userId: string,
  postId?: number
): Promise<Map<number, VoteType>> {
  let query = supabase
    .from("post_votes")
    .select("post_id, vote_type")
    .eq("user_id", userId);
  if (postId !== undefined) {
    query = query.eq("post_id", postId);
  }
  const { data, error } = await query;
  if (error) throw error;

  const votes = new Map<number, VoteType>();
  for (const vote of data) {
    if (isVoteType(vote.vote_type)) {
      votes.set(vote.post_id, vote.vote_type);
    } else {
      console.error(`Post ${vote.post_id} has unknown vote_type "${vote.vote_type}"`);
    }
  }
  return votes;
}

// All posts, newest first, with the logged-in user's vote on each post.
export async function loadAllPosts(
  supabase: AppSupabaseClient
): Promise<PostWithAuthorAndVote[]> {
  const userId = await getCurrentUserId(supabase);

  const [postsResponse, voteMap] = await Promise.all([
    supabase
      .from("posts")
      .select(POST_WITH_AUTHOR_AND_COMMUNITY)
      .order("created_at", { ascending: false }),
    userId ? loadUserVoteMap(supabase, userId) : Promise.resolve(new Map<number, VoteType>()),
  ]);

  if (postsResponse.error) throw postsResponse.error;

  return postsResponse.data.map((post) =>
    toPostWithAuthorAndVote(post, voteMap.get(post.id) ?? null)
  );
}

export type RecentPost = {
  id: number;
  title: string;
  created_at: string;
  upvotes: number;
  downvotes: number;
  user_id: string;
  author: {
    id: string;
    username: string;
    profile_picture: string | null;
  };
  _count: {
    comments: number;
  };
};

// One page of recent posts (1-based page number) for the activity sidebar.
export async function loadRecentPostsPage(
  supabase: AppSupabaseClient,
  page: number
): Promise<{ posts: RecentPost[]; hasMore: boolean }> {
  const from = (page - 1) * RECENT_POSTS_PER_PAGE;
  const to = from + RECENT_POSTS_PER_PAGE - 1;

  const { data, error } = await supabase
    .from("posts")
    .select(`
      id,
      title,
      created_at,
      upvotes,
      downvotes,
      user_id,
      author:users!posts_user_id_fkey (
        id,
        username,
        profile_picture
      ),
      comments (count)
    `)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;

  const posts: RecentPost[] = data.map((post) => ({
    id: post.id,
    title: post.title,
    created_at: post.created_at,
    upvotes: post.upvotes,
    downvotes: post.downvotes,
    user_id: post.user_id,
    author: {
      id: post.author.id,
      username: post.author.username,
      profile_picture: post.author.profile_picture,
    },
    _count: {
      comments: post.comments?.[0]?.count || 0,
    },
  }));

  return { posts, hasMore: posts.length === RECENT_POSTS_PER_PAGE };
}

// Builds the reply tree for one post's comments. Votes with an unknown
// vote_type are logged and ignored.
export function buildCommentTree(
  rows: CommentRow[],
  votes: CommentVoteRow[],
  userId: string | null
): CommentWithAuthorAndVote[] {
  const byId = new Map<number, CommentWithAuthorAndVote>();

  for (const row of rows) {
    const commentVotes = votes.filter((vote) => vote.comment_id === row.id);
    let upvotes = 0;
    let downvotes = 0;
    let userVote: VoteType | null = null;

    for (const vote of commentVotes) {
      if (!isVoteType(vote.vote_type)) {
        console.error(
          `Comment ${row.id} has unknown vote_type "${vote.vote_type}"`
        );
        continue;
      }
      if (vote.vote_type === "upvote") upvotes += 1;
      else downvotes += 1;
      if (userId !== null && vote.user_id === userId) {
        userVote = vote.vote_type;
      }
    }

    byId.set(row.id, {
      id: row.id,
      post_id: row.post_id,
      user_id: row.user_id,
      content: row.content,
      parent_id: row.parent_id,
      upvotes,
      downvotes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      author: {
        username: row.author.username,
        profile_picture: row.author.profile_picture,
      },
      userVote,
      replies: [],
    });
  }

  const roots: CommentWithAuthorAndVote[] = [];
  for (const comment of byId.values()) {
    if (!comment.parent_id) {
      roots.push(comment);
      continue;
    }
    const parent = byId.get(comment.parent_id);
    if (parent) {
      parent.replies = parent.replies || [];
      parent.replies.push(comment);
    }
  }
  return roots;
}

async function loadComments(
  supabase: AppSupabaseClient,
  postId: number,
  userId: string | null
): Promise<CommentWithAuthorAndVote[]> {
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
  if (comments.length === 0) return [];

  const { data: votes, error: votesError } = await supabase
    .from("comment_votes")
    .select("comment_id, user_id, vote_type")
    .in(
      "comment_id",
      comments.map((c) => c.id)
    );

  if (votesError) throw votesError;

  return buildCommentTree(comments, votes, userId);
}

// A single post with its comments, or null when the post does not exist.
export async function loadPostDetail(
  supabase: AppSupabaseClient,
  postId: number
): Promise<{ post: PostWithAuthorAndVote; comments: CommentWithAuthorAndVote[] } | null> {
  const userId = await getCurrentUserId(supabase);

  const [postResponse, voteMap, comments] = await Promise.all([
    supabase
      .from("posts")
      .select(
        `
        *,
        author:users!posts_user_id_fkey (
          id,
          username,
          profile_picture
        )
      `
      )
      .eq("id", postId)
      .maybeSingle(),
    userId
      ? loadUserVoteMap(supabase, userId, postId)
      : Promise.resolve(new Map<number, VoteType>()),
    loadComments(supabase, postId, userId),
  ]);

  if (postResponse.error) throw postResponse.error;
  if (!postResponse.data) return null;

  const row = postResponse.data;
  const post = toPostWithAuthorAndVote(
    { ...row, community: null },
    voteMap.get(postId) ?? null
  );
  return { post, comments };
}

// Supabase errors are PostgrestError objects, not Error instances
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return "Something went wrong";
}
