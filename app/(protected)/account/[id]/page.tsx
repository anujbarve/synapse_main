// app/profile/[username]/page.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileHeader } from "@/components/account/profile-header";
import { FriendsList } from "@/components/account/connection-list";
import { FriendRequests } from "@/components/account/connection-request";
import { ActivityFeed } from "@/components/account/activity-feed";
import { PostsSection } from "@/components/account/post_section";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/utils/supabase/server";
import {
  fetchFriends,
  fetchProfile,
  fetchReceivedPending,
  fetchViewerConnection,
} from "@/lib/social-server";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user: viewer },
  } = await supabase.auth.getUser();
  const viewerId = viewer?.id ?? null;

  const profile = await fetchProfile(supabase, id);

  // Check if the current user is viewing their own profile
  const isOwnProfile = profile !== null && viewerId === profile.id;

  const friends = profile ? await fetchFriends(supabase, profile.id) : [];
  const received = profile && isOwnProfile ? await fetchReceivedPending(supabase, profile.id) : [];
  const connection =
    profile && viewerId && viewerId !== profile.id
      ? await fetchViewerConnection(supabase, viewerId, profile.id)
      : null;

  // Connection actions are only offered when a profile exists and it is not the viewer's own
  const headerViewerId = profile ? viewerId : null;

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left sidebar */}
        <div className="md:col-span-1 space-y-6">
          <ProfileHeader
            profile={profile ?? { id: "", username: "" }}
            viewerId={headerViewerId}
            friendCount={friends.length}
            connection={connection}
          />

          {isOwnProfile && profile && (
            <FriendRequests userId={profile.id} currentUserId={viewerId} received={received} compact />
          )}

          {profile && (
            <FriendsList userId={profile.id} isOwnProfile={isOwnProfile} compact connections={friends} />
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
                <ActivityFeed userId={viewerId} />
              )}

              <div className="mt-6">
                <h2 className="text-lg font-semibold mb-4">
                  {isOwnProfile ? "Your Posts" : `${profile?.username}'s Posts`}
                </h2>
                <Separator className="mb-6" />
                {profile && (
                  <PostsSection username={profile.username} isOwnProfile={isOwnProfile} />
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
