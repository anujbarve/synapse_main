// components/media-room.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { LiveKitRoom } from "@livekit/components-react";
import { AlertCircle, Loader2 } from "lucide-react";
import { useUserStore } from "@/stores/user_store";
import { CommunityPresenceProvider } from "../community-presence";
import { useSingleCommunityStore } from "@/stores/single_community_store";
import { VideoRoom } from "./custom/video-room";
import { Room, Track, VideoPresets } from "livekit-client";
import { Button } from "../ui/button";

interface MediaRoomProps {
  chatId: string;
  video: boolean;
  audio: boolean;
}

export const MediaRoom = ({ chatId, video, audio }: MediaRoomProps) => {
  const { user } = useUserStore();
  const [token, setToken] = useState<string>("");
  const { currentCommunity } = useSingleCommunityStore();
  const [roomInstance, setRoomInstance] = useState<Room | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Fetch token when user and chatId are available
  useEffect(() => {
    if (!user?.username || !user?.email || !chatId) return;

    const name = `${user.username}`;
    
    setIsConnecting(true);
    setConnectionError(null);
    
    (async () => {
      try {
        const resp = await fetch(`/api/livekit?room=${chatId}&username=${name}`);
        const data = await resp.json();
        console.log(data);

        if (resp.ok) {
          setToken(data.token);
        } else {
          console.error("Error fetching token:", data.error);
          setConnectionError(data.error || "Failed to connect to room");
        }
      } catch (e) {
        console.log("Error:", e);
        setConnectionError("Network error connecting to room");
      } finally {
        setIsConnecting(false);
      }
    })();
  }, [user?.username, user?.email, chatId]);

  // Define onConnected callback without parameters to match the expected type
  const handleConnected = useCallback(() => {
    console.log("Connected to LiveKit room");
    setIsConnecting(false);
    
    // We can access the room through the useRoomContext hook in child components
    // instead of trying to get it from the callback parameter
  }, []);
  
  // Define error handler
  const handleError = useCallback((error: Error) => {
    console.error("LiveKit connection error:", error);
    setConnectionError(error.message);
    setIsConnecting(false);
  }, []);

  // Set up a separate effect to handle initial device state
  // We'll use the useRoomContext hook in the VideoRoom component instead
  // of trying to access the room instance directly here

  // Show loading state while fetching token
  if (isConnecting) {
    return (
      <div className="flex flex-col flex-1 justify-center items-center">
        <Loader2 className="h-7 w-7 text-zinc-500 animate-spin my-4" />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Connecting to room...</p>
      </div>
    );
  }
  
  // Show error state
  if (connectionError) {
    return (
      <div className="flex flex-col flex-1 justify-center items-center">
        <AlertCircle className="h-7 w-7 text-red-500 my-4" />
        <p className="text-sm text-red-500 mb-2">Failed to join room</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{connectionError}</p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  // Show empty state if no token
  if (token === "") {
    return (
      <div className="flex flex-col flex-1 justify-center items-center">
        <Loader2 className="h-7 w-7 text-zinc-500 animate-spin my-4" />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden border">
      <LiveKitRoom
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        token={token}
        connect={true}
        video={video}
        audio={audio}
        onConnected={handleConnected}
        onError={handleError}
      >
        
        <VideoRoom 
          roomName={chatId} 
          initialVideo={video} 
          initialAudio={audio} 
        />
      </LiveKitRoom>
    </div>
  );
};