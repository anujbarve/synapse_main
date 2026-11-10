// app/connections/page.tsx
import { FriendsList } from "@/components/account/connection-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SocialNav } from "@/components/account/social-nav";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { countReceivedPending, fetchFriends } from "@/lib/social-server";

export default async function ConnectionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [friends, pendingCount] = await Promise.all([
    fetchFriends(supabase, user.id),
    countReceivedPending(supabase, user.id),
  ]);

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Connections</h1>
        <SocialNav viewerId={user.id} pendingCount={pendingCount} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Friends</CardTitle>
            </CardHeader>
            <CardContent>
              <FriendsList userId={user.id} isOwnProfile={true} connections={friends} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
