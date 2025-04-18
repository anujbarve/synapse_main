// components/custom/video-room.tsx
import { useState, useEffect } from "react";
import { useParticipants, useRoomContext } from "@livekit/components-react";
import { Track, RemoteParticipant } from "livekit-client";
import { VideoGrid } from "./video-grid";
import { MediaControls } from "./media-controls";
import { RoomChat } from "./room-chat";
import { ParticipantsList } from "./participants-list";
import { RoomSettings } from "./room-settings";
import { ScreenShareTile } from "./screen-share-tile";
import { VideoTile } from "./video-tile"; // Make sure to import VideoTile
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface VideoRoomProps {
  roomName: string;
}

export function VideoRoom({ roomName }: VideoRoomProps) {
  const room = useRoomContext();
  const participants = useParticipants();
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [screenShareParticipant, setScreenShareParticipant] = useState<any>(null);
  const [layout, setLayout] = useState<'grid' | 'presentation'>('grid');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Add track subscription handling with correct type checking
  useEffect(() => {
    // Function to ensure all tracks are properly subscribed
    const ensureTracksSubscribed = () => {
      for (const participant of participants) {
        // Skip local participant as it doesn't need subscription
        if (participant.isLocal) continue;
        
        // Cast to RemoteParticipant to access subscription methods
        const remoteParticipant = participant as RemoteParticipant;
        
        // In LiveKit, tracks are automatically subscribed by default
        // We can use setTrackSubscriptionPermissions if we need to control this
        
        // Instead of manually subscribing, we can check if tracks are available
        const cameraPublication = remoteParticipant.getTrackPublication(Track.Source.Camera);
        const microphonePublication = remoteParticipant.getTrackPublication(Track.Source.Microphone);
        
        // Log track status for debugging
        if (cameraPublication) {
          console.log(`Camera track for ${remoteParticipant.identity}: ${cameraPublication.isSubscribed ? 'subscribed' : 'not subscribed'}`);
        }
        
        if (microphonePublication) {
          console.log(`Microphone track for ${remoteParticipant.identity}: ${microphonePublication.isSubscribed ? 'subscribed' : 'not subscribed'}`);
        }
      }
    };
    
    // Call initially
    ensureTracksSubscribed();
    
    // Set up interval to periodically check
    const interval = setInterval(ensureTracksSubscribed, 5000);
    
    return () => {
      clearInterval(interval);
    };
  }, [participants]);
  
  // Detect screen sharing
  useEffect(() => {
    const findScreenShareParticipant = () => {
      for (const participant of participants) {
        const screenSharePub = participant.getTrackPublication(Track.Source.ScreenShare);
        if (screenSharePub?.track && !screenSharePub.isMuted) {
          return participant;
        }
      }
      return null;
    };
    
    const checkScreenShare = () => {
      const screenSharer = findScreenShareParticipant();
      setScreenShareParticipant(screenSharer);
      
      // Automatically switch layout when screen sharing starts/stops
      if (screenSharer && layout !== 'presentation') {
        setLayout('presentation');
      } else if (!screenSharer && layout !== 'grid') {
        setLayout('grid');
      }
    };
    
    // Check initially
    checkScreenShare();
    
    // Set up event listeners for all participants
    const handleTrackSubscribed = () => checkScreenShare();
    const handleTrackUnsubscribed = () => checkScreenShare();
    const handleTrackMuted = () => checkScreenShare();
    const handleTrackUnmuted = () => checkScreenShare();
    
    for (const participant of participants) {
      participant.on('trackSubscribed', handleTrackSubscribed);
      participant.on('trackUnsubscribed', handleTrackUnsubscribed);
      participant.on('trackMuted', handleTrackMuted);
      participant.on('trackUnmuted', handleTrackUnmuted);
    }
    
    return () => {
      for (const participant of participants) {
        participant.off('trackSubscribed', handleTrackSubscribed);
        participant.off('trackUnsubscribed', handleTrackUnsubscribed);
        participant.off('trackMuted', handleTrackMuted);
        participant.off('trackUnmuted', handleTrackUnmuted);
      }
    };
  }, [participants, layout]);
  
  // Add an effect to force camera and microphone activation on room join
  useEffect(() => {
    if (!room.localParticipant) return;
    
    const forceMediaActivation = async () => {
      try {
        // Get current states
        const isCameraEnabled = room.localParticipant.isCameraEnabled;
        const isMicEnabled = !room.localParticipant.isMicrophoneEnabled;
        
        // If camera should be on but isn't working properly
        if (isCameraEnabled) {
          // Toggle off and on to force republish
          await room.localParticipant.setCameraEnabled(false);
          await new Promise(resolve => setTimeout(resolve, 500));
          await room.localParticipant.setCameraEnabled(true);
        }
        
        // If mic should be on but isn't working properly
        if (isMicEnabled) {
          // Toggle off and on to force republish
          await room.localParticipant.setMicrophoneEnabled(false);
          await new Promise(resolve => setTimeout(resolve, 500));
          await room.localParticipant.setMicrophoneEnabled(true);
        }
      } catch (e) {
        console.error("Error forcing media activation:", e);
      }
    };
    
    // Run once after a delay to ensure room is fully connected
    const timer = setTimeout(forceMediaActivation, 2000);
    
    return () => {
      clearTimeout(timer);
    };
  }, [room.localParticipant]);
  
  const togglePanel = (panel: string) => {
    if (activePanel === panel) {
      setActivePanel(null);
      if (panel === 'settings') {
        setIsSettingsOpen(false);
      }
    } else {
      setActivePanel(panel);
      if (panel === 'settings') {
        setIsSettingsOpen(true);
      } else if (activePanel === 'settings') {
        setIsSettingsOpen(false);
      }
    }
  };
  
  return (
    <div className="flex flex-col h-screen max-h-screen">
      <div className="flex-1 overflow-hidden flex">
        {/* Main content area */}
        <div className="flex-1 p-4 overflow-auto">
          <h2 className="text-xl font-bold mb-4">{roomName}</h2>
          
          {/* Screen share takes priority if active */}
          {layout === 'presentation' && screenShareParticipant ? (
            <div className="grid grid-rows-[1fr_auto] gap-4 h-[calc(100%-2rem)]">
              <ScreenShareTile 
                participant={screenShareParticipant} 
                className="w-full h-full max-h-[70vh]"
              />
              <div className="h-auto">
                <div className="flex overflow-x-auto gap-2 pb-2">
                  {participants.map(participant => (
                    <div key={participant.sid} className="w-40 flex-shrink-0">
                      <VideoTile participant={participant} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <VideoGrid />
          )}
        </div>
        
        {/* Side panel - visible on larger screens */}
        {activePanel && (
          <div className="w-80 border-l hidden md:block">
            <div className="h-full flex flex-col">
              <div className="p-2 border-b flex justify-between items-center">
                <h3 className="font-medium">
                  {activePanel === 'chat' && 'Chat'}
                  {activePanel === 'participants' && 'Participants'}
                  {activePanel === 'settings' && 'Settings'}
                </h3>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setActivePanel(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex-1 overflow-hidden">
                {activePanel === 'chat' && <RoomChat />}
                {activePanel === 'participants' && <ParticipantsList />}
                {activePanel === 'settings' && <RoomSettings isOpen={isSettingsOpen} />}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Mobile panel - slides in from bottom on small screens */}
      <Sheet>
        <SheetTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="md:hidden fixed bottom-20 right-4 z-10"
          >
            More
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[80vh] p-0 md:hidden">
          <Tabs defaultValue="chat" className="h-full flex flex-col">
            <TabsList className="grid grid-cols-3 w-full rounded-none">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="participants">Participants</TabsTrigger>
              <TabsTrigger 
                value="settings" 
                onClick={() => setIsSettingsOpen(true)}
              >
                Settings
              </TabsTrigger>
            </TabsList>
            <TabsContent value="chat" className="flex-1 m-0 overflow-hidden">
              <RoomChat />
            </TabsContent>
            <TabsContent value="participants" className="flex-1 m-0 overflow-hidden">
              <ParticipantsList />
            </TabsContent>
            <TabsContent 
              value="settings" 
              className="flex-1 m-0 overflow-hidden"
              onBlur={() => setIsSettingsOpen(false)}
            >
              <RoomSettings isOpen={isSettingsOpen} />
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
      
      {/* Controls */}
      <div className="p-4 flex justify-center">
        <MediaControls 
          onToggleChat={() => togglePanel('chat')}
          onToggleParticipants={() => togglePanel('participants')}
          onToggleSettings={() => togglePanel('settings')}
        />
      </div>
    </div>
  );
}