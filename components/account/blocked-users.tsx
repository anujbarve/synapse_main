// components/social/blocked-users.tsx
"use client";

import { useEffect } from "react";
import { useUserConnectionStore } from "@/stores/connection_store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserX } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface BlockedUsersProps {
  userId: string;
}

export function BlockedUsers({ userId }: BlockedUsersProps) {
  const { connections, fetchBlockedUsers, loading, deleteConnection } = useUserConnectionStore();

  useEffect(() => {
    if (userId) {
      fetchBlockedUsers(userId);
    }
  }, [userId, fetchBlockedUsers]);

  const handleUnblockUser = async (connectionId: number, username: string) => {
    try {
      await deleteConnection(connectionId);
      toast.success(`Unblocked ${username}`);
    } catch (error) {
      toast.error("Failed to unblock user" + error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array(3).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  if (connections.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        You have not blocked any users
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {connections.map(connection => {
        // Get the user details of the blocked person
        const blockedUser = connection.connected_user_details || {
          username: `User ${connection.connected_user_id.substring(0, 6)}`,
          profile_picture: null
        };
        
        return (
          <Card key={connection.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={blockedUser.profile_picture || ""} alt={blockedUser.username || ""} />
                  <AvatarFallback>
                    {blockedUser.username?.slice(0, 2).toUpperCase() || connection.connected_user_id.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{blockedUser.username || `User: ${connection.connected_user_id.substring(0, 6)}`}</div>
                  <div className="text-xs text-muted-foreground">
                    Blocked on {new Date(connection.created_at || "").toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleUnblockUser(connection.id, blockedUser.username || connection.connected_user_id.substring(0, 6))}
              >
                <UserX className="mr-2 h-4 w-4" />
                Unblock
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}