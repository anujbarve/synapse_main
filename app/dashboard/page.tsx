import { AppSidebar } from "@/components/app-sidebar";
import { RedditPost } from "@/components/post";
import { RedditPostDetailed } from "@/components/post-detailed";
import { RecentPosts } from "@/components/recent-posts";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function Page() {

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">
                    Building Your Application
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <main className="grid gap-4 grid-cols-8 p-4">
          <div className="col-span-5">
            <RedditPost></RedditPost>
            <RedditPost></RedditPost>
            <RedditPostDetailed></RedditPostDetailed>
          </div>
          <div className="col-span-3">
            <RecentPosts></RecentPosts>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
