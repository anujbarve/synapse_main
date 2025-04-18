"use client";

import { useEffect, useState } from "react";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import "@livekit/components-styles";
import { Loader2 } from "lucide-react";
import { useUserStore } from "@/stores/user_store";
import { VideoRoom } from "./custom/video-room";
import { Button } from "../ui/button";

interface MediaRoomProps {
  chatId: string;
  video: boolean;
  audio: boolean;
}

export const MediaRoom = ({ chatId, video, audio }: MediaRoomProps) => {
  const { user } = useUserStore();
  const [token, setToken] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Fetch token when user and chatId are available
  useEffect(() => {
    if (!user?.username || !user?.email || !chatId) return;

    const name = `${user.username}`;
    (async () => {
      try {
        const resp = await fetch(`/api/livekit?room=${chatId}&username=${name}`);
        const data = await resp.json();
        console.log(data);

        if (resp.ok) {
          setToken(data.token);
        } else {
          console.error("Error fetching token:", data.error);
        }
      } catch (e) {
        console.log("Error:", e);
      }
    })();
  }, [user?.username, user?.email, chatId]);

  // Show loading state while fetching token
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