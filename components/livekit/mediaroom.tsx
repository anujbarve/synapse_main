// components/media-room.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { LiveKitRoom } from "@livekit/components-react";
import { Loader2 } from "lucide-react";
import { useUserStore } from "@/stores/user_store";
import { CommunityPresenceProvider } from "../community-presence";
import { useSingleCommunityStore } from "@/stores/single_community_store";
import { VideoRoom } from "./custom/video-room";
import { Room, Track, VideoPresets } from "livekit-client";

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

  // Define onConnected callback without parameters to match the expected type
  const handleConnected = useCallback(() => {
    console.log("Connected to LiveKit room");
    
    // We can't access the room directly from the callback
    // Instead, we'll use the useRoomContext hook in the VideoRoom component
  }, []);

  // Set up a separate effect to handle initial device state
  useEffect(() => {
    if (!roomInstance) return;
    
    const setupInitialState = async () => {
      try {
        if (roomInstance.localParticipant) {
          // Set camera state
          if (video !== roomInstance.localParticipant.isCameraEnabled) {
            await roomInstance.localParticipant.setCameraEnabled(video);
          }
          
          // Set microphone state
          if (audio !== !roomInstance.localParticipant.isMicrophoneEnabled) {
            await roomInstance.localParticipant.setMicrophoneEnabled(audio);
          }
          
          // Force a re-publish of tracks to ensure they're visible
          if (video) {
            const cameraTrack = roomInstance.localParticipant.getTrackPublication(Track.Source.Camera);
            if (cameraTrack && cameraTrack.track) {
              await cameraTrack.mute();
              await cameraTrack.unmute();
            }
          }
          
          if (audio) {
            const micTrack = roomInstance.localParticipant.getTrackPublication(Track.Source.Microphone);
            if (micTrack && micTrack.track) {
              await micTrack.mute();
              await micTrack.unmute();
            }
          }
        }
      } catch (e) {
        console.error("Error setting initial device state:", e);
      }
    };
    
    // Add a slight delay to ensure room is fully initialized
    const timer = setTimeout(setupInitialState, 1000);
    
    return () => {
      clearTimeout(timer);
    };
  }, [roomInstance, video, audio]);

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
    <div className="rounded-lg min-h-[30rem] overflow-hidden border">
      <LiveKitRoom
        data-lk-theme="default"
        serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
        token={token}
        connect={true}
        video={video}
        audio={audio}
        onConnected={handleConnected}
        // Add these options to improve device handling
        options={{
          publishDefaults: {
            simulcast: true,
            // Use predefined VideoPresets instead of custom layers
            videoSimulcastLayers: [
              VideoPresets.h90,
              VideoPresets.h180,
              VideoPresets.h360
            ],
          },
          adaptiveStream: true,
          dynacast: true,
        }}
      >
        {currentCommunity && (
          <CommunityPresenceProvider communityId={currentCommunity} />
        )}
        
        {/* Pass roomInstance to VideoRoom to handle initial setup */}
        <VideoRoom roomName={chatId} />
      </LiveKitRoom>
    </div>
  );
};