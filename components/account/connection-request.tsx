// components/social/friend-requests.tsx
"use client";

import { useEffect, useState } from "react";
import { useUserConnectionStore } from "@/stores/connection_store";
import { useUserStore } from "@/stores/user_store"; // Add this import
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserCheck, UserX,  Clock } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface FriendRequestsProps {
  userId: string;
  compact?: boolean;
}

export function FriendRequests({ userId, compact = false }: FriendRequestsProps) {
  const {
    connections,
    fetchPendingRequests,
    fetchSentRequests,
    loading,
    acceptConnection,
    deleteConnection
  } = useUserConnectionStore();
  
  const { user: currentUser } = useUserStore(); // Get the current authenticated user
  
  // Track which tab is active
  const [activeTab, setActiveTab] = useState<"received" | "sent">("received");

  useEffect(() => {
    if (userId) {
      // Load the appropriate requests based on the active tab
      if (activeTab === "received") {
        fetchPendingRequests(userId);
      } else {
        fetchSentRequests(userId);
      }
    }
  }, [userId, fetchPendingRequests, fetchSentRequests, activeTab]);

  // Check if the current user is the same as the profile user
  // This ensures we only show actions for the current user's own requests
  const isCurrentUser = currentUser?.id === userId;

  const handleAcceptRequest = async (connectionId: number, username: string) => {
    if (!isCurrentUser) {
      toast.error("You can only accept your own friend requests");
      return;
    }
    
    try {
      await acceptConnection(connectionId);
      toast.success(`You are now friends with ${username}`);
      
      // Refresh the pending requests list after accepting
      fetchPendingRequests(userId);
    } catch (error) {
      toast.error("Failed to accept friend request : " + error);
    }
  };

  const handleRejectRequest = async (connectionId: number) => {
    if (!isCurrentUser) {
      toast.error("You can only reject your own friend requests");
      return;
    }
    
    try {
      await deleteConnection(connectionId);
      toast.success("Friend request rejected");
      
      // Refresh the pending requests list after rejecting
      fetchPendingRequests(userId);
    } catch (error) {
      toast.error("Failed to reject friend request : " + error);
    }
  };

  const handleCancelRequest = async (connectionId: number) => {
    if (!isCurrentUser) {
      toast.error("You can only cancel your own friend requests");
      return;
    }
    
    try {
      await deleteConnection(connectionId);
      toast.success("Friend request canceled");
      
      // Refresh the sent requests list after canceling
      fetchSentRequests(userId);
    } catch (error) {
      toast.error("Failed to cancel friend request : " + error);
    }
  };

  const loadPendingRequests = () => {
    setActiveTab("received");
    fetchPendingRequests(userId);
  };
  
  const loadSentRequests = () => {
    setActiveTab("sent");
    fetchSentRequests(userId);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {!compact && (
          <Tabs defaultValue="received">
            <TabsList className="w-full grid grid-cols-2 mb-4">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </TabsList>
          </Tabs>
        )}
        <div className="space-y-3">
          {Array(compact ? 2 : 3).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  // For compact view, we only show received requests
  if (compact) {
    // Make sure we're only showing pending requests where the user is the recipient
    const pendingRequests = connections.filter(conn => 
      conn.status === 'pending' && conn.connected_user_id === userId
    );
    
    if (pendingRequests.length === 0) {
      return null;
    }
    
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Friend Requests</h3>
          <Badge variant="secondary" className="text-xs">
            {pendingRequests.length}
          </Badge>
        </div>
        
        {pendingRequests.slice(0, 2).map(request => {
          // Get the requester's details
          const requesterDetails = request.user_details || {
            username: `User ${request.user_id.substring(0, 6)}`,
            profile_picture: null
          };
          
          return (
            <Card key={request.id} className="p-3">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={requesterDetails.profile_picture || ""} alt={requesterDetails.username || ""} />
                  <AvatarFallback>
                    {requesterDetails.username?.slice(0, 2).toUpperCase() || request.user_id.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {requesterDetails.username || `User: ${request.user_id.substring(0, 6)}`}
                  </p>
                </div>
                {isCurrentUser && ( // Only show action buttons if it's the current user's profile
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-green-500 hover:text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20"
                      onClick={() => handleAcceptRequest(request.id, requesterDetails.username || request.user_id.substring(0, 6))}
                    >
                      <UserCheck className="h-4 w-4" />
                      <span className="sr-only">Accept</span>
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:bg-destructive/10"
                      onClick={() => handleRejectRequest(request.id)}
                    >
                      <UserX className="h-4 w-4" />
                      <span className="sr-only">Reject</span>
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
        
        {pendingRequests.length > 2 && (
          <Link href="/connections/requests" className="block text-center text-xs text-muted-foreground hover:text-primary transition-colors">
            View all {pendingRequests.length} requests
          </Link>
        )}
      </div>
    );
  }

  return (
    <Tabs defaultValue="received" onValueChange={(value) => setActiveTab(value as "received" | "sent")}>
      <TabsList className="w-full grid grid-cols-2 mb-4">
        <TabsTrigger value="received" onClick={loadPendingRequests}>
          Received
          {activeTab === "received" && connections.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {connections.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="sent" onClick={loadSentRequests}>
          Sent
          {activeTab === "sent" && connections.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {connections.length}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="received">
        {connections.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No pending friend requests
          </div>
        ) : (
          <div className="space-y-3">
            {connections.map(request => {
              // Get the requester's details
              const requesterDetails = request.user_details || {
                username: `User ${request.user_id.substring(0, 6)}`,
                profile_picture: null
              };
              
              return (
                <Card key={request.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <Link href={`/profile/${requesterDetails.username || request.user_id}`} className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={requesterDetails.profile_picture || ""} alt={requesterDetails.username || ""} />
                        <AvatarFallback>
                          {requesterDetails.username?.slice(0, 2).toUpperCase() || request.user_id.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{requesterDetails.username || `User: ${request.user_id.substring(0, 6)}`}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(request.created_at || "").toLocaleDateString()}
                        </div>
                      </div>
                    </Link>
                    
                    {isCurrentUser && ( // Only show action buttons if it's the current user's profile
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptRequest(request.id, requesterDetails.username || request.user_id.substring(0, 6))}
                        >
                          <UserCheck className="mr-2 h-4 w-4" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectRequest(request.id)}
                        >
                          <UserX className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="sent">
        {connections.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No sent friend requests
          </div>
        ) : (
          <div className="space-y-3">
            {connections.map(request => {
              // Get the recipient's details
              const recipientDetails = request.connected_user_details || {
                username: `User ${request.connected_user_id.substring(0, 6)}`,
                profile_picture: null
              };
              
              return (
                <Card key={request.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <Link href={`/profile/${recipientDetails.username || request.connected_user_id}`} className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={recipientDetails.profile_picture || ""} alt={recipientDetails.username || ""} />
                        <AvatarFallback>
                          {recipientDetails.username?.slice(0, 2).toUpperCase() || request.connected_user_id.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{recipientDetails.username || `User: ${request.connected_user_id.substring(0, 6)}`}</div>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="mr-1 h-3 w-3" />
                          Sent {new Date(request.created_at || "").toLocaleDateString()}
                        </div>
                      </div>
                    </Link>
                    
                    {isCurrentUser && ( // Only show action buttons if it's the current user's profile
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancelRequest(request.id)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}