// app/connections/blocked/page.tsx
import { BlockedUsers } from "@/components/account/blocked-users";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SocialNav } from "@/components/account/social-nav";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { countReceivedPending, fetchBlocked } from "@/lib/social-server";

export default async function BlockedUsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [blocked, pendingCount] = await Promise.all([
    fetchBlocked(supabase, user.id),
    countReceivedPending(supabase, user.id),
  ]);

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Blocked Users</h1>
        <SocialNav viewerId={user.id} pendingCount={pendingCount} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Blocked Users</CardTitle>
          <CardDescription>
            Blocked users cannot see your profile, send you messages, or interact with your content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BlockedUsers connections={blocked} />
        </CardContent>
      </Card>
    </div>
  );
}
