// app/connections/requests/page.tsx
"use client";

import { useEffect } from "react";
import { useUserStore } from "@/stores/user_store";
import { FriendRequests } from "@/components/account/connection-request";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SocialNav } from "@/components/account/social-nav";
import { redirect } from "next/navigation";

export default function FriendRequestsPage() {
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
        <h1 className="text-2xl font-bold">Friend Requests</h1>
        <SocialNav />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Manage Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <FriendRequests userId={user.id} />
        </CardContent>
      </Card>
    </div>
  );
}