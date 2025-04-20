// app/connections/page.tsx
"use client";

import { useEffect } from "react";
import { useUserStore } from "@/stores/user_store";
import { FriendsList } from "@/components/account/connection-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SocialNav } from "@/components/account/social-nav";
import { redirect } from "next/navigation";

export default function ConnectionsPage() {
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
        <h1 className="text-2xl font-bold">Connections</h1>
        <SocialNav />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Friends</CardTitle>
            </CardHeader>
            <CardContent>
              <FriendsList userId={user.id} isOwnProfile={true} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}