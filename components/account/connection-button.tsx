// components/social/connection-button.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useUserConnectionStore } from "@/stores/connection_store";
import { useUserStore } from "@/stores/user_store";
import { toast } from "sonner";
import {
  UserPlus,
  UserCheck,
  UserX,
  UserMinus,
  Loader2,
  Clock
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ConnectionButtonProps {
  targetUserId: string;
  targetUsername: string;
  variant?: "default" | "responsive" | "small";
}

export function ConnectionButton({ 
  targetUserId, 
  targetUsername,
  variant = "default"
}: ConnectionButtonProps) {
  const { user } = useUserStore();
  const {
    createConnection,
    updateConnection,
    deleteConnection,
    checkConnectionStatus,
    connections,
    loading
  } = useUserConnectionStore();
  
  const [connectionId, setConnectionId] = useState<number | null>(null);
  const [status, setStatus] = useState<'pending' | 'accepted' | 'blocked' | null>(null);
  const [isLoading, setIsLoading] = useState(true);



  useEffect(() => {
    if (!user?.id || !targetUserId) return;
    
    const checkStatus = async () => {
      setIsLoading(true);
      try {
        // Check the connection status
        const currentStatus = await checkConnectionStatus(user.id, targetUserId);
        setStatus(currentStatus);
        
        // Find the connection ID if there is an existing connection
        if (currentStatus) {
          const connection = connections.find(
            conn => 
              (conn.user_id === user.id && conn.connected_user_id === targetUserId) ||
              (conn.user_id === targetUserId && conn.connected_user_id === user.id)
          );
          if (connection) {
            setConnectionId(connection.id);
          }
        }
      } catch (error) {
        console.error("Error checking connection status:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkStatus();
  }, [user?.id, targetUserId, checkConnectionStatus, connections]);

  const handleCreateConnection = async () => {
    if (!user?.id) return;
    
    try {
      await createConnection({
        user_id: user.id,
        connected_user_id: targetUserId,
        status: 'pending'
      });
      setStatus('pending');
      toast.success(`Friend request sent to ${targetUsername}`);
    } catch (error) {
      toast.error("Failed to send friend request : " + error);
    }
  };

  const handleAcceptConnection = async () => {
    if (!connectionId) return;
    
    try {
      await updateConnection(connectionId, { status: 'accepted' });
      setStatus('accepted');
      toast.success(`You are now friends with ${targetUsername}`);
    } catch (error) {
      toast.error("Failed to accept friend request : " + error);
    }
  };

  const handleBlockUser = async () => {
    if (!user?.id) return;
    
    try {
      if (connectionId) {
        await updateConnection(connectionId, { status: 'blocked' });
      } else {
        await createConnection({
          user_id: user.id,
          connected_user_id: targetUserId,
          status: 'blocked'
        });
      }
      setStatus('blocked');
      toast.success(`Blocked ${targetUsername}`);
    } catch (error) {
      toast.error("Failed to block user : " + error);
    }
  };

  const handleRemoveConnection = async () => {
    if (!connectionId) return;
    
    try {
      await deleteConnection(connectionId);
      setStatus(null);
      setConnectionId(null);
      toast.success(`Removed connection with ${targetUsername}`);
    } catch (error) {
      toast.error("Failed to remove connection : " + error);
    }
  };

  // Determine if we should show text based on variant
  const showText = variant !== "small";
  
  // Use a simple size that's definitely supported
  const buttonSize = variant === "small" ? "sm" : "default";
  
  // Set className based on variant
  let className = "";
  if (variant === "responsive") {
    className = "flex-1";
  } else if (variant !== "small") {
    className = "w-full";
  }

    // Don't show connection button on own profile
    if (user?.id === targetUserId) {
        return null;
      }

  if (isLoading || loading) {
    return (
      <Button 
        disabled 
        className={className} 
        size={buttonSize}
      >
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        {showText && "Loading"}
      </Button>
    );
  }

  // Render button based on connection status
  switch(status) {
    case 'pending':
      // If current user sent the request
      if (connections.some(conn => conn.user_id === user?.id && conn.connected_user_id === targetUserId)) {
        return (
          <Button 
            variant="outline" 
            className={className} 
            size={buttonSize} 
            onClick={handleRemoveConnection}
          >
            <Clock className="mr-2 h-4 w-4" />
            {showText && "Request Sent"}
          </Button>
        );
      }
      // If current user received the request
      return (
        <Button 
          className={className} 
          size={buttonSize} 
          onClick={handleAcceptConnection}
        >
          <UserCheck className="mr-2 h-4 w-4" />
          {showText && "Accept Request"}
        </Button>
      );
      
    case 'accepted':
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className={className} 
              size={buttonSize}
            >
              <UserCheck className="mr-2 h-4 w-4" />
              {showText && "Friends"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleRemoveConnection}>
              <UserMinus className="mr-2 h-4 w-4" />
              Unfriend
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleBlockUser}>
              <UserX className="mr-2 h-4 w-4" />
              Block
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
      
    case 'blocked':
      return (
        <Button 
          variant="destructive" 
          className={className} 
          size={buttonSize} 
          onClick={handleRemoveConnection}
        >
          <UserX className="mr-2 h-4 w-4" />
          {showText && "Unblock"}
        </Button>
      );
      
    default:
      return (
        <Button 
          className={className} 
          size={buttonSize} 
          onClick={handleCreateConnection}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          {showText && "Add Friend"}
        </Button>
      );
  }
}