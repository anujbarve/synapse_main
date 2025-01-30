import { Database } from "./supabase";

export type Community = Database["public"]["Tables"]["community"]["Row"]

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
}