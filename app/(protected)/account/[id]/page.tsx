// app/profile/[username]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useUserProfileStore } from "@/stores/social_store";
import { useUserStore } from "@/stores/user_store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileHeader } from "@/components/account/profile-header";
import { FriendsList } from "@/components/account/connection-list";
import { FriendRequests } from "@/components/account/connection-request";
import { ActivityFeed } from "@/components/account/activity-feed";
import { PostsSection } from "@/components/account/post_section";
import { Separator } from "@/components/ui/separator";

// Define a type that matches what ProfileHeader expects
type ProfileHeaderProps = {
  id: string;
  username: string;
  email?: string;
  bio?: string | null;
  profile_picture?: string | null;
  location?: string | null;
  created_at?: string | null;
  reputation?: number; // Note: not null
  post_count?: number;
  comment_count?: number;
};

export default function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { profile, fetchUserProfile } = useUserProfileStore();
  const { user: currentUser } = useUserStore(); // Get the current authenticated user
  const [isLoading, setIsLoading] = useState(true);
  const [username, setusername] = useState<string | null>(null);
  
  useEffect(() => {
    async function getParams() {
      const resolvedParams = await params;
      setusername(resolvedParams.id);
    }
    getParams();
  }, [params]);

  useEffect(() => {
    if(!username) return; 
    setIsLoading(true);
    fetchUserProfile(username);
    setIsLoading(false);
  }, [username, fetchUserProfile]);

  // Check if the current user is viewing their own profile
  // This is the correct way to determine if it's the user's own profile
  const isOwnProfile = currentUser?.id === profile?.id;

  // Convert profile to the expected format for ProfileHeader
  const headerProfile: ProfileHeaderProps = profile 
    ? {
        id: profile.id,
        username: profile.username,
        email: profile.email,
        bio: profile.bio,
        profile_picture: profile.profile_picture,
        created_at: profile.created_at,
        // Convert null to undefined for reputation
        reputation: profile.reputation !== null ? profile.reputation : undefined,
        post_count: profile.post_count,
        comment_count: profile.comment_count
      }
    : { id: '', username: '' };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left sidebar */}
        <div className="md:col-span-1 space-y-6">
          <ProfileHeader profile={headerProfile} isLoading={isLoading} />
          
          {isOwnProfile && !isLoading && profile && (
            <FriendRequests userId={profile.id} compact />
          )}
          
          {!isLoading && profile && (
            <FriendsList userId={profile.id} isOwnProfile={isOwnProfile} compact />
          )}
        </div>
        
        {/* Main content */}
        <div className="md:col-span-2 space-y-6">
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
            </TabsList>
            
            <TabsContent value="posts" className="mt-6">
              {isOwnProfile && (
                <ActivityFeed />
              )}
              
              <div className="mt-6">
                <h2 className="text-lg font-semibold mb-4">
                  {isOwnProfile ? "Your Posts" : `${profile?.username}'s Posts`}
                </h2>
                <Separator className="mb-6" />
                {!isLoading && profile && (
                  <PostsSection username={profile.username} />
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="about" className="mt-6">
              <div className="bg-card rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">About</h2>
                <Separator className="mb-6" />
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Bio</h3>
                    <p className="mt-1">{profile?.bio || "No bio provided"}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                    <p className="mt-1">{profile?.email || "No email provided"}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Joined</h3>
                    <p className="mt-1">
                      {profile?.created_at 
                        ? new Date(profile.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : "Unknown"
                      }
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}