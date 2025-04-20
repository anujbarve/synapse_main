// app/connections/blocked/page.tsx
"use client";

import { useEffect } from "react";
import { useUserStore } from "@/stores/user_store";
import { BlockedUsers } from "@/components/account/blocked-users";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SocialNav } from "@/components/account/social-nav";
import { redirect } from "next/navigation";

export default function BlockedUsersPage() {
  const { user, loading } = useUserStore();
  
  useEffect(() => {
    if (!loading && !user) {
      redirect("/login");
    }
  }, [user, loading]);
  
  if (loading || !user) {
    return <div className="container mx-auto p-6 flex justify-center">Loading...</div>;
  }
  
  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Blocked Users</h1>
        <SocialNav />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Blocked Users</CardTitle>
          <CardDescription>
            Blocked users cannot see your profile, send you messages, or interact with your content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BlockedUsers userId={user.id} />
        </CardContent>
      </Card>
    </div>
  );
}