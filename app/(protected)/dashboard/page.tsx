import { Post } from "@/components/post";
import { RecentPosts } from "@/components/recent-posts";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@/components/ui/breadcrumb";

import { Separator } from "@/components/ui/separator";
import {  SidebarTrigger } from "@/components/ui/sidebar";

export default function Page() {
  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <main className="grid gap-4 p-4 w-full grid-cols-1 md:grid-cols-4 lg:grid-cols-8">
        {/* Main content area - full width on mobile, 3/4 on tablet, 5/8 on desktop */}
        <div className="col-span-1 md:col-span-3 lg:col-span-5 space-y-4">
          <Post
            id={1}
            roomId={123}
            userId="anujb"
            title="Welcome to Synapse!"
            content="https://images.pexels.com/photos/27495274/pexels-photo-27495274/free-photo-of-the-ocean-and-a-beach.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
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

        {/* Sidebar - hidden on mobile, 1/4 on tablet, 3/8 on desktop */}
        <div className="col-span-1 md:col-span-1 lg:col-span-3">
          <div className="sticky top-4">
            <RecentPosts />
          </div>
        </div>
      </main>
    </>
  );
}