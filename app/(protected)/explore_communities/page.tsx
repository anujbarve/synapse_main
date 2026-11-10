import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ExploreCommunitiesGrid } from "@/components/community/explore-communities-grid";
import { createClient } from "@/utils/supabase/server";
import type { Community } from "@/types/custom";

export default async function Page() {
  const supabase = await createClient();

  const [communitiesResult, userResult] = await Promise.all([
    supabase
      .from("community")
      .select()
      .order("created_at", { ascending: false }),
    supabase.auth.getUser(),
  ]);

  const user = userResult.data.user;
  let memberCommunityIds: number[] = [];
  if (user) {
    const { data: memberships } = await supabase
      .from("community_members")
      .select("community_id")
      .eq("user_id", user.id);
    memberCommunityIds = (memberships ?? []).map((m) => m.community_id);
  }

  const communities: Community[] = communitiesResult.data ?? [];
  const error = communitiesResult.error?.message ?? null;

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">Communities</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Explore Communities</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <main className="grid w-full gap-4 p-4">
        {error ? (
          <div>Error: {error}</div>
        ) : (
          <ExploreCommunitiesGrid
            communities={communities}
            memberCommunityIds={memberCommunityIds}
          />
        )}
      </main>
    </>
  );
}
