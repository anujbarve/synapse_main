// components/social/connection-button.tsx
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useUserConnectionStore } from "@/stores/connection_store";
import { toast } from "sonner";
import {
  UserPlus,
  UserCheck,
  UserX,
  UserMinus,
  Clock
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ViewerConnection } from "@/lib/social";

interface ConnectionButtonProps {
  targetUserId: string;
  targetUsername: string;
  variant?: "default" | "responsive" | "small";
  // Logged-in viewer; the button is hidden when null or when viewing self
  viewerId: string | null;
  // The viewer's connection with the target, computed on the server
  connection: ViewerConnection | null;
}

export function ConnectionButton({
  targetUserId,
  targetUsername,
  variant = "default",
  viewerId,
  connection,
}: ConnectionButtonProps) {
  const router = useRouter();
  const {
    createConnection,
    updateConnection,
    deleteConnection,
  } = useUserConnectionStore();

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

  const handleCreateConnection = async () => {
    if (!viewerId) return;

    try {
      await createConnection({
        user_id: viewerId,
        connected_user_id: targetUserId,
        status: "pending",
      });
      toast.success(`Friend request sent to ${targetUsername}`);
      router.refresh();
    } catch (error) {
      toast.error("Failed to send friend request : " + error);
    }
  };

  const handleAcceptConnection = async () => {
    if (!connection) return;

    try {
      await updateConnection(connection.id, { status: "accepted" });
      toast.success(`You are now friends with ${targetUsername}`);
      router.refresh();
    } catch (error) {
      toast.error("Failed to accept friend request : " + error);
    }
  };

  const handleBlockUser = async () => {
    if (!viewerId) return;

    try {
      if (connection) {
        await updateConnection(connection.id, { status: "blocked" });
      } else {
        await createConnection({
          user_id: viewerId,
          connected_user_id: targetUserId,
          status: "blocked",
        });
      }
      toast.success(`Blocked ${targetUsername}`);
      router.refresh();
    } catch (error) {
      toast.error("Failed to block user : " + error);
    }
  };

  const handleRemoveConnection = async () => {
    if (!connection) return;

    try {
      await deleteConnection(connection.id);
      toast.success(`Removed connection with ${targetUsername}`);
      router.refresh();
    } catch (error) {
      toast.error("Failed to remove connection : " + error);
    }
  };

  // Don't show connection button on own profile or when logged out
  if (!viewerId || viewerId === targetUserId) {
    return null;
  }

  // Render button based on connection status
  switch (connection?.status) {
    case "pending":
      // If current user sent the request
      if (connection.outgoing) {
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

    case "accepted":
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

    case "blocked":
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
