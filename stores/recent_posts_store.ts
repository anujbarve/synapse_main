import { createClient } from "@/utils/supabase/client";
import {
  loadRecentPostsPage,
  type RecentPost,
} from "@/lib/post-data";

export type { RecentPost };

// Client-side fetch for the "Show more" button. The first page is loaded on
// the server by the dashboard route and passed to RecentPosts as a prop.
export async function fetchRecentPostsPage(page: number) {
  return loadRecentPostsPage(createClient(), page);
}
