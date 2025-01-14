import { DetailedPost } from "@/components/post-detailed";
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
  
        <main className="p-4">
          <div>
            <DetailedPost
                        id={1}
                        roomId={123}
                        userId="anujb"
                        title="Welcome to Synapse!"
                        content="https://images.pexels.com/photos/1148820/pexels-photo-1148820.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                        type="Image"
                        upvotes={150}
                        downvotes={20}
                        createdAt="2025-01-13T10:00:00Z" comments={[
                            { id: 1, userId: "",content: "", createdAt: "" }
                        ]}            ></DetailedPost>
          </div>
        </main>
      </>
    );
  }
  