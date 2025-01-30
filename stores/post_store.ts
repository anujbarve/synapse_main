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

// postStore.ts
import { create } from 'zustand';
import { createClient } from "@/utils/supabase/client";

interface PostStore {
  posts: PostWithAuthor[];
  currentPost: PostWithAuthor | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchAllPosts: () => Promise<void>; // Add this new action
  fetchPosts: (communityId: number) => Promise<void>;
  fetchPostById: (postId: number) => Promise<void>;
  createPost: (post: Omit<Post, 'id' | 'created_at' | 'updated_at' | 'upvotes' | 'downvotes'>) => Promise<void>;
  updatePost: (postId: number, updates: Partial<Post>) => Promise<void>;
  deletePost: (postId: number) => Promise<void>;
  upvotePost: (postId: number) => Promise<void>;
  downvotePost: (postId: number) => Promise<void>;
  setCurrentPost: (post: PostWithAuthor | null) => void;
}

export const usePostStore = create<PostStore>((set, get) => ({
  posts: [],
  currentPost: null,
  loading: false,
  error: null,

  setCurrentPost: (post) => set({ currentPost: post }),

  fetchAllPosts: async () => {
    const supabase = createClient();
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
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
        .order('created_at', { ascending: false });

      if (error) throw error;

      const postsWithAuthor: PostWithAuthor[] = data.map((post: any) => ({
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
      }));

      set({ posts: postsWithAuthor, loading: false });
    } catch (error) {
      console.error('Error fetching all posts:', error);
      set({ error: (error as Error).message, loading: false });
    }
  },
  fetchPosts: async (communityId: number) => {
    const supabase = createClient();
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:users!posts_user_id_fkey (
            username,
            profile_picture
          )
        `)
        .eq('community_id', communityId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const postsWithAuthor: PostWithAuthor[] = data.map((post: any) => ({
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
      }));

      set({ posts: postsWithAuthor, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchPostById: async (postId: number) => {
    const supabase = createClient();
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:users!posts_user_id_fkey (
            username,
            profile_picture
          )
        `)
        .eq('id', postId)
        .single();

      if (error) throw error;

      const postWithAuthor: PostWithAuthor = {
        id: data.id,
        community_id: data.community_id,
        user_id: data.user_id,
        title: data.title,
        content: data.content,
        type: data.type as PostType, // Type assertion to ensure it matches PostType
        upvotes: data.upvotes || 0,  // Provide default value
        downvotes: data.downvotes || 0, // Provide default value
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString(),
        author: {
          username: data.author.username,
          profile_picture: data.author.profile_picture,
        },
      };

      set({ currentPost: postWithAuthor, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  createPost: async (post: Omit<Post, "id" | "created_at" | "updated_at" | "upvotes" | "downvotes">) => {
    const supabase = createClient();
    set({ loading: true, error: null });
    
    try {
      // Prepare the post data with required fields
      const postData = {
        community_id: post.community_id,
        user_id: post.user_id,
        title: post.title,
        content: post.content || '', 
        type: post.type,
      };

      console.log('Inserting post with data:', postData);

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

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      const newPost: PostWithAuthor = {
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
      // Ensure content is not null
      const safeUpdates = {
        ...updates,
        content: updates.content ?? undefined, // Convert `null` to `undefined`
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
  
      const updatedPost: PostWithAuthor = {
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
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

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

  upvotePost: async (postId: number) => {
    const supabase = createClient();
    try {
      const { error } = await supabase.rpc('increment_upvotes', { post_id: postId });
  
      if (error) throw error;
  
      set((state) => ({
        posts: state.posts.map((post) =>
          post.id === postId ? { ...post, upvotes: post.upvotes + 1 } : post
        ),
        currentPost: state.currentPost?.id === postId
          ? { ...state.currentPost, upvotes: state.currentPost.upvotes + 1 }
          : state.currentPost,
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  downvotePost: async (postId: number) => {
    const supabase = createClient();
    try {
      const { error } = await supabase.rpc('increment_downvotes', { post_id: postId });
  
      if (error) throw error;
  
      set((state) => ({
        posts: state.posts.map((post) =>
          post.id === postId ? { ...post, downvotes: post.downvotes + 1 } : post
        ),
        currentPost: state.currentPost?.id === postId
          ? { ...state.currentPost, downvotes: state.currentPost.downvotes + 1 }
          : state.currentPost,
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  }
}));