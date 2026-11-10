"use client";
import { publicEnv } from "@/lib/env";

import { useEffect, useState } from "react";
import { LiveKitRoom } from "@livekit/components-react";
import "@livekit/components-styles";
import { Loader2 } from "lucide-react";
import { useUserStore } from "@/stores/user_store";
import { useSingleCommunityStore } from "@/stores/single_community_store";
import { VideoRoom } from "./custom/video-room";

interface MediaRoomProps {
  chatId: string;
  video: boolean;
  audio: boolean;
  communityId?: string;
}

export const MediaRoom = ({ chatId, video, audio,communityId }: MediaRoomProps) => {
  const { user } = useUserStore();
  const [token, setToken] = useState<string>("");
  const { checkModStatus, moderationStatus, clearModStatus } = useSingleCommunityStore();
    const { setCurrentCommunity } = useSingleCommunityStore();
  
    useEffect(() => {
      setCurrentCommunity(parseInt(communityId?.toString() || "0"));
    }, [communityId, setCurrentCommunity]);

  // Check moderation status when component mounts
  useEffect(() => {
    if (user?.id && communityId) {
      checkModStatus(user.id, communityId);
    }

    // Cleanup moderation status when unmounting
    return () => {
      clearModStatus();
    };
  }, [user?.id, communityId, checkModStatus, clearModStatus]);

  // Fetch token when user and chatId are available
  useEffect(() => {
    if (!user?.username || !user?.email || !chatId) return;

    (async () => {
      try {
        // Identity and display name are resolved server-side from the session
        const resp = await fetch(
          `/api/livekit?room=${chatId}&communityId=${communityId}`
        );
        const data = await resp.json();

        if (resp.ok) {
          setToken(data.token);
        } else {
          console.error("Error fetching token:", data.error);
        }
      } catch (e) {
        console.error("Error:", e);
      }
    })();
  }, [user?.username, user?.email, chatId, communityId]);

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
        serverUrl={publicEnv.NEXT_PUBLIC_LIVEKIT_URL}
        token={token}
        connect={true}
        video={video && !moderationStatus.isBanned && !moderationStatus.isMuted}
        audio={audio && !moderationStatus.isBanned && !moderationStatus.isMuted}
      >
        <VideoRoom 
          roomName={chatId} 
          initialVideo={video} 
          initialAudio={audio} 
          isBanned={moderationStatus.isBanned}
          isMuted={moderationStatus.isMuted}
          communityId={communityId}
          banReason={moderationStatus.banReason}
          muteReason={moderationStatus.muteReason}
        />
      </LiveKitRoom>
    </div>
  );
};