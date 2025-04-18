// components/custom/video-room.tsx
import { useState, useEffect } from "react";
import { useParticipants, useRoomContext } from "@livekit/components-react";
import { Track } from "livekit-client";
import { VideoGrid } from "./video-grid";
import { MediaControls } from "./media-controls";
import { RoomChat } from "./room-chat";
import { ParticipantsList } from "./participants-list";
import { RoomSettings } from "./room-settings";
import { ScreenShareTile } from "./screen-share-tile";
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
  }, [participants]);
  
  const togglePanel = (panel: string) => {
    if (activePanel === panel) {
      setActivePanel(null);
    } else {
      setActivePanel(panel);
    }
  };
  
  return (
    <div className="flex flex-col h-screen max-h-screen">
      <div className="flex-1 overflow-hidden flex">
        {/* Main content area */}
        <div className="flex-1 p-4 overflow-auto">
          <h2 className="text-xl font-bold mb-4">{roomName}</h2>
          
          {/* Screen share takes priority if active */}
          {screenShareParticipant ? (
            <div className="grid grid-cols-1 gap-4 h-[calc(100%-2rem)]">
              <ScreenShareTile 
                participant={screenShareParticipant} 
                className="h-[70%]"
              />
              <div className="h-[30%]">
                <VideoGrid />
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
                {activePanel === 'settings' && <RoomSettings />}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Mobile panel - slides in from bottom on small screens */}
      <Sheet>
        <SheetContent side="bottom" className="h-[80vh] p-0 md:hidden">
          <Tabs defaultValue="chat" className="h-full flex flex-col">
            <TabsList className="grid grid-cols-3 w-full rounded-none">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="participants">Participants</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="chat" className="flex-1 m-0 overflow-hidden">
              <RoomChat />
            </TabsContent>
            <TabsContent value="participants" className="flex-1 m-0 overflow-hidden">
              <ParticipantsList />
            </TabsContent>
            <TabsContent value="settings" className="flex-1 m-0 overflow-hidden">
              <RoomSettings />
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