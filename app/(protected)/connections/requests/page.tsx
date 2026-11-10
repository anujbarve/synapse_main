// app/connections/requests/page.tsx
import { FriendRequests } from "@/components/account/connection-request";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SocialNav } from "@/components/account/social-nav";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { fetchReceivedPending, fetchSentPending } from "@/lib/social-server";

export default async function FriendRequestsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [received, sent] = await Promise.all([
    fetchReceivedPending(supabase, user.id),
    fetchSentPending(supabase, user.id),
  ]);

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Friend Requests</h1>
        <SocialNav viewerId={user.id} pendingCount={received.length} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <FriendRequests userId={user.id} currentUserId={user.id} received={received} sent={sent} />
        </CardContent>
      </Card>
    </div>
  );
}
