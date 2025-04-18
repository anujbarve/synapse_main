// components/custom/screen-share-tile.tsx
import { useRef, useEffect } from "react";
import { Participant, Track } from "livekit-client";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ScreenShareTileProps {
  participant: Participant;
  className?: string;
}

export function ScreenShareTile({ participant, className }: ScreenShareTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Set up screen share video
  useEffect(() => {
    const screenSharePublication = participant.getTrackPublication(Track.Source.ScreenShare);
    const screenShareTrack = screenSharePublication?.track;
    
    if (screenShareTrack && videoRef.current) {
      screenShareTrack.attach(videoRef.current);
      return () => {
        screenShareTrack.detach();
      };
    }
  }, [participant]);
  
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-0 relative">
        <video 
          ref={videoRef}
          autoPlay 
          playsInline
          className="w-full h-full object-contain"
        />
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
          <span className="text-sm font-medium text-white">
            {participant.identity}'s screen
          </span>
        </div>
      </CardContent>
    </Card>
  );
}