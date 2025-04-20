// components/social/friends-list.tsx
"use client";

import { useEffect, useState } from "react";
import { useUserConnectionStore } from "@/stores/connection_store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserX, MessageSquare, MoreHorizontal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

interface FriendsListProps {
  userId: string;
  isOwnProfile: boolean;
  compact?: boolean;
}

export function FriendsList({ userId, isOwnProfile, compact = false }: FriendsListProps) {
  const { connections, fetchFriends, loading, deleteConnection } = useUserConnectionStore();
  const [searchQuery, setSearchQuery] = useState("");
  
  useEffect(() => {
    if (userId) {
      fetchFriends(userId);
    }
  }, [userId, fetchFriends]);

  const handleRemoveFriend = async (connectionId: number, friendUsername: string) => {
    try {
      await deleteConnection(connectionId);
      toast.success(`Removed ${friendUsername} from friends`);
    } catch (error) {
      toast.error("Failed to remove friend : " + error);
    }
  };

  // Process the connections to get the friendship data with user details
  const friendsData = connections
    .filter(conn => conn.status === 'accepted')
    .map(conn => {
      // Determine which user in the connection is the friend
      const isFriendRequester = conn.user_id === userId;
      const friendId = isFriendRequester ? conn.connected_user_id : conn.user_id;
      const friendDetails = isFriendRequester ? conn.connected_user_details : conn.user_details;
      
      return {
        connectionId: conn.id,
        userId: friendId,
        username: friendDetails?.username || `User ${friendId.substring(0, 6)}`,
        profile_picture: friendDetails?.profile_picture || null,
        lastActive: new Date().toISOString() // Mock last active - could be stored in user data
      };
    });

  const filteredFriends = friendsData.filter(friend => 
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {!compact && (
          <div className="relative">
            <Skeleton className="w-full h-10" />
          </div>
        )}
        <div className={compact ? "grid grid-cols-1 gap-2" : "grid grid-cols-1 md:grid-cols-2 gap-4"}>
          {Array(compact ? 3 : 6).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  if (friendsData.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {isOwnProfile ? "You don't have any friends yet" : "This user doesn't have any friends yet"}
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-2">
        {filteredFriends.slice(0, 3).map(friend => (
          <Link key={friend.userId} href={`/account/${friend.userId}`}>
            <Card className="p-3 hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={friend.profile_picture || ""} alt={friend.username} />
                  <AvatarFallback>
                    {friend.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium truncate">{friend.username}</span>
                {/* <div className={`ml-auto h-2 w-2 rounded-full ${friend.status === 'online' ? 'bg-green-500' : 'bg-gray-300'}`} /> */}
              </div>
            </Card>
          </Link>
        ))}
        {friendsData.length > 3 && (
          <Link href={`/connections`} className="block text-center text-xs text-muted-foreground hover:text-primary transition-colors">
            View all {friendsData.length} friends
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Input
          placeholder="Search friends..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredFriends.map(friend => (
          <Card key={friend.userId} className="p-4 flex items-center justify-between">
            <Link href={`/profile/${friend.username}`} className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={friend.profile_picture || ""} alt={friend.username} />
                <AvatarFallback>
                  {friend.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{friend.username}</div>
                {/* <div className="text-xs text-muted-foreground">
                  {friend.status === 'online' ? 'Online' : `Last seen ${new Date(friend.lastActive).toLocaleDateString()}`}
                </div> */}
              </div>
            </Link>
            
            {isOwnProfile && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/messages/${friend.userId}`} className="flex items-center">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Message
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleRemoveFriend(friend.connectionId, friend.username)}
                    className="text-destructive focus:text-destructive"
                  >
                    <UserX className="mr-2 h-4 w-4" />
                    Remove Friend
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </Card>
        ))}
      </div>
      
      {filteredFriends.length === 0 && searchQuery && (
        <div className="text-center py-4 text-muted-foreground">
          No friends match your search
        </div>
      )}
    </div>
  );
}