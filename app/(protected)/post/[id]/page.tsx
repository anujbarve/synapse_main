import { DetailedPost } from "@/components/post/detailed-post";
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
import { getErrorMessage, loadPostDetail } from "@/lib/post-data";
import { createClient } from "@/utils/supabase/server";

const ErrorDisplay = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center p-8">
    <h2 className="text-xl font-semibold text-red-500">Error</h2>
    <p className="text-gray-600">{message}</p>
  </div>
);

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const postId = Number(id);

  let detail: Awaited<ReturnType<typeof loadPostDetail>> = null;
  let errorMessage: string | null = null;
  if (Number.isInteger(postId)) {
    try {
      detail = await loadPostDetail(await createClient(), postId);
    } catch (error) {
      console.error("Error loading post and comments:", error);
      errorMessage = getErrorMessage(error);
    }
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{detail?.post.title || "Post"}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <main className="p-4">
        <div className="container mx-auto max-w-7xl">
          {errorMessage ? (
            <ErrorDisplay message={errorMessage} />
          ) : detail ? (
            <DetailedPost post={detail.post} comments={detail.comments} />
          ) : (
            <ErrorDisplay message="Post not found" />
          )}
        </div>
      </main>
    </>
  );
}
