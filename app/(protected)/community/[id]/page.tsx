import { CommunityInfoCard } from "@/components/community-info-card";
import { CreateCommunity } from "@/components/create-community";
import { Post } from "@/components/post";
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
import { createClient } from "@/utils/supabase/client";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;
  const supabase = await createClient();

  const { data: community } = await supabase
    .from("community")
    .select()
    .eq("id", id)
    .single();

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
                <BreadcrumbPage>{community?.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <main className="grid w-full gap-4 p-4">
        {/* Mobile Layout (< 768px): Stack everything vertically */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4 w-full">
          {/* Community Info Card - Show at top on mobile */}
          <div className="col-span-1 md:col-span-1 md:order-2 lg:col-span-3 md:sticky md:top-4">
            <CommunityInfoCard
              name={community?.name}
              description={community?.description}
              banner_picture={community?.banner_picture}
              created_at={community?.created_at}
              members={""}
              online_members={""}
              ranking={""}
            />
          </div>

          {/* Main Content Area */}
          <div className="col-span-1 md:col-span-3 md:order-1 lg:col-span-5 space-y-4">
            <div className="mb-4">
              <CreateCommunity />
            </div>

            {/* Posts */}
            <div className="space-y-4">
              <Post
                id={1}
                roomId={123}
                userId="anujb"
                title="Welcome to Synapse!"
                content="https://images.pexels.com/photos/27495274/pexels-photo-27495274/free-photo-of-aerial-view-of-the-ocean-and-a-beach.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                type="Image"
                upvotes={150}
                downvotes={20}
                createdAt="2025-01-13T10:00:00Z"
              />
              <Post
                id={2}
                roomId={123}
                userId="anujb"
                title="Welcome to Synapse!"
                content="Hello Guys on Synapse"
                type="Text"
                upvotes={150}
                downvotes={20}
                createdAt="2025-01-13T10:00:00Z"
              />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
