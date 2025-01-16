import { CommunityContent } from "@/components/community-component";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const slug = (await params).id;
  return <CommunityContent communityId={slug} />;
}
