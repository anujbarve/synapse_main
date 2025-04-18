// components/custom/video-tile.tsx
import { useRef, useEffect } from "react";
import { Participant, Track } from "livekit-client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface VideoTileProps {
  participant: Participant;
  className?: string;
}

export function VideoTile({ participant, className }: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Set up video
  useEffect(() => {
    const videoPublication = participant.getTrackPublication(Track.Source.Camera);
    const videoTrack = videoPublication?.track;
    
    if (videoTrack && videoRef.current) {
      videoTrack.attach(videoRef.current);
      return () => {
        videoTrack.detach();
      };
    }
  }, [participant]);
  
  // Set up audio
  useEffect(() => {
    const audioPublication = participant.getTrackPublication(Track.Source.Microphone);
    const audioTrack = audioPublication?.track;
    
    if (audioTrack && audioRef.current) {
      audioTrack.attach(audioRef.current);
      return () => {
        audioTrack.detach();
      };
    }
  }, [participant]);
  
  // Check if camera is enabled
  const cameraPublication = participant.getTrackPublication(Track.Source.Camera);
  const cameraEnabled = 
    !!cameraPublication?.track && 
    !cameraPublication.isMuted;
  
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-0 relative aspect-video">
        {cameraEnabled ? (
          <video 
            ref={videoRef}
            autoPlay 
            playsInline
            muted={participant.isLocal}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <Avatar className="h-20 w-20">
              <AvatarFallback>{participant.identity.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
        )}
        
        {/* Hidden audio element */}
        <audio ref={audioRef} autoPlay playsInline muted={participant.isLocal} />
        
        {/* Participant info overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
          <span className="text-sm font-medium text-white">
            {participant.identity} {participant.isLocal && "(You)"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}