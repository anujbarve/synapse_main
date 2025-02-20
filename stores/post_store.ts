// postStore.ts
import { create } from 'zustand';
import { createClient } from "@/utils/supabase/client";

export type PostType = 'Text' | 'Link' | 'Image' | 'Video';

export interface Post {
  id: number;
  community_id: number;
  user_id: string;
  title: string;
  content: string | null;
  type: PostType;
  upvotes: number;
  downvotes: number;
  created_at: string;
  updated_at: string;
}

export interface PostWithAuthor extends Post {
  author: {
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
  vote_type: 'upvote' | 'downvote';
  created_at: string;
}

export interface PostWithAuthorAndVote extends PostWithAuthor {
  userVote?: 'upvote' | 'downvote' | null;
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
  createPost: (post: Omit<Post, 'id' | 'created_at' | 'updated_at' | 'upvotes' | 'downvotes'>) => Promise<void>;
  updatePost: (postId: number, updates: Partial<Post>) => Promise<void>;
  deletePost: (postId: number) => Promise<void>;
  votePost: (postId: number, voteType: 'upvote' | 'downvote') => Promise<void>;
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
        .from('users')
        .select('id')
        .eq('username', username)
        .single();

      if (userError) throw userError;
      if (!userData) throw new Error('User not found');

      // Then fetch all posts by this user
      const [postsResponse, votesResponse] = await Promise.all([
        supabase
          .from('posts')
          .select(`
            *,
            author:users!posts_user_id_fkey (
              username,
              profile_picture
            ),
            community:community!posts_community_id_fkey (
              name,
              banner_picture
            )
          `)
          .eq('user_id', userData.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('post_votes')
          .select('*')
      ]);

      if (postsResponse.error) throw postsResponse.error;
      if (votesResponse.error) throw votesResponse.error;

      const isValidVoteType = (type: string | null | undefined): type is 'upvote' | 'downvote' => {
        return type === 'upvote' || type === 'downvote';
      };
      
      const postsWithAuthorAndVotes: PostWithAuthorAndVote[] = postsResponse.data.map((post: any) => {
        const voteType = votesResponse.data?.find(vote => vote.post_id === post.id)?.vote_type;
        
        return {
          id: post.id,
          community_id: post.community_id,
          user_id: post.user_id,
          title: post.title,
          content: post.content,
          type: post.type as PostType,
          upvotes: post.upvotes || 0,
          downvotes: post.downvotes || 0,
          created_at: post.created_at,
          updated_at: post.updated_at,
          author: {
            username: post.author.username,
            profile_picture: post.author.profile_picture,
          },
          community: post.community ? {
            name: post.community.name,
            banner_picture: post.community.banner_picture,
          } : undefined,
          userVote: isValidVoteType(voteType) ? voteType : null
        };
      });

      set({ 
        userPosts: postsWithAuthorAndVotes, 
        userPostsLoading: false 
      });
    } catch (error) {
      console.error('Error fetching user posts:', error);
      set({ 
        userPostsError: (error as Error).message, 
        userPostsLoading: false 
      });
    }
  },

  setCurrentPost: (post) => set({ currentPost: post }),

  fetchUserVotes: async () => {
    const supabase = createClient();
    try {
      const { data: userVotes, error } = await supabase
        .from('post_votes')
        .select('*');

      if (error) throw error;

      const isValidVoteType = (type: string): type is 'upvote' | 'downvote' => {
        return type === 'upvote' || type === 'downvote';
      };

      set((state) => ({
        posts: state.posts.map(post => {
          const voteType = userVotes?.find(vote => vote.post_id === post.id)?.vote_type;
          return {
            ...post,
            userVote: voteType && isValidVoteType(voteType) ? voteType : null
          };
        })
      }));
    } catch (error) {
      console.error('Error fetching user votes:', error);
    }
  },

  fetchAllPosts: async () => {
    const supabase = createClient();
    set({ loading: true, error: null });
    try {
      const [postsResponse, votesResponse] = await Promise.all([
        supabase
          .from('posts')
          .select(`
            *,
            author:users!posts_user_id_fkey (
              username,
              profile_picture
            ),
            community:community!posts_community_id_fkey (
              name,
              banner_picture
            )
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('post_votes')
          .select('*')
      ]);

      if (postsResponse.error) throw postsResponse.error;
      if (votesResponse.error) throw votesResponse.error;

      const isValidVoteType = (type: string | null | undefined): type is 'upvote' | 'downvote' => {
        return type === 'upvote' || type === 'downvote';
      };
      
      const postsWithAuthorAndVotes: PostWithAuthorAndVote[] = postsResponse.data.map((post: any) => {
        const voteType = votesResponse.data?.find(vote => vote.post_id === post.id)?.vote_type;
        
        return {
          id: post.id,
          community_id: post.community_id,
          user_id: post.user_id,
          title: post.title,
          content: post.content,
          type: post.type as PostType,
          upvotes: post.upvotes || 0,
          downvotes: post.downvotes || 0,
          created_at: post.created_at,
          updated_at: post.updated_at,
          author: {
            username: post.author.username,
            profile_picture: post.author.profile_picture,
          },
          community: {
            name: post.community.name,
            banner_picture: post.community.banner_picture,
          },
          userVote: isValidVoteType(voteType) ? voteType : null
        };
      });

      set({ posts: postsWithAuthorAndVotes, loading: false });
    } catch (error) {
      console.error('Error fetching all posts:', error);
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchPosts: async (communityId: number) => {
    const supabase = createClient();
    set({ loading: true, error: null });
    try {
      const [postsResponse, votesResponse] = await Promise.all([
        supabase
          .from('posts')
          .select(`
            *,
            author:users!posts_user_id_fkey (
              username,
              profile_picture
            ),
            community:community!posts_community_id_fkey (
              name,
              banner_picture
            )
          `)
          .eq('community_id', communityId)
          .order('created_at', { ascending: false }),
        supabase
          .from('post_votes')
          .select('*')
      ]);

      if (postsResponse.error) throw postsResponse.error;
      if (votesResponse.error) throw votesResponse.error;

      const isValidVoteType = (type: string | null | undefined): type is 'upvote' | 'downvote' => {
        return type === 'upvote' || type === 'downvote';
      };
      
      const postsWithAuthorAndVotes: PostWithAuthorAndVote[] = postsResponse.data.map((post: any) => {
        const voteType = votesResponse.data?.find(vote => vote.post_id === post.id)?.vote_type;
        
        return {
          id: post.id,
          community_id: post.community_id,
          user_id: post.user_id,
          title: post.title,
          content: post.content,
          type: post.type as PostType,
          upvotes: post.upvotes || 0,
          downvotes: post.downvotes || 0,
          created_at: post.created_at,
          updated_at: post.updated_at,
          author: {
            username: post.author.username,
            profile_picture: post.author.profile_picture,
          },
          community: {
            name: post.community.name,
            banner_picture: post.community.banner_picture,
          },
          userVote: isValidVoteType(voteType) ? voteType : null
        };
      });

      set({ posts: postsWithAuthorAndVotes, loading: false });
    } catch (error) {
      console.log(error);
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchPostById: async (postId: number) => {
    const supabase = createClient();
    set({ loading: true, error: null });
    try {
      const [postResponse, voteResponse] = await Promise.all([
        supabase
          .from('posts')
          .select(`
            *,
            author:users!posts_user_id_fkey (
              username,
              profile_picture
            )
          `)
          .eq('id', postId)
          .single(),
        supabase
          .from('post_votes')
          .select('*')
          .eq('post_id', postId)
          .single()
      ]);

      if (postResponse.error) throw postResponse.error;
      const isValidVoteType = (type: string | null | undefined): type is 'upvote' | 'downvote' => {
        return type === 'upvote' || type === 'downvote';
      };
      
      const voteType = voteResponse.data?.vote_type;
      const validatedVoteType = isValidVoteType(voteType) ? voteType : null;
      
      const postWithAuthorAndVote: PostWithAuthorAndVote = {
        id: postResponse.data.id,
        community_id: postResponse.data.community_id,
        user_id: postResponse.data.user_id,
        title: postResponse.data.title,
        content: postResponse.data.content,
        type: postResponse.data.type as PostType,
        upvotes: postResponse.data.upvotes || 0,
        downvotes: postResponse.data.downvotes || 0,
        created_at: postResponse.data.created_at,
        updated_at: postResponse.data.updated_at,
        author: {
          username: postResponse.data.author.username,
          profile_picture: postResponse.data.author.profile_picture,
        },
        userVote: validatedVoteType
      };

      set({ currentPost: postWithAuthorAndVote, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  createPost: async (post: Omit<Post, "id" | "created_at" | "updated_at" | "upvotes" | "downvotes">) => {
    const supabase = createClient();
    set({ loading: true, error: null });
    
    try {
      const postData = {
        community_id: post.community_id,
        user_id: post.user_id,
        title: post.title,
        content: post.content || '', 
        type: post.type,
      };

      const { data, error } = await supabase
        .from('posts')
        .insert([postData])
        .select(`
          *,
          author:users!posts_user_id_fkey (
            username,
            profile_picture
          )
        `)
        .single();

      if (error) throw error;

      const newPost: PostWithAuthorAndVote = {
        id: data.id,
        community_id: data.community_id,
        user_id: data.user_id,
        title: data.title,
        content: data.content,
        type: data.type as PostType,
        created_at: data.created_at,
        updated_at: data.updated_at,
        upvotes: data.upvotes,
        downvotes: data.downvotes,
        author: {
          username: data.author.username,
          profile_picture: data.author.profile_picture,
        },
        userVote: null
      };

      set((state) => ({
        posts: [newPost, ...state.posts],
        loading: false,
      }));
    } catch (error) {
      console.error('Error in createPost:', error);
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  updatePost: async (postId: number, updates: Partial<Post>) => {
    const supabase = createClient();
    set({ loading: true, error: null });
  
    try {
      const safeUpdates = {
        ...updates,
        content: updates.content ?? undefined,
      };
  
      const { data, error } = await supabase
        .from('posts')
        .update(safeUpdates)
        .eq('id', postId)
        .select(`
          *,
          author:users!posts_user_id_fkey (
            username,
            profile_picture
          )
        `)
        .single();
  
      if (error) throw error;
  
      const updatedPost: PostWithAuthorAndVote = {
        id: data.id,
        community_id: data.community_id,
        user_id: data.user_id,
        title: data.title,
        content: data.content,
        type: data.type as PostType,
        upvotes: data.upvotes || 0,
        downvotes: data.downvotes || 0,
        created_at: data.created_at,
        updated_at: data.updated_at,
        author: {
          username: data.author.username,
          profile_picture: data.author.profile_picture,
        },
        userVote: get().posts.find(p => p.id === postId)?.userVote || null
      };
  
      set((state) => ({
        posts: state.posts.map((post) =>
          post.id === postId ? updatedPost : post
        ),
        currentPost: state.currentPost?.id === postId ? updatedPost : state.currentPost,
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  deletePost: async (postId: number) => {
    const supabase = createClient();
    set({ loading: true, error: null });
    try {
      const { data,error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      console.log(data);

      if (error) throw error;

      set((state) => ({
        posts: state.posts.filter((post) => post.id !== postId),
        currentPost: state.currentPost?.id === postId ? null : state.currentPost,
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  votePost: async (postId: number, voteType: 'upvote' | 'downvote') => {
    const supabase = createClient();
    set({ loading: true, error: null });

    try {
      // Get the current user's ID
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('User not authenticated');

      // First, remove any existing vote
      await supabase
        .from('post_votes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      // Then insert the new vote
      const { error } = await supabase
        .from('post_votes')
        .insert([{
          post_id: postId,
          user_id: user.id,
          vote_type: voteType,
        }]);

      if (error) throw error;

      // Update local state
      set((state) => ({
        posts: state.posts.map(post => {
          if (post.id === postId) {
            const oldVote = post.userVote;
            return {
              ...post,
              userVote: voteType,
              upvotes: voteType === 'upvote' 
                ? post.upvotes + 1 
                : (oldVote === 'upvote' ? post.upvotes - 1 : post.upvotes),
              downvotes: voteType === 'downvote'
                ? post.downvotes + 1
                : (oldVote === 'downvote' ? post.downvotes - 1 : post.downvotes)
            };
          }
          return post;
        }),
        currentPost: state.currentPost?.id === postId
          ? {
              ...state.currentPost,
              userVote: voteType,
              upvotes: voteType === 'upvote'
                ? state.currentPost.upvotes + 1
                : (state.currentPost.userVote === 'upvote' ? state.currentPost.upvotes - 1 : state.currentPost.upvotes),
              downvotes: voteType === 'downvote'
                ? state.currentPost.downvotes + 1
                : (state.currentPost.userVote === 'downvote' ? state.currentPost.downvotes - 1 : state.currentPost.downvotes)
            }
          : state.currentPost,
        loading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  removeVote: async (postId: number) => {
    const supabase = createClient();
    set({ loading: true, error: null });

    try {
      // Get the current user's ID
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('post_votes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      if (error) throw error;

      set((state) => ({
        posts: state.posts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              userVote: null,
              upvotes: post.userVote === 'upvote' ? post.upvotes - 1 : post.upvotes,
              downvotes: post.userVote === 'downvote' ? post.downvotes - 1 : post.downvotes
            };
          }
          return post;
        }),
        currentPost: state.currentPost?.id === postId
          ? {
              ...state.currentPost,
              userVote: null,
              upvotes: state.currentPost.userVote === 'upvote' ? state.currentPost.upvotes - 1 : state.currentPost.upvotes,
              downvotes: state.currentPost.userVote === 'downvote' ? state.currentPost.downvotes - 1 : state.currentPost.downvotes
            }
          : state.currentPost,
        loading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
}));