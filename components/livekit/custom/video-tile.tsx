// components/custom/video-tile.tsx
import { useRef, useEffect, useState } from "react";
import { Participant, Track, TrackPublication } from "livekit-client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Mic, MicOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface VideoTileProps {
  participant: Participant;
  className?: string;
  showMuteIndicator?: boolean;
}

// In video-tile.tsx, enhance the video display:
export function VideoTile({ participant, className, showMuteIndicator = true }: VideoTileProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [microphoneMuted, setMicrophoneMuted] = useState(false);
    const [videoLoaded, setVideoLoaded] = useState(false);
    
    // Set up video with better track detection and attachment
    useEffect(() => {
      let attemptCount = 0;
      const maxAttempts = 3;
      
      const setupVideo = async () => {
        // Get the camera track publication
        const videoPublication = participant.getTrackPublication(Track.Source.Camera);
        const videoTrack = videoPublication?.track;
        
        // If we have a track and a video element, attach them
        if (videoTrack && videoRef.current) {
          try {
            // Force track attachment
            await videoTrack.attach(videoRef.current);
            
            // Make sure the video plays
            if (videoRef.current.paused) {
              try {
                await videoRef.current.play();
                setVideoLoaded(true);
              } catch (error) {
                console.warn('Auto-play failed:', error);
                
                // Try again if we haven't reached max attempts
                if (attemptCount < maxAttempts) {
                  attemptCount++;
                  setTimeout(setupVideo, 1000);
                }
              }
            } else {
              setVideoLoaded(true);
            }
          } catch (error) {
            console.error('Error attaching video track:', error);
            
            // Try again if we haven't reached max attempts
            if (attemptCount < maxAttempts) {
              attemptCount++;
              setTimeout(setupVideo, 1000);
            }
          }
        }
      };
      
      setupVideo();
      
      // Clean up on unmount
      return () => {
        const videoPublication = participant.getTrackPublication(Track.Source.Camera);
        const videoTrack = videoPublication?.track;
        if (videoTrack && videoRef.current) {
          videoTrack.detach(videoRef.current);
        }
        setVideoLoaded(false);
      };
    }, [participant]);
    
    // Add a listener for video element events
    useEffect(() => {
      if (!videoRef.current) return;
      
      const handleLoadedMetadata = () => {
        setVideoLoaded(true);
      };
      
      const handleError = (e: Event) => {
        console.error('Video error:', e);
        setVideoLoaded(false);
      };
      
      videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      videoRef.current.addEventListener('error', handleError);
      
      return () => {
        if (videoRef.current) {
          videoRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
          videoRef.current.removeEventListener('error', handleError);
        }
      };
    }, [videoRef.current]);
    
    // Rest of your existing useEffects...
    
    // Check if camera is enabled
    const cameraPublication = participant.getTrackPublication(Track.Source.Camera);
    const cameraEnabled = 
      !!cameraPublication?.track && 
      !cameraPublication.isMuted &&
      videoLoaded;
    
    // Check if screen share is enabled
    const screenSharePublication = participant.getTrackPublication(Track.Source.ScreenShare);
    const isScreenSharing = !!screenSharePublication?.track && !screenSharePublication.isMuted;
    
    return (
      <Card className={cn(
        "overflow-hidden", 
        isSpeaking ? "ring-2 ring-primary" : "",
        className
      )}>
        <CardContent className="p-0 relative aspect-video">
          {cameraEnabled ? (
            <video 
              ref={videoRef}
              autoPlay 
              playsInline
              muted={participant.isLocal}
              className={cn(
                "w-full h-full object-cover",
                !videoLoaded && "hidden"
              )}
            />
          ) : null}
          
          {/* Fallback when video is not available */}
          {!cameraEnabled && (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                <AvatarFallback>{participant.identity.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            </div>
          )}
          
          {/* Hidden audio element */}
          <audio ref={audioRef} autoPlay playsInline muted={participant.isLocal} />
          
          {/* Participant info overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm font-medium text-white truncate max-w-[70%]">
                {participant.identity} {participant.isLocal && "(You)"}
              </span>
              
              <div className="flex items-center gap-1 sm:gap-2">
                {isScreenSharing && (
                  <Badge variant="secondary" className="bg-blue-500 text-white text-xs py-0 h-5">
                    Sharing
                  </Badge>
                )}
                
                {showMuteIndicator && (
                  microphoneMuted ? 
                    <MicOff className="h-3 w-3 sm:h-4 sm:w-4 text-white" /> : 
                    <Mic className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }