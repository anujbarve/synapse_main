import { PostFeed } from "@/components/post/post-feed";
import { RecentPosts } from "@/components/recent-posts";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  getErrorMessage,
  loadAllPosts,
  loadRecentPostsPage,
} from "@/lib/post-data";
import type { PostWithAuthorAndVote } from "@/stores/post_store";
import type { RecentPost } from "@/lib/post-data";
import { createClient } from "@/utils/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  let posts: PostWithAuthorAndVote[] = [];
  let postsError: string | null = null;
  try {
    posts = await loadAllPosts(supabase);
  } catch (error) {
    console.error("Error fetching all posts:", error);
    postsError = getErrorMessage(error);
  }

  let recentPosts: RecentPost[] = [];
  let recentHasMore = false;
  let recentError: string | null = null;
  try {
    const firstPage = await loadRecentPostsPage(supabase, 1);
    recentPosts = firstPage.posts;
    recentHasMore = firstPage.hasMore;
  } catch (error) {
    console.error("Error fetching recent posts:", error);
    recentError = getErrorMessage(error);
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <main className="grid gap-4 p-4 w-full grid-cols-1 md:grid-cols-4 lg:grid-cols-8">
        <div className="col-span-1 md:col-span-3 lg:col-span-5 space-y-4">
          <PostFeed posts={posts} error={postsError} />
        </div>

        <div className="col-span-1 md:col-span-1 lg:col-span-3">
          <RecentPosts
            initialPosts={recentPosts}
            initialHasMore={recentHasMore}
            initialError={recentError}
          />
        </div>
      </main>
    </>
  );
}
