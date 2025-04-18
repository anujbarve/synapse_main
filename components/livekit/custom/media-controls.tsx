// components/custom/media-controls.tsx
import { useRoomContext } from "@livekit/components-react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Mic, MicOff, Video, VideoOff, PhoneOff, ScreenShare, ScreenShareOff } from "lucide-react";
import { useState } from "react";

export function MediaControls() {
  const room = useRoomContext();
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isScreenShareEnabled, setIsScreenShareEnabled] = useState(false);
  
  const toggleCamera = async () => {
    const enabled = !isCameraEnabled;
    await room.localParticipant.setCameraEnabled(enabled);
    setIsCameraEnabled(enabled);
  };
  
  const toggleMic = async () => {
    const enabled = !isMicEnabled;
    await room.localParticipant.setMicrophoneEnabled(enabled);
    setIsMicEnabled(enabled);
  };
  
  const toggleScreenShare = async () => {
    const enabled = !isScreenShareEnabled;
    try {
      if (enabled) {
        await room.localParticipant.setScreenShareEnabled(true);
      } else {
        await room.localParticipant.setScreenShareEnabled(false);
      }
      setIsScreenShareEnabled(enabled);
    } catch (e) {
      console.error("Error toggling screen share:", e);
    }
  };
  
  const disconnect = () => {
    room.disconnect();
    window.location.href = "/";
  };
  
  return (
    <div className="flex items-center gap-2 p-3 bg-card rounded-lg shadow-lg">
      <Toggle 
        pressed={isMicEnabled} 
        onPressedChange={toggleMic}
        aria-label="Toggle microphone"
      >
        {isMicEnabled ? 
          <Mic className="h-4 w-4" /> : 
          <MicOff className="h-4 w-4" />
        }
      </Toggle>
      
      <Toggle 
        pressed={isCameraEnabled} 
        onPressedChange={toggleCamera}
        aria-label="Toggle camera"
      >
        {isCameraEnabled ? 
          <Video className="h-4 w-4" /> : 
          <VideoOff className="h-4 w-4" />
        }
      </Toggle>
      
      <Toggle 
        pressed={isScreenShareEnabled} 
        onPressedChange={toggleScreenShare}
        aria-label="Toggle screen share"
      >
        {isScreenShareEnabled ? 
          <ScreenShare className="h-4 w-4" /> : 
          <ScreenShareOff className="h-4 w-4" />
        }
      </Toggle>
      
      <Button 
        variant="destructive" 
        size="sm" 
        onClick={disconnect}
      >
        <PhoneOff className="h-4 w-4 mr-2" />
        Leave
      </Button>
    </div>
  );
}