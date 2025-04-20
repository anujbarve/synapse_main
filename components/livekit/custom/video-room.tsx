// components/custom/video-room.tsx
import { useState, useEffect, useRef } from "react";
import { useParticipants, useRoomContext } from "@livekit/components-react";
import { Track, RemoteParticipant, Participant } from "livekit-client";
import { VideoGrid } from "./video-grid";
import { MediaControls } from "./media-controls";
import { RoomChat } from "./room-chat";
import { ParticipantsList } from "./participants-list";
import { RoomSettings } from "./room-settings";
import { ScreenShareTile } from "./screen-share-tile";
import { VideoTile } from "./video-tile";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { CircleCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { saveAs } from "file-saver";
import { toast } from "sonner";

interface VideoRoomProps {
  roomName: string;
  initialVideo?: boolean;
  initialAudio?: boolean;
  isBanned?: boolean;
  isMuted?: boolean;
  communityId?: string;
  banReason?: string | null;
  muteReason?: string | null;
}

const BannedScreen = ({ reason }: { reason?: string | null }) => (
  <div className="flex flex-col items-center justify-center h-full bg-background">
    <div className="text-center p-8 max-w-md">
      <h2 className="text-2xl font-bold text-red-500 mb-4">Access Restricted</h2>
      <p className="text-muted-foreground mb-2">
        You have been banned from this community.
      </p>
      {reason && (
        <p className="text-sm text-muted-foreground italic">
          Reason: {reason}
        </p>
      )}
      <p className="text-sm text-muted-foreground mt-4">
        Please contact the community administrators for more information.
      </p>
    </div>
  </div>
);

export function VideoRoom({
  roomName,
  initialVideo = false,
  initialAudio = false,
  isBanned = false,
  isMuted = false,
  banReason,
}: VideoRoomProps) {
  const room = useRoomContext();
  const participants = useParticipants();
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [screenShareParticipant, setScreenShareParticipant] =
    useState<Participant | null>(null);
  const [layout, setLayout] = useState<"grid" | "presentation">("grid");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Handle recording start
  const handleStartRecording = async () => {
    try {
      // Clear previous recording data
      recordedChunksRef.current = [];
      setRecordingBlob(null);

      // Show toast notification that recording is about to start
      toast.info("Preparing to record...", {
        description:
          "Please select the window containing the meeting in the next dialog.",
        duration: 5000,
      });

      // Use the browser's getDisplayMedia API to capture the screen
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "window", // Try to focus on a specific window
        },
        audio: true, // Try to capture system audio if supported
      });

      // Try to get audio from microphone as well
      let audioStream: MediaStream | null = null;
      try {
        audioStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
      } catch (e) {
        console.warn("Could not get microphone access for recording:", e);
        toast.warning("Could not access microphone", {
          description: "Recording will continue without microphone audio.",
          duration: 4000,
        });
      }

      // Combine the streams if we have audio
      if (audioStream) {
        const audioTrack = audioStream.getAudioTracks()[0];
        if (audioTrack) {
          displayStream.addTrack(audioTrack);
        }
      }

      // Check for MP4 support, fallback to WebM
      let mimeType = "video/webm";
      if (MediaRecorder.isTypeSupported("video/mp4")) {
        mimeType = "video/mp4";
      }

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(displayStream, {
        mimeType,
        videoBitsPerSecond: 3000000, // 3 Mbps for better quality
      });

      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // When recording stops, create a blob from all chunks
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        setRecordingBlob(blob);

        // Stop all tracks to release resources
        displayStream.getTracks().forEach((track) => track.stop());
        if (audioStream) {
          audioStream.getTracks().forEach((track) => track.stop());
        }

        // Show toast notification that recording has stopped
        toast.success("Recording complete!", {
          description: "Your recording is ready to download.",
          duration: 5000,
        });
      };

      // Store the recorder reference
      mediaRecorderRef.current = mediaRecorder;

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);

      // Show toast notification that recording has started
      toast.success("Recording started", {
        description: "Your meeting is now being recorded.",
        duration: 3000,
      });
    } catch (error) {
      console.error("Failed to start recording:", error);
      toast.error("Failed to start recording", {
        description: "Please check console for details and try again.",
        duration: 5000,
      });
    }
  };

  // Handle recording stop
  const handleStopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      toast.info("Stopping recording...", {
        duration: 2000,
      });
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Handle download recording
  const handleDownloadRecording = () => {
    if (!recordingBlob) {
      toast.error("No recording available", {
        description: "There is no recording available to download.",
        duration: 3000,
      });
      return;
    }

    try {
      // Determine file extension based on MIME type
      const fileExtension = recordingBlob.type.includes("mp4") ? "mp4" : "webm";

      // Create a formatted date string for the filename
      const dateStr = new Date().toISOString().replace(/[:.]/g, "-");

      // Create the filename
      const fileName = `meeting-${roomName}-${dateStr}.${fileExtension}`;

      // Use FileSaver to save the file
      saveAs(recordingBlob, fileName);

      // Show toast notification that download has started
      toast.success("Download started", {
        description: "Your recording is being downloaded.",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error downloading recording:", error);
      toast.error("Download failed", {
        description: "Failed to download recording. Please try again.",
        duration: 4000,
      });
    }
  };


  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);
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

   // Modify the initial device setup effect to respect muted state
   useEffect(() => {
    if (!room.localParticipant) return;

    const setupInitialState = async () => {
      try {
        if (isMuted) {
          await room.localParticipant.setCameraEnabled(false);
          await room.localParticipant.setMicrophoneEnabled(false);
        } else {
          if (initialVideo !== room.localParticipant.isCameraEnabled) {
            await room.localParticipant.setCameraEnabled(initialVideo);
          }
          if (initialAudio !== room.localParticipant.isMicrophoneEnabled) {
            await room.localParticipant.setMicrophoneEnabled(initialAudio);
          }
        }
      } catch (e) {
        console.error("Error setting initial device state:", e);
      }
    };

    const timer = setTimeout(setupInitialState, 1000);
    return () => clearTimeout(timer);
  }, [room.localParticipant, initialVideo, initialAudio, isMuted]);

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

  if (isBanned) {
    return <BannedScreen reason={banReason} />;
  }

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
                      <div key={participant.sid} className="w-32 flex-shrink-0">
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
              onToggleChat={() => !isMuted && togglePanel("chat")}
              onToggleParticipants={() => togglePanel("participants")}
              onToggleSettings={() => togglePanel("settings")}
              activePanel={activePanel}
              isRecording={isRecording}
              onStartRecording={!isMuted ? handleStartRecording : undefined}
              onStopRecording={handleStopRecording}
              isMuted={isMuted}
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

      {/* Fixed Download Panel */}
      {!isRecording && recordingBlob && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-background border shadow-lg rounded-lg p-4 z-50 flex flex-col items-center">
          <h3 className="font-medium mb-2">Recording Complete</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Your recording is ready to download
          </p>
          <div className="flex gap-2">
            <Button
              onClick={handleDownloadRecording}
              className="bg-primary hover:bg-primary/90"
            >
              <CircleCheck className="h-4 w-4 mr-2" />
              Download Recording
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setRecordingBlob(null);
                toast.info("Recording dismissed", {
                  description: "The recording has been discarded.",
                  duration: 3000,
                });
              }}
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Mobile Sheet */}
      <Sheet
        open={isMobile && !!activePanel}
        onOpenChange={(open) => {
          if (!open) setActivePanel(null);
        }}
      >
        <SheetContent side="right" className="w-[90vw] rounded-l-2xl">
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
