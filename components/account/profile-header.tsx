// components/social/profile-header.tsx
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConnectionButton } from "./connection-button";
import { ConnectionStats } from "./connection-stats";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useUserStore } from "@/stores/user_store";

interface ProfileHeaderProps {
  profile: {
    id: string;
    username: string;
    email?: string;
    bio?: string | null;
    profile_picture?: string | null;
    location?: string | null;
    created_at?: string | null;
    reputation?: number;
    post_count?: number;
    comment_count?: number;
  };
  isLoading?: boolean;
}

export function ProfileHeader({ profile, isLoading = false }: ProfileHeaderProps) {
  const { user: currentUser } = useUserStore();
  const isOwnProfile = currentUser?.id === profile.id;
  
  if (isLoading) {
    return (
      <Card className="overflow-hidden border-none bg-background/60 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex flex-col items-center space-y-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-2 text-center">
              <Skeleton className="h-6 w-40 mx-auto" />
              <Skeleton className="h-4 w-60 mx-auto" />
            </div>
            <div className="flex justify-around w-full">
              <Skeleton className="h-12 w-16" />
              <Skeleton className="h-12 w-16" />
              <Skeleton className="h-12 w-16" />
            </div>
            <Skeleton className="h-10 w-full max-w-xs" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-none bg-background/60 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src={profile.profile_picture || ""} alt={profile.username} />
            <AvatarFallback className="text-lg">
              {profile.username?.slice(0, 2).toUpperCase() || "??"}
            </AvatarFallback>
          </Avatar>
          
          <div className="space-y-1 text-center">
            <h2 className="text-xl font-semibold">{profile.username}</h2>
          </div>
          
          <div className="grid grid-cols-4 w-full gap-2 text-center">
            <div className="flex flex-col items-center">
              <span className="text-lg font-semibold">{profile.post_count || 0}</span>
              <span className="text-xs text-muted-foreground">Posts</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-semibold">{profile.comment_count || 0}</span>
              <span className="text-xs text-muted-foreground">Comments</span>
            </div>
            <ConnectionStats userId={profile.id} variant="compact" />
            <div className="flex flex-col items-center">
              <span className="text-lg font-semibold">{profile.reputation || 0}</span>
              <span className="text-xs text-muted-foreground">Reputation</span>
            </div>
          </div>
          
          <div className="flex w-full gap-2">
            {!isOwnProfile && (
              <>
                <Link href={``}>
                <ConnectionButton   
                  targetUserId={profile.id} 
                  targetUsername={profile.username} 
                  variant="responsive"
                />
                </Link>
                <Link href={`/chat/${profile.id}`} className="w-full">
                <Button variant="outline" className="flex-1">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  <span>Message</span>
                </Button>
                </Link>
              </>
            )}
            {isOwnProfile && (
              <Link href="/settings/profile" className="w-full">
                <Button variant="outline" className="w-full">Edit Profile</Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}