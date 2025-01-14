import { CommunityBanner } from "@/components/community-banner";
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
                <BreadcrumbLink href="#">Communities</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Design Engineering</BreadcrumbPage>
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
            {/* <CommunityInfoCard /> */}
          </div>

          {/* Main Content Area */}
          <div className="col-span-1 md:col-span-3 md:order-1 lg:col-span-5 space-y-4">
            
            {/* Posts */}
            <div className="space-y-4">
              <CommunityBanner></CommunityBanner>
              <CommunityBanner></CommunityBanner>
              <CommunityBanner></CommunityBanner>
              <CommunityBanner></CommunityBanner>
              <CommunityBanner></CommunityBanner>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}