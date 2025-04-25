// postStore.ts
import { create } from "zustand";
import { createClient } from "@/utils/supabase/client";
import { useReputationStore } from "./reputation_store";
import { useNotificationStore } from "./notification_store";

export type PostType = "Text" | "Link" | "Image" | "Video";

export interface Post {
  id: number;
  community_id: number;
  user_id: string;
  title: string;
  content: string;
  type: PostType;
  upvotes: number;
  downvotes: number;
  created_at: string;
  updated_at: string;
  description: string | null;
}

export interface PostWithAuthor extends Post {
  author: {
    id: string;
    username: string;
    profile_picture: string | null;
  };
  community?: {
    name: string;
    banner_picture: string | null;
  };
}

export interface PostVote {
  id: number;
  user_id: string;
  post_id: number;
  vote_type: "upvote" | "downvote";
  created_at: string;
}

export interface PostWithAuthorAndVote extends PostWithAuthor {
  userVote?: "upvote" | "downvote" | null;
}

interface PostStore {
  posts: PostWithAuthorAndVote[];
  currentPost: PostWithAuthorAndVote | null;
  loading: boolean;
  error: string | null;
  userPosts: PostWithAuthorAndVote[];
  userPostsLoading: boolean;
  userPostsError: string | null;

  // Actions
  fetchAllPosts: () => Promise<void>;
  fetchPosts: (communityId: number) => Promise<void>;
  fetchPostById: (postId: number) => Promise<void>;
  createPost: (
    post: Omit<
      Post,
      "id" | "created_at" | "updated_at" | "upvotes" | "downvotes"
    >
  ) => Promise<void>;
  updatePost: (postId: number, updates: Partial<Post>) => Promise<void>;
  deletePost: (postId: number) => Promise<void>;
  votePost: (postId: number, voteType: "upvote" | "downvote") => Promise<void>;
  removeVote: (postId: number) => Promise<void>;
  fetchUserVotes: () => Promise<void>;
  setCurrentPost: (post: PostWithAuthorAndVote | null) => void;

  // user posts
  fetchUserPosts: (username: string) => Promise<void>;
}

export const usePostStore = create<PostStore>((set, get) => ({
  posts: [],
  currentPost: null,
  loading: false,
  error: null,
  userPosts: [],
  userPostsLoading: false,
  userPostsError: null,

  // Add new action for fetching user posts
  fetchUserPosts: async (username: string) => {
    const supabase = createClient();
    set({ userPostsLoading: true, userPostsError: null });

    try {
      // First get the user ID from the username
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("username", username)
        .single();

      if (userError) throw userError;
      if (!userData) throw new Error("User not found");

      // Then fetch all posts by this user
      const [postsResponse, votesResponse] = await Promise.all([
        supabase
          .from("posts")
          .select(
            `
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
          `
          )
          .eq("user_id", userData.id)
          .order("created_at", { ascending: false }),
        supabase.from("post_votes").select("*"),
      ]);

      if (postsResponse.error) throw postsResponse.error;
      if (votesResponse.error) throw votesResponse.error;

      const isValidVoteType = (
        type: string | null | undefined
      ): type is "upvote" | "downvote" => {
        return type === "upvote" || type === "downvote";
      };

      const postsWithAuthorAndVotes: PostWithAuthorAndVote[] =
        postsResponse.data.map((post: any) => {
          const voteType = votesResponse.data?.find(
            (vote) => vote.post_id === post.id
          )?.vote_type;

          return {
            id: post.id,
            community_id: post.community_id,
            user_id: post.user_id,
            title: post.title,
            content: post.content,
            description: post.description,
            type: post.type as PostType,
            upvotes: post.upvotes || 0,
            downvotes: post.downvotes || 0,
            created_at: post.created_at,
            updated_at: post.updated_at,
            author: {
              id: post.author.id,
              username: post.author.username,
              profile_picture: post.author.profile_picture,
            },
            community: post.community
              ? {
                  name: post.community.name,
                  banner_picture: post.community.banner_picture,
                }
              : undefined,
            userVote: isValidVoteType(voteType) ? voteType : null,
          };
        });

      set({
        userPosts: postsWithAuthorAndVotes,
        userPostsLoading: false,
      });
    } catch (error) {
      console.error("Error fetching user posts:", error);
      set({
        userPostsError: (error as Error).message,
        userPostsLoading: false,
      });
    }
  },

  setCurrentPost: (post) => set({ currentPost: post }),

  fetchUserVotes: async () => {
    const supabase = createClient();
    try {
      const { data: userVotes, error } = await supabase
        .from("post_votes")
        .select("*");

      if (error) throw error;

      const isValidVoteType = (type: string): type is "upvote" | "downvote" => {
        return type === "upvote" || type === "downvote";
      };

      set((state) => ({
        posts: state.posts.map((post) => {
          const voteType = userVotes?.find(
            (vote) => vote.post_id === post.id
          )?.vote_type;
          return {
            ...post,
            userVote: voteType && isValidVoteType(voteType) ? voteType : null,
          };
        }),
      }));
    } catch (error) {
      console.error("Error fetching user votes:", error);
    }
  },

  // Modify fetchAllPosts method
  fetchAllPosts: async () => {
    const supabase = createClient();
    set({ loading: true, error: null });
    try {
      // Fetch current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const [postsResponse, votesResponse] = await Promise.all([
        supabase
          .from("posts")
          .select(
            `
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
        `
          )
          .order("created_at", { ascending: false }),

        // Only fetch votes for the current user if authenticated
        user
          ? supabase.from("post_votes").select("*").eq("user_id", user.id)
          : Promise.resolve({ data: [] }),
      ]);

      if (postsResponse.error) throw postsResponse.error;

      const postsWithAuthorAndVotes: PostWithAuthorAndVote[] =
        postsResponse.data.map((post: any) => {
          // Find the current user's vote for this specific post
          const userVote = votesResponse.data?.find(
            (vote) => vote.post_id === post.id
          )?.vote_type;

          return {
            ...post,
            author: {
              id: post.author.id,
              username: post.author.username,
              profile_picture: post.author.profile_picture,
            },
            community: post.community
              ? {
                  name: post.community.name,
                  banner_picture: post.community.banner_picture,
                }
              : undefined,
            userVote: userVote || null, // Only set userVote if it exists for the current user
          };
        });

      set({ posts: postsWithAuthorAndVotes, loading: false });
    } catch (error) {
      console.error("Error fetching all posts:", error);
      set({ error: (error as Error).message, loading: false });
    }
  },

  // Similar modification for fetchPosts method
  fetchPosts: async (communityId: number) => {
    const supabase = createClient();
    set({ loading: true, error: null });
    try {
      // Fetch current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const [postsResponse, votesResponse] = await Promise.all([
        supabase
          .from("posts")
          .select(
            `
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
        `
          )
          .eq("community_id", communityId)
          .order("created_at", { ascending: false }),

        // Only fetch votes for the current user if authenticated
        user
          ? supabase.from("post_votes").select("*").eq("user_id", user.id)
          : Promise.resolve({ data: [] }),
      ]);

      if (postsResponse.error) throw postsResponse.error;

      const postsWithAuthorAndVotes: PostWithAuthorAndVote[] =
        postsResponse.data.map((post: any) => {
          // Find the current user's vote for this specific post
          const userVote = votesResponse.data?.find(
            (vote) => vote.post_id === post.id
          )?.vote_type;

          return {
            ...post,
            author: {
              id: post.author.id,
              username: post.author.username,
              profile_picture: post.author.profile_picture,
            },
            community: {
              name: post.community.name,
              banner_picture: post.community.banner_picture,
            },
            userVote: userVote || null, // Only set userVote if it exists for the current user
          };
        });

      set({ posts: postsWithAuthorAndVotes, loading: false });
    } catch (error) {
      console.error("Error fetching posts:", error);
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchPostById: async (postId: number) => {
    const supabase = createClient();
    set({ loading: true, error: null });
    try {
      const [postResponse, voteResponse] = await Promise.all([
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
          .single(),
        supabase
          .from("post_votes")
          .select("*")
          .eq("post_id", postId)
          .maybeSingle(), // Change from single() to maybeSingle()
      ]);

      if (postResponse.error) throw postResponse.error;

      const isValidVoteType = (
        type: string | null | undefined
      ): type is "upvote" | "downvote" => {
        return type === "upvote" || type === "downvote";
      };

      // Handle the case where there might not be a vote
      const voteType = voteResponse.data?.vote_type;
      const validatedVoteType = isValidVoteType(voteType) ? voteType : null;

      const postWithAuthorAndVote: PostWithAuthorAndVote = {
        id: postResponse.data.id,
        community_id: postResponse.data.community_id,
        user_id: postResponse.data.user_id,
        title: postResponse.data.title,
        content: postResponse.data.content,
        description: postResponse.data.description,
        type: postResponse.data.type as PostType,
        upvotes: postResponse.data.upvotes || 0,
        downvotes: postResponse.data.downvotes || 0,
        created_at: postResponse.data.created_at,
        updated_at: postResponse.data.updated_at,
        author: {
          id: postResponse.data.author.id,
          username: postResponse.data.author.username,
          profile_picture: postResponse.data.author.profile_picture,
        },
        userVote: validatedVoteType,
      };

      set({ currentPost: postWithAuthorAndVote, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  createPost: async (
    post: Omit<
      Post,
      "id" | "created_at" | "updated_at" | "upvotes" | "downvotes"
    >
  ) => {
    const supabase = createClient();
    const { createNotification } = useNotificationStore.getState();
    set({ loading: true, error: null });

    try {
      const postData = {
        community_id: post.community_id,
        user_id: post.user_id,
        title: post.title,
        content: post.content,
        description: post.description,
        type: post.type,
      };

      const { data, error } = await supabase
        .from("posts")
        .insert([postData])
        .select(
          `
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
        `
        )
        .single();

      if (error) throw error;

      // Get community members to notify them about the new post
      const { data: communityMembers, error: membersError } = await supabase
        .from('community_members')
        .select('user_id')
        .eq('community_id', post.community_id)
        .neq('user_id', post.user_id); // Don't notify the author

      if (membersError) {
        console.error('Error fetching community members:', membersError);
      } else if (communityMembers && communityMembers.length > 0) {
        // Notify community members about the new post
        const communityName = data.community?.name || 'a community';
        
        // Create notifications in parallel
        const notificationPromises = communityMembers.map(member => 
          createNotification({
            user_id: member.user_id,
            content: `New post in ${communityName}: "${data.title.substring(0, 50)}"`,
            notification_type: 'new_post',
            related_id: data.id.toString(),
            is_public: false
          })
        );
        
        // Wait for all notifications to be created
        await Promise.allSettled(notificationPromises);
      }

      const newPost: PostWithAuthorAndVote = {
        id: data.id,
        community_id: data.community_id,
        user_id: data.user_id,
        title: data.title,
        content: data.content,
        description: data.description,
        type: data.type as PostType,
        created_at: data.created_at,
        updated_at: data.updated_at,
        upvotes: data.upvotes,
        downvotes: data.downvotes,
        author: {
          id: data.author.id,
          username: data.author.username,
          profile_picture: data.author.profile_picture,
        },
        community: data.community ? {
          name: data.community.name,
          banner_picture: data.community.banner_picture,
        } : undefined,
        userVote: null,
      };

      set((state) => ({
        posts: [newPost, ...state.posts],
        loading: false,
      }));
    } catch (error) {
      console.error("Error in createPost:", error);
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  updatePost: async (postId: number, updates: Partial<Post>) => {
    const supabase = createClient();
    const { createNotification } = useNotificationStore.getState();
    set({ loading: true, error: null });

    try {
      const safeUpdates = {
        ...updates,
        content: updates.content ?? undefined,
        description: updates.description ?? undefined,
      };

      // Fetch the original post to get community info
      const { data: originalPost, error: fetchError } = await supabase
        .from("posts")
        .select(`
          community_id,
          user_id
        `)
        .eq("id", postId)
        .single();

      if (fetchError) throw fetchError;

      const { data, error } = await supabase
        .from("posts")
        .update(safeUpdates)
        .eq("id", postId)
        .select(
          `
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
        `
        )
        .single();

      if (error) throw error;

      // Get community members to notify them about the updated post
      if (originalPost.community_id) {
        const { data: communityMembers, error: membersError } = await supabase
          .from('community_members')
          .select('user_id')
          .eq('community_id', originalPost.community_id)
          .neq('user_id', originalPost.user_id); // Don't notify the author

        if (membersError) {
          console.error('Error fetching community members:', membersError);
        } else if (communityMembers && communityMembers.length > 0) {
          // Create notifications in parallel
          const notificationPromises = communityMembers.map(member => 
            createNotification({
              user_id: member.user_id,
              content: `Post updated in ${data.community.name}: "${data.title.substring(0, 50)}"`,
              notification_type: 'post_updated',
              related_id: data.id.toString(),
              is_public: false
            })
          );
          
          // Wait for all notifications to be created
          await Promise.allSettled(notificationPromises);
        }
      }

      const updatedPost: PostWithAuthorAndVote = {
        id: data.id,
        community_id: data.community_id,
        user_id: data.user_id,
        title: data.title,
        content: data.content,
        description: data.description,
        type: data.type as PostType,
        upvotes: data.upvotes || 0,
        downvotes: data.downvotes || 0,
        created_at: data.created_at,
        updated_at: data.updated_at,
        author: {
          id: data.author.id,
          username: data.author.username,
          profile_picture: data.author.profile_picture,
        },
        community: {
          name: data.community.name,
          banner_picture: data.community.banner_picture,
        },
        userVote: get().posts.find((p) => p.id === postId)?.userVote || null,
      };

      set((state) => ({
        posts: state.posts.map((post) =>
          post.id === postId ? updatedPost : post
        ),
        currentPost:
        state.currentPost?.id === postId ? updatedPost : state.currentPost,
      loading: false,
    }));
  } catch (error) {
    set({ error: (error as Error).message, loading: false });
  }
},

deletePost: async (postId: number) => {
  const supabase = createClient();
  const { createNotification } = useNotificationStore.getState();
  set({ loading: true, error: null });
  
  try {
    // First fetch post details before deleting
    const { data: postToDelete, error: fetchError } = await supabase
      .from("posts")
      .select(`
        id,
        title,
        user_id,
        community_id,
        community:community!posts_community_id_fkey (
          name
        )
      `)
      .eq("id", postId)
      .single();
      
    if (fetchError) throw fetchError;
    
    // Now delete the post
    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId);

    if (error) throw error;

    // Get community moderators or admins to notify them about the deleted post
    if (postToDelete.community_id) {
      const { data: communityModerators, error: modsError } = await supabase
        .from('community_members')
        .select('user_id')
        .eq('community_id', postToDelete.community_id)
        .in('role', ['moderator', 'admin']);

      if (modsError) {
        console.error('Error fetching community moderators:', modsError);
      } else if (communityModerators && communityModerators.length > 0) {
        const communityName = postToDelete.community?.name || 'a community';
        
        // Create notifications for moderators
        const notificationPromises = communityModerators.map(mod => 
          createNotification({
            user_id: mod.user_id,
            content: `Post deleted in ${communityName}: "${postToDelete.title.substring(0, 50)}"`,
            notification_type: 'post_deleted',
            related_id: postToDelete.id.toString(),
            is_public: false
          })
        );
        
        await Promise.allSettled(notificationPromises);
      }
    }

    set((state) => ({
      posts: state.posts.filter((post) => post.id !== postId),
      currentPost:
        state.currentPost?.id === postId ? null : state.currentPost,
      loading: false,
    }));
  } catch (error) {
    set({ error: (error as Error).message, loading: false });
  }
},

votePost: async (postId: number, voteType: "upvote" | "downvote") => {
  const supabase = createClient();
  const { createReputationEntry } = useReputationStore.getState();
  const { createNotification } = useNotificationStore.getState();
  set({ loading: true, error: null });

  try {
    // Get the current user's ID
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error("User not authenticated");

    // Fetch the post's author and details
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("user_id, title, author:users!posts_user_id_fkey (username)")
      .eq("id", postId)
      .single();
    if (postError) throw postError;
    if (!post) throw new Error("Post not found");

    const postAuthorId = post.user_id;
    
    // Don't continue if the user is voting on their own post
    if (postAuthorId === user.id) {
      set({ loading: false });
      return;
    }

    // Remove any existing vote
    const { data: existingVote } = await supabase
      .from("post_votes")
      .select("vote_type")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .single();

    await supabase
      .from("post_votes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id);

    // Determine reputation change
    let reputationChange = 0;
    let reputationReason = "";
    let shouldNotify = false;
    let notificationContent = "";

    if (!existingVote) {
      // First time voting
      reputationChange = voteType === "upvote" ? 1 : -1;
      reputationReason = voteType === "upvote" 
        ? "Received an upvote on post" 
        : "Received a downvote on post";
      
      // Only notify about upvotes, not downvotes (to avoid negative experiences)
      shouldNotify = voteType === "upvote";
      if (shouldNotify) {
        notificationContent = `${user.user_metadata?.username || 'Someone'} upvoted your post: "${post.title.substring(0, 50)}"`;
      }
    } else {
      // Changing vote type
      if (existingVote.vote_type === "upvote" && voteType === "downvote") {
        reputationChange = -2; // Undo +1 and apply -1
        reputationReason = "Vote changed from upvote to downvote";
        // No notification for changing to downvote
      } else if (existingVote.vote_type === "downvote" && voteType === "upvote") {
        reputationChange = 2; // Undo -1 and apply +1
        reputationReason = "Vote changed from downvote to upvote";
        shouldNotify = true; 
        notificationContent = `${user.user_metadata?.username || 'Someone'} changed their vote to an upvote on your post: "${post.title.substring(0, 50)}"`;
      }
    }

    // Insert new vote
    const { error: voteError } = await supabase.from("post_votes").insert([
      {
        post_id: postId,
        user_id: user.id,
        vote_type: voteType,
      },
    ]);
    if (voteError) throw voteError;

    // Add reputation change if applicable
    if (reputationChange !== 0) {
      await createReputationEntry({
        user_id: postAuthorId,
        changed_by: user.id,
        change_value: reputationChange,
        reason: `${reputationReason}: "${post.title.substring(0, 50)}"`,
      });
    }
    
    // Create notification for the post author
    if (shouldNotify) {
      await createNotification({
        user_id: postAuthorId,
        content: notificationContent,
        notification_type: 'post_upvote',
        related_id: postId.toString(),
        is_public: false
      });
    }

    // Update local state
    set((state) => ({
      posts: state.posts.map((post) => {
        if (post.id === postId) {
          const oldVote = post.userVote;
          return {
            ...post,
            userVote: voteType,
            upvotes:
              voteType === "upvote"
                ? post.upvotes + 1
                : oldVote === "upvote"
                ? post.upvotes - 1
                : post.upvotes,
            downvotes:
              voteType === "downvote"
                ? post.downvotes + 1
                : oldVote === "downvote"
                ? post.downvotes - 1
                : post.downvotes,
          };
        }
        return post;
      }),
      currentPost:
        state.currentPost?.id === postId
          ? {
              ...state.currentPost,
              userVote: voteType,
              upvotes:
                voteType === "upvote"
                  ? state.currentPost.upvotes + 1
                  : state.currentPost.userVote === "upvote"
                  ? state.currentPost.upvotes - 1
                  : state.currentPost.upvotes,
              downvotes:
                voteType === "downvote"
                  ? state.currentPost.downvotes + 1
                  : state.currentPost.userVote === "downvote"
                  ? state.currentPost.downvotes - 1
                  : state.currentPost.downvotes,
            }
          : state.currentPost,
      loading: false,
    }));
  } catch (error) {
    set({ error: (error as Error).message, loading: false });
  }
},

removeVote: async (postId: number) => {
  const supabase = createClient();
  const { createReputationEntry } = useReputationStore.getState();
  set({ loading: true, error: null });

  try {
    // Get the current user's ID
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error("User not authenticated");

    // Fetch the post's details to get the author
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("user_id, title")
      .eq("id", postId)
      .single();
    if (postError) throw postError;
    if (!post) throw new Error("Post not found");

    // Find the existing vote
    const { data: existingVote, error: voteError } = await supabase
      .from("post_votes")
      .select("vote_type")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .single();
    if (voteError && voteError.code !== 'PGRST116') throw voteError; // Ignore "no rows returned" error

    // Remove the vote
    const { error } = await supabase
      .from("post_votes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id);

    if (error) throw error;

    // Adjust reputation if there was a previous vote
    if (existingVote) {
      const reputationChange = existingVote.vote_type === "upvote" ? -1 : 1;
      await createReputationEntry({
        user_id: post.user_id,
        changed_by: user.id,
        change_value: reputationChange,
        reason: `Vote removed from post: "${post.title.substring(0, 50)}"`,
      });
    }

    // Update local state
    set((state) => ({
      posts: state.posts.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            userVote: null,
            upvotes:
              post.userVote === "upvote" ? post.upvotes - 1 : post.upvotes,
            downvotes:
              post.userVote === "downvote"
                ? post.downvotes - 1
                : post.downvotes,
          };
        }
        return post;
      }),
      currentPost:
        state.currentPost?.id === postId
          ? {
              ...state.currentPost,
              userVote: null,
              upvotes:
                state.currentPost.userVote === "upvote"
                  ? state.currentPost.upvotes - 1
                  : state.currentPost.upvotes,
              downvotes:
                state.currentPost.userVote === "downvote"
                  ? state.currentPost.downvotes - 1
                  : state.currentPost.downvotes,
            }
          : state.currentPost,
      loading: false,
    }));
  } catch (error) {
    set({ error: (error as Error).message, loading: false });
  }
},
}));