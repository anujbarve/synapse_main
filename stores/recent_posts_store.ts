
import { create } from 'zustand';
import { createClient } from "@/utils/supabase/client";

export interface RecentPost {
  id: number;
  title: string;
  created_at: string;
  upvotes: number;
  downvotes: number;
  user_id: string;
  author: {
    id : string;
    username: string;
    profile_picture: string | null;
  };
  _count: {
    comments: number;
  };
}

interface RecentPostsStore {
  posts: RecentPost[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  currentPage: number;
  postsPerPage: number;

  // Actions
  fetchRecentPosts: (page?: number) => Promise<void>;
  resetPosts: () => void;
  setCurrentPage: (page: number) => void;
}

export const useRecentPostsStore = create<RecentPostsStore>((set, get) => ({
  posts: [],
  loading: false,
  error: null,
  hasMore: true,
  currentPage: 1,
  postsPerPage: 4,

  fetchRecentPosts: async (page = 1) => {
    const { postsPerPage, posts: existingPosts } = get();
    const supabase = createClient();
    
    set({ loading: true, error: null });

    try {
      const from = (page - 1) * postsPerPage;
      const to = from + postsPerPage - 1;

      const { data: postsData, error: postsError } = await supabase
        .from('posts')
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
        .order('created_at', { ascending: false })
        .range(from, to);

      if (postsError) throw postsError;

      const formattedPosts = postsData.map(post => ({
        ...post,
        _count: {
          comments: post.comments?.[0]?.count || 0
        }
      }));

      set((state) => ({
        posts: page === 1 ? formattedPosts : [...state.posts, ...formattedPosts],
        hasMore: formattedPosts.length === postsPerPage,
        currentPage: page,
        loading: false,
      }));
    } catch (error) {
      console.error('Error fetching recent posts:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch posts',
        loading: false 
      });
    }
  },

  resetPosts: () => {
    set({
      posts: [],
      loading: false,
      error: null,
      hasMore: true,
      currentPage: 1,
    });
  },

  setCurrentPage: (page: number) => {
    set({ currentPage: page });
  },
}));

// stores/recent_posts_store.ts
// Add these utility functions to the store

// Selector hooks
export const useRecentPosts = () => useRecentPostsStore((state) => state.posts);
export const useRecentPostsLoading = () => useRecentPostsStore((state) => state.loading);
export const useRecentPostsError = () => useRecentPostsStore((state) => state.error);
export const useRecentPostsHasMore = () => useRecentPostsStore((state) => state.hasMore);

// Action hooks
export const useRecentPostsActions = () => {
  const fetchRecentPosts = useRecentPostsStore((state) => state.fetchRecentPosts);
  const resetPosts = useRecentPostsStore((state) => state.resetPosts);
  const setCurrentPage = useRecentPostsStore((state) => state.setCurrentPage);

  return {
    fetchRecentPosts,
    resetPosts,
    setCurrentPage,
  };
};