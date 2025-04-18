// components/custom/media-controls.tsx
import { useEffect, useState } from "react";
import { useParticipants, useRoomContext } from "@livekit/components-react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Track } from "livekit-client";
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
  Settings,
  MoreHorizontal
} from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils"; // Add this import for the cn utility

interface MediaControlsProps {
  onToggleChat: () => void;
  onToggleParticipants: () => void;
  onToggleSettings: () => void;
  activePanel?: string | null; // Add this prop to receive the active panel state
}

export function MediaControls({ 
    onToggleChat, 
    onToggleParticipants,
    onToggleSettings,
    activePanel = null // Default to null if not provided
}: MediaControlsProps) {
  const room = useRoomContext();
  const participants = useParticipants();
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [isScreenShareEnabled, setIsScreenShareEnabled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkViewport = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    // Check initially
    checkViewport();
    
    // Add resize listener
    window.addEventListener('resize', checkViewport);
    
    return () => {
      window.removeEventListener('resize', checkViewport);
    };
  }, []);
  
  useEffect(() => {
    if (room.localParticipant) {
      const camEnabled = room.localParticipant.isCameraEnabled;
      const micEnabled = room.localParticipant.isMicrophoneEnabled; // Remove the negation
      setIsCameraEnabled(camEnabled);
      setIsMicEnabled(micEnabled);
      
      // Check if screen share is active
      const screenSharePub = room.localParticipant.getTrackPublication(Track.Source.ScreenShare);
      setIsScreenShareEnabled(!!screenSharePub && !screenSharePub.isMuted);
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
      // Get current state
      const currentState = isCameraEnabled;
      
      // Update UI immediately for responsiveness
      setIsCameraEnabled(!currentState);
      
      // Actually toggle the camera
      await room.localParticipant.setCameraEnabled(!currentState);
      
      // Force a re-publish if turning on
      if (!currentState) {
        // Small delay to ensure the track is created
        setTimeout(async () => {
          const cameraTrack = room.localParticipant.getTrackPublication(Track.Source.Camera);
          if (cameraTrack && cameraTrack.track) {
            // Force a re-publish by muting and unmuting
            await cameraTrack.mute();
            await cameraTrack.unmute();
          }
        }, 500);
      }
    } catch (e) {
      // Revert UI state if there was an error
      setIsCameraEnabled(isCameraEnabled);
      console.error("Error toggling camera:", e);
    }
  };
  
  const toggleMic = async () => {
    try {
      // Get current state - IMPORTANT: Fix the inverted logic
      const currentState = room.localParticipant.isMicrophoneEnabled;
      
      // Update UI immediately for responsiveness
      setIsMicEnabled(!currentState);
      
      // Actually toggle the microphone
      await room.localParticipant.setMicrophoneEnabled(!currentState);
      
      // Force a re-publish if turning on
      if (!currentState) {
        // Small delay to ensure the track is created
        setTimeout(async () => {
          const micTrack = room.localParticipant.getTrackPublication(Track.Source.Microphone);
          if (micTrack && micTrack.track) {
            // Force a re-publish by muting and unmuting
            await micTrack.mute();
            await micTrack.unmute();
          }
        }, 500);
      }
    } catch (e) {
      // Revert UI state if there was an error
      setIsMicEnabled(isMicEnabled);
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
  
  // Function to handle mobile menu button click
  const handleMobileMenuClick = () => {
    // Toggle between chat, participants, and settings
    if (!activePanel) {
      onToggleChat();
    } else if (activePanel === 'chat') {
      onToggleChat(); // Turn off chat
      onToggleParticipants(); // Turn on participants
    } else if (activePanel === 'participants') {
      onToggleParticipants(); // Turn off participants
      onToggleSettings(); // Turn on settings
    } else {
      onToggleSettings(); // Turn off settings
    }
  };
  
  return (
    <TooltipProvider>
      <div className={cn(
        "flex items-center gap-1 sm:gap-2 p-2 sm:p-3 bg-card rounded-lg shadow-lg",
        isMobile ? "w-full justify-between" : ""
      )}>
        <div className="flex items-center gap-1 sm:gap-2">
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
        </div>
        
        {!isMobile && <Separator orientation="vertical" className="h-6 mx-1" />}
        
        <div className="flex items-center gap-1 sm:gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onToggleChat}
                className={isMobile ? "hidden" : ""}
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
                className={isMobile ? "hidden" : ""}
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
                className={isMobile ? "hidden" : ""}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>
        </div>
        
        {!isMobile && <Separator orientation="vertical" className="h-6 mx-1" />}
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="destructive" 
              size={isMobile ? "icon" : "sm"}
              onClick={disconnect}
            >
              {isMobile ? (
                <PhoneOff className="h-4 w-4" />
              ) : (
                <>
                  <PhoneOff className="h-4 w-4 mr-2" />
                  Leave
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Leave call</TooltipContent>
        </Tooltip>
        
        {isMobile && (
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleMobileMenuClick}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        )}
      </div>
    </TooltipProvider>
  );
}