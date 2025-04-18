// components/custom/media-controls.tsx
import { useEffect, useState } from "react";
import { useParticipants, useRoomContext } from "@livekit/components-react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  PhoneOff, 
  ScreenShare, 
  ScreenShareOff,
  MessageSquare,
  Users,
  Settings
} from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Track } from "livekit-client";

interface MediaControlsProps {
  onToggleChat: () => void;
  onToggleParticipants: () => void;
  onToggleSettings: () => void;
}

export function MediaControls({ 
  onToggleChat, 
  onToggleParticipants,
  onToggleSettings
}: MediaControlsProps) {
  const room = useRoomContext();
  const participants = useParticipants();
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [isScreenShareEnabled, setIsScreenShareEnabled] = useState(false);
  
  // Initialize state based on actual device state
  useEffect(() => {
    if (room.localParticipant) {
      const camEnabled = room.localParticipant.isCameraEnabled;
      const micEnabled = room.localParticipant.isMicrophoneEnabled;
      setIsCameraEnabled(camEnabled);
      setIsMicEnabled(micEnabled);
    }
  }, [room.localParticipant]);
  
  // Listen for track publication changes
  useEffect(() => {
    if (!room.localParticipant) return;
    
    const handleTrackPublished = () => {
      setIsCameraEnabled(room.localParticipant.isCameraEnabled);
      setIsMicEnabled(room.localParticipant.isMicrophoneEnabled);
      
      // Check if screen share is active
      const screenSharePub = room.localParticipant.getTrackPublication(Track.Source.ScreenShare);
      setIsScreenShareEnabled(!!screenSharePub && !screenSharePub.isMuted);
    };
    
    room.localParticipant.on('trackPublished', handleTrackPublished);
    room.localParticipant.on('trackUnpublished', handleTrackPublished);
    room.localParticipant.on('trackMuted', handleTrackPublished);
    room.localParticipant.on('trackUnmuted', handleTrackPublished);
    
    return () => {
      room.localParticipant.off('trackPublished', handleTrackPublished);
      room.localParticipant.off('trackUnpublished', handleTrackPublished);
      room.localParticipant.off('trackMuted', handleTrackPublished);
      room.localParticipant.off('trackUnmuted', handleTrackPublished);
    };
  }, [room.localParticipant]);
  
  const toggleCamera = async () => {
    try {
      await room.localParticipant.setCameraEnabled(!isCameraEnabled);
      setIsCameraEnabled(!isCameraEnabled);
    } catch (e) {
      console.error("Error toggling camera:", e);
    }
  };
  
  const toggleMic = async () => {
    try {
      await room.localParticipant.setMicrophoneEnabled(!isMicEnabled);
      setIsMicEnabled(!isMicEnabled);
    } catch (e) {
      console.error("Error toggling microphone:", e);
    }
  };
  
  const toggleScreenShare = async () => {
    try {
      if (isScreenShareEnabled) {
        await room.localParticipant.setScreenShareEnabled(false);
      } else {
        await room.localParticipant.setScreenShareEnabled(true);
      }
      setIsScreenShareEnabled(!isScreenShareEnabled);
    } catch (e) {
      console.error("Error toggling screen share:", e);
    }
  };
  
  const disconnect = () => {
    room.disconnect();
    window.location.href = "/";
  };
  
  return (
    <TooltipProvider>
      <div className="flex items-center gap-2 p-3 bg-card rounded-lg shadow-lg">
        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle 
              pressed={isMicEnabled} 
              onPressedChange={toggleMic}
              aria-label="Toggle microphone"
              className="data-[state=on]:bg-green-100 data-[state=on]:text-green-900"
            >
              {isMicEnabled ? 
                <Mic className="h-4 w-4" /> : 
                <MicOff className="h-4 w-4" />
              }
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>
            {isMicEnabled ? 'Mute microphone' : 'Unmute microphone'}
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle 
              pressed={isCameraEnabled} 
              onPressedChange={toggleCamera}
              aria-label="Toggle camera"
              className="data-[state=on]:bg-green-100 data-[state=on]:text-green-900"
            >
              {isCameraEnabled ? 
                <Video className="h-4 w-4" /> : 
                <VideoOff className="h-4 w-4" />
              }
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>
            {isCameraEnabled ? 'Turn off camera' : 'Turn on camera'}
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle 
              pressed={isScreenShareEnabled} 
              onPressedChange={toggleScreenShare}
              aria-label="Toggle screen share"
              className="data-[state=on]:bg-blue-100 data-[state=on]:text-blue-900"
            >
              {isScreenShareEnabled ? 
                <ScreenShare className="h-4 w-4" /> : 
                <ScreenShareOff className="h-4 w-4" />
              }
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>
            {isScreenShareEnabled ? 'Stop sharing screen' : 'Share screen'}
          </TooltipContent>
        </Tooltip>
        
        <Separator orientation="vertical" className="h-6 mx-1" />
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onToggleChat}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Chat</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onToggleParticipants}
            >
              <Users className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {participants.length}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Participants</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onToggleSettings}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Settings</TooltipContent>
        </Tooltip>
        
        <Separator orientation="vertical" className="h-6 mx-1" />
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={disconnect}
            >
              <PhoneOff className="h-4 w-4 mr-2" />
              Leave
            </Button>
          </TooltipTrigger>
          <TooltipContent>Leave call</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}