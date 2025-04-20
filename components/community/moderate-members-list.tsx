"use client";

import { useState, useEffect } from "react";
import { useSingleCommunityStore } from "@/stores/single_community_store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Ban, MicOff } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ModeratedMember {
  id: number;
  user_id: string;
  actioned_at: string;
  details: string | null;
  users: {
    id: string;
    username: string;
    profile_picture: string | null;
  };
}

export default function ModeratedMembersList() {
  const { community, unbanMember, unmuteMember, fetchModeratedMembers } = useSingleCommunityStore();
  const [bannedMembers, setBannedMembers] = useState<ModeratedMember[]>([]);
  const [mutedMembers, setMutedMembers] = useState<ModeratedMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

// In ModeratedMembersList.jsx
useEffect(() => {
    const loadModeratedMembersData = async () => {
      if (!community?.id) return;
      
      setLoading(true);
      try {
        const { bannedMembers, mutedMembers } = await fetchModeratedMembers(community.id.toString());
        setBannedMembers(bannedMembers);
        setMutedMembers(mutedMembers);
      } catch (err) {
        console.error("Error loading moderated members:", err);
        setError("Failed to load moderated members");
      } finally {
        setLoading(false);
      }
    };
  
    loadModeratedMembersData();
    // Include all dependencies used inside the effect
  }, [community?.id, fetchModeratedMembers]);

  const loadModeratedMembers = async () => {
    if (!community?.id) return;
    
    setLoading(true);
    try {
      const { bannedMembers, mutedMembers } = await fetchModeratedMembers(community.id.toString());
      setBannedMembers(bannedMembers);
      setMutedMembers(mutedMembers);
    } catch (err) {
        console.error("Error loading moderated members:", err);
      setError("Failed to load moderated members");
    } finally {
      setLoading(false);
    }
  };

  const handleUnban = async (memberId: string) => {
    try {
      if (community) {
        await unbanMember(community.id.toString(), memberId);
        await loadModeratedMembers(); // Reload the lists
      }
    } catch (err) {
        console.error("Error unbanning member:", err);
      setError("Failed to unban member");
    }
  };

  const handleUnmute = async (memberId: string) => {
    try {
      if (community) {
        await unmuteMember(community.id.toString(), memberId);
        await loadModeratedMembers(); // Reload the lists
      }
    } catch (err) {
        console.error("Error unmuting member:", err);
      setError("Failed to unmute member");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Card className="mx-auto">
      <CardHeader>
        <CardTitle>Moderated Members</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-4" variant="destructive">
            <Info className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="banned">
          <TabsList>
            <TabsTrigger value="banned">
              Banned Members ({bannedMembers.length})
            </TabsTrigger>
            <TabsTrigger value="muted">
              Muted Members ({mutedMembers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="banned">
            <div className="space-y-4">
              {bannedMembers.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No banned members
                </p>
              ) : (
                bannedMembers.map((member) => (
                  <div
                    // Use a combination of action type and ID for unique key
                    key={`banned-${member.id}`}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-semibold">{member.users.username}</p>
                      <p className="text-sm text-muted-foreground">
                        Banned on: {new Date(member.actioned_at).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Reason: {member.details}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnban(member.user_id)}
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      Unban
                    </Button>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="muted">
            <div className="space-y-4">
              {mutedMembers.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No muted members
                </p>
              ) : (
                mutedMembers.map((member) => (
                  <div
                    // Use a combination of action type and ID for unique key
                    key={`muted-${member.id}`}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-semibold">{member.users.username}</p>
                      <p className="text-sm text-muted-foreground">
                        Muted on: {new Date(member.actioned_at).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Reason: {member.details}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnmute(member.user_id)}
                    >
                      <MicOff className="h-4 w-4 mr-2" />
                      Unmute
                    </Button>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}