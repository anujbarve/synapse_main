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
import { cn } from "@/lib/utils";

interface VideoRoomProps {
    roomName: string;
    initialVideo?: boolean;
    initialAudio?: boolean;
}

export function VideoRoom({ roomName, initialVideo = false, initialAudio = false }: VideoRoomProps) {
  const room = useRoomContext();
  const participants = useParticipants();
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [screenShareParticipant, setScreenShareParticipant] =
    useState<any>(null);
  const [layout, setLayout] = useState<"grid" | "presentation">("grid");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showParticipantsStrip, setShowParticipantsStrip] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Detect viewport size
  useEffect(() => {
    const checkViewport = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Check initially
    checkViewport();

    // Add resize listener
    window.addEventListener("resize", checkViewport);

    return () => {
      window.removeEventListener("resize", checkViewport);
    };
  }, []);

   // Add an effect to handle initial device state
   useEffect(() => {
    if (!room.localParticipant) return;
    
    const setupInitialState = async () => {
      try {
        // Set camera state
        if (initialVideo !== room.localParticipant.isCameraEnabled) {
          await room.localParticipant.setCameraEnabled(initialVideo);
        }
        
        // Set microphone state
        if (initialAudio !== room.localParticipant.isMicrophoneEnabled) {
          await room.localParticipant.setMicrophoneEnabled(initialAudio);
        }
        
        // Force a re-publish of tracks to ensure they're visible
        if (initialVideo) {
          const cameraTrack = room.localParticipant.getTrackPublication(Track.Source.Camera);
          if (cameraTrack && cameraTrack.track) {
            await cameraTrack.mute();
            await new Promise(resolve => setTimeout(resolve, 100));
            await cameraTrack.unmute();
          }
        }
        
        if (initialAudio) {
          const micTrack = room.localParticipant.getTrackPublication(Track.Source.Microphone);
          if (micTrack && micTrack.track) {
            await micTrack.mute();
            await new Promise(resolve => setTimeout(resolve, 100));
            await micTrack.unmute();
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
  }, [room.localParticipant, initialVideo, initialAudio]);

  useEffect(() => {
    // LiveKit automatically handles track subscriptions
    // We can just log track status for debugging
    const logTrackStatus = () => {
      for (const participant of participants) {
        if (participant.isLocal) continue;

        const remoteParticipant = participant as RemoteParticipant;

        // Log track status for debugging
        const cameraPublication = remoteParticipant.getTrackPublication(
          Track.Source.Camera
        );
        const microphonePublication = remoteParticipant.getTrackPublication(
          Track.Source.Microphone
        );

        if (cameraPublication) {
          console.log(
            `Camera track for ${remoteParticipant.identity}: ${
              cameraPublication.isSubscribed ? "subscribed" : "not subscribed"
            }`
          );
        }

        if (microphonePublication) {
          console.log(
            `Microphone track for ${remoteParticipant.identity}: ${
              microphonePublication.isSubscribed
                ? "subscribed"
                : "not subscribed"
            }`
          );
        }
      }
    };

    // Call initially
    logTrackStatus();

    // Set up event listeners for track changes
    const handleTrackSubscribed = () => logTrackStatus();
    const handleTrackUnsubscribed = () => logTrackStatus();

    for (const participant of participants) {
      if (participant.isLocal) continue;
      participant.on("trackSubscribed", handleTrackSubscribed);
      participant.on("trackUnsubscribed", handleTrackUnsubscribed);
    }

    return () => {
      for (const participant of participants) {
        if (participant.isLocal) continue;
        participant.off("trackSubscribed", handleTrackSubscribed);
        participant.off("trackUnsubscribed", handleTrackUnsubscribed);
      }
    };
  }, [participants]);

  // Detect screen sharing
  useEffect(() => {
    const findScreenShareParticipant = () => {
      for (const participant of participants) {
        const screenSharePub = participant.getTrackPublication(
          Track.Source.ScreenShare
        );
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
      if (screenSharer && layout !== "presentation") {
        setLayout("presentation");
      } else if (!screenSharer && layout !== "grid") {
        setLayout("grid");
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
      participant.on("trackSubscribed", handleTrackSubscribed);
      participant.on("trackUnsubscribed", handleTrackUnsubscribed);
      participant.on("trackMuted", handleTrackMuted);
      participant.on("trackUnmuted", handleTrackUnmuted);
    }

    return () => {
      for (const participant of participants) {
        participant.off("trackSubscribed", handleTrackSubscribed);
        participant.off("trackUnsubscribed", handleTrackUnsubscribed);
        participant.off("trackMuted", handleTrackMuted);
        participant.off("trackUnmuted", handleTrackUnmuted);
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
          await new Promise((resolve) => setTimeout(resolve, 500));
          await room.localParticipant.setCameraEnabled(true);
        }

        // If mic should be on but isn't working properly
        if (isMicEnabled) {
          // Toggle off and on to force republish
          await room.localParticipant.setMicrophoneEnabled(false);
          await new Promise((resolve) => setTimeout(resolve, 500));
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
      if (panel === "settings") {
        setIsSettingsOpen(false);
      }
    } else {
      setActivePanel(panel);
      if (panel === "settings") {
        setIsSettingsOpen(true);
      } else if (activePanel === "settings") {
        setIsSettingsOpen(false);
      }
    }
  };

  return (
    <div className="flex flex-col h-full w-full relative">
      {/* Main Content Area */}
      <div className="flex-1 grid grid-cols-1 overflow-hidden">
        <div className="col-span-1 flex flex-col relative">
          {/* Video Grid */}
          <div className="flex-1 min-h-0 p-2">
            {layout === "presentation" && screenShareParticipant ? (
              <div className="h-full grid grid-rows-[1fr_auto]">
                <ScreenShareTile
                  participant={screenShareParticipant}
                  className="w-full h-full rounded-xl overflow-hidden"
                />
                
                {/* Participants Strip */}
                <div className="h-24 mt-2 overflow-x-auto">
                  <div className="flex gap-2">
                    {participants.map((participant) => (
                      <div 
                        key={participant.sid} 
                        className="w-32 flex-shrink-0"
                      >
                        <VideoTile
                          participant={participant}
                          className="h-full rounded-md"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <VideoGrid className="h-full rounded-xl" />
            )}
          </div>
  
          {/* Controls */}
          <div className="p-2 flex justify-center">
            <MediaControls
              onToggleChat={() => togglePanel("chat")}
              onToggleParticipants={() => togglePanel("participants")}
              onToggleSettings={() => togglePanel("settings")}
              activePanel={activePanel}
              className="rounded-xl"
            />
          </div>
  
          {/* Side Panel - Desktop */}
          {activePanel && !isMobile && (
            <div 
              className={cn(
                "absolute top-0 right-0 bottom-0 w-96 bg-background border-l z-50",
                "transform transition-transform duration-300 ease-in-out",
                activePanel ? "translate-x-0" : "translate-x-full"
              )}
            >
              <div className="h-full flex flex-col">
                <div className="p-4 border-b flex justify-between items-center">
                  <h3 className="text-lg font-semibold">
                    {activePanel === "chat" && "Chat"}
                    {activePanel === "participants" && "Participants"}
                    {activePanel === "settings" && "Settings"}
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
                  {activePanel === "chat" && <RoomChat />}
                  {activePanel === "participants" && <ParticipantsList />}
                  {activePanel === "settings" && (
                    <RoomSettings isOpen={isSettingsOpen} />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
  
      {/* Mobile Sheet */}
      <Sheet
        open={isMobile && !!activePanel}
        onOpenChange={(open) => {
          if (!open) setActivePanel(null);
        }}
      >
        <SheetContent 
          side="right" 
          className="w-[90vw] rounded-l-2xl"
        >
          <div className="h-full flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                {activePanel === "chat" && "Chat"}
                {activePanel === "participants" && "Participants"}
                {activePanel === "settings" && "Settings"}
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
              {activePanel === "chat" && <RoomChat />}
              {activePanel === "participants" && <ParticipantsList />}
              {activePanel === "settings" && (
                <RoomSettings isOpen={isSettingsOpen} />
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
