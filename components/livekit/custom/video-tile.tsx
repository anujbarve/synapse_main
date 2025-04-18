// components/custom/video-tile.tsx
import { useRef, useEffect, useState } from "react";
import {
  Participant,
  Track,
  TrackPublication,
  RemoteTrack,
  RemoteTrackPublication,
  ParticipantEvent, 
} from "livekit-client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Mic, MicOff, ScreenShare } from "lucide-react"; 
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface VideoTileProps {
  participant: Participant;
  className?: string;
  showMuteIndicator?: boolean;
}

export function VideoTile({
  participant,
  className,
  showMuteIndicator = true,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const [isSpeaking, setIsSpeaking] = useState(participant.isSpeaking);
  const [microphoneMuted, setMicrophoneMuted] = useState(false); // We'll update this based on track state
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // --- Track Handling and State Updates ---

  useEffect(() => {
    // --- Helper Functions for Track Management ---
    const handleTrackSubscribed = (
      track: RemoteTrack,
      publication: RemoteTrackPublication
    ) => {
      if (track.kind === Track.Kind.Video) {
        if (publication.source === Track.Source.Camera && videoRef.current) {
          console.log(`Attaching video track: ${participant.identity}`);
          track.attach(videoRef.current);
          setCameraEnabled(true);
        } else if (publication.source === Track.Source.ScreenShare) {
          // Optionally handle screen share video display differently if needed
          // For now, we just track the state
          setIsScreenSharing(true);
        }
      } else if (track.kind === Track.Kind.Audio) {
        if (publication.source === Track.Source.Microphone && audioRef.current) {
          console.log(`Attaching audio track: ${participant.identity}`);
          // Don't mute remote audio elements
          audioRef.current.muted = false;
          track.attach(audioRef.current);
        }
      }

      // Update mute state when a track is subscribed
      if (publication.source === Track.Source.Microphone) {
          setMicrophoneMuted(publication.isMuted);
      }
    };

    const handleTrackUnsubscribed = (
      track: RemoteTrack,
      publication: RemoteTrackPublication
    ) => {
      console.log(`Detaching track: ${participant.identity}, source: ${publication.source}`);
      track.detach(); // Detach from all elements

      if (publication.source === Track.Source.Camera) {
        setCameraEnabled(false);
      } else if (publication.source === Track.Source.ScreenShare) {
        setIsScreenSharing(false);
      } else if (publication.source === Track.Source.Microphone) {
        // Reset mute state, though the track is gone
        setMicrophoneMuted(false);
      }
    };

    const handleTrackMuted = (publication: TrackPublication) => {
      if (publication.source === Track.Source.Microphone) {
        console.log(`Mic muted: ${participant.identity}`);
        setMicrophoneMuted(true);
      }
       if (publication.source === Track.Source.Camera) {
           // Also update camera enabled state if camera is muted
           setCameraEnabled(false);
       }
       if (publication.source === Track.Source.ScreenShare) {
           setIsScreenSharing(false);
       }
    };

    const handleTrackUnmuted = (publication: TrackPublication) => {
      if (publication.source === Track.Source.Microphone) {
        console.log(`Mic unmuted: ${participant.identity}`);
        setMicrophoneMuted(false);
      }
      if (publication.source === Track.Source.Camera) {
        // Re-check if track exists before enabling
         if (publication.track && videoRef.current) {
             publication.track.attach(videoRef.current); // Re-attach just in case
             setCameraEnabled(true);
         } else {
            // If track doesn't exist for some reason, ensure it stays disabled
            setCameraEnabled(!!publication.track);
         }
      }
      if (publication.source === Track.Source.ScreenShare) {
          setIsScreenSharing(!!publication.track); // Enable if track exists
      }
    };

    const handleIsSpeakingChanged = (speaking: boolean) => {
       // console.log(`${participant.identity} speaking: ${speaking}`); // Can be noisy
       setIsSpeaking(speaking);
    };


    // --- Initial Setup ---
    // Iterate over existing tracks and attach them
    participant.trackPublications.forEach((publication) => {
       // Handle Remote Tracks immediately if already subscribed
       if (publication.track && publication.isSubscribed) {
           handleTrackSubscribed(publication.track as RemoteTrack, publication as RemoteTrackPublication);
       }
       // For local tracks (camera only needed for display)
       else if (participant.isLocal && publication.track) {
           if (publication.source === Track.Source.Camera && videoRef.current) {
               console.log(`Attaching local video track: ${participant.identity}`);
               publication.track.attach(videoRef.current);
               setCameraEnabled(!publication.isMuted); // Set based on initial mute state
           }
           // Update screen share state for local user too
            if (publication.source === Track.Source.ScreenShare) {
                setIsScreenSharing(!publication.isMuted);
            }
       }


        // Set initial microphone mute state regardless of subscribed status
        if (publication.source === Track.Source.Microphone) {
            setMicrophoneMuted(publication.isMuted);
        }
    });


    // --- Attach Event Listeners ---
    participant.on(ParticipantEvent.TrackSubscribed, handleTrackSubscribed);
    participant.on(ParticipantEvent.TrackUnsubscribed, handleTrackUnsubscribed);
    participant.on(ParticipantEvent.TrackMuted, handleTrackMuted);
    participant.on(ParticipantEvent.TrackUnmuted, handleTrackUnmuted);
    participant.on(ParticipantEvent.IsSpeakingChanged, handleIsSpeakingChanged);
    // Handle publication events too, useful if tracks are published/unpublished
     participant.on(ParticipantEvent.TrackPublished, (pub) => {
         if (pub.source === Track.Source.Microphone) setMicrophoneMuted(pub.isMuted);
         if (pub.source === Track.Source.Camera) setCameraEnabled(!pub.isMuted && !!pub.track);
         if (pub.source === Track.Source.ScreenShare) setIsScreenSharing(!pub.isMuted && !!pub.track);
     });
     participant.on(ParticipantEvent.TrackUnpublished, (pub) => {
         if (pub.source === Track.Source.Microphone) setMicrophoneMuted(false);
         if (pub.source === Track.Source.Camera) setCameraEnabled(false);
         if (pub.source === Track.Source.ScreenShare) setIsScreenSharing(false);
     });


    // --- Cleanup Function ---
    return () => {
      console.log(`Cleaning up listeners for ${participant.identity}`);
      // Detach all tracks for this participant
      participant.trackPublications.forEach((publication) => {
        if (publication.track) {
          publication.track.detach();
        }
      });

      // Remove all listeners
      participant.off(ParticipantEvent.TrackSubscribed, handleTrackSubscribed);
      participant.off(ParticipantEvent.TrackUnsubscribed, handleTrackUnsubscribed);
      participant.off(ParticipantEvent.TrackMuted, handleTrackMuted);
      participant.off(ParticipantEvent.TrackUnmuted, handleTrackUnmuted);
      participant.off(ParticipantEvent.IsSpeakingChanged, handleIsSpeakingChanged);


      // Reset state on cleanup
      setCameraEnabled(false);
      setIsScreenSharing(false);
      setMicrophoneMuted(false);
      setIsSpeaking(false);
    };
  }, [participant]); // Re-run effect if the participant object itself changes


  // Ensure video plays when enabled (needed for some browsers)
  useEffect(() => {
      if (cameraEnabled && videoRef.current && videoRef.current.paused) {
          videoRef.current.play().catch(e => console.warn(`Video play failed for ${participant.identity}:`, e));
      }
  }, [cameraEnabled, participant.identity]); // Run when cameraEnabled changes


  return (
    <Card
      className={cn(
        "overflow-hidden relative", // Added relative positioning for overlay
        isSpeaking ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "", // Added offset
        className
      )}
    >
      <CardContent className="p-0 relative aspect-video bg-muted">
        {/* Video Element */}
        {/* Render video element conditionally but keep it in DOM if participant is local for smoother transitions? Or rely solely on cameraEnabled */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={participant.isLocal} // Local video should be muted
          className={cn(
            "w-full h-full object-cover",
            !cameraEnabled && "hidden" // Hide if camera is not enabled
          )}
          // Optional: Add event listeners directly if needed, e.g., for loading indicator
          // onLoadedData={() => console.log(`Video loaded for ${participant.identity}`)}
          // onError={(e) => console.error(`Video error for ${participant.identity}:`, e)}
        />

        {/* Fallback Avatar */}
        {!cameraEnabled && (
          <div className="w-full h-full flex items-center justify-center ">
            <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
              {/* You could add participant.metadata for image URL here */}
              <AvatarFallback>
                {participant.identity?.slice(0, 2).toUpperCase() || "???"}
              </AvatarFallback>
            </Avatar>
          </div>
        )}

        {/* Audio Element (always present but track attached conditionally) */}
        {/* Only render audio element for remote participants to avoid playing local audio back */}
        {!participant.isLocal && (
             <audio ref={audioRef} autoPlay playsInline />
        )}

        {/* Participant Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent p-2 text-white">
          <div className="flex justify-between items-center gap-2">
            <span className="text-xs sm:text-sm font-medium truncate shrink min-w-0">
              {participant.identity} {participant.isLocal && "(You)"}
            </span>

            <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
              {isScreenSharing && (
                  <TooltipProvider>
                      <Tooltip>
                          <TooltipTrigger>
                              <ScreenShare className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400" />
                           </TooltipTrigger>
                           <TooltipContent>
                              <p>Screen Sharing</p>
                           </TooltipContent>
                      </Tooltip>
                  </TooltipProvider>
              )}

              {showMuteIndicator && (
                microphoneMuted ? (
                  <MicOff className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                ) : (
                  <Mic className="h-3 w-3 sm:h-4 sm:w-4" />
                )
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
