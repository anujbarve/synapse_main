// components/custom/screen-share-tile.tsx
import { useRef, useEffect, useState } from "react";
import { Participant, Track } from "livekit-client";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScreenShareTileProps {
  participant: Participant;
  className?: string;
}

export function ScreenShareTile({ participant, className }: ScreenShareTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Set up screen share video with improved track attachment
  useEffect(() => {
    const setupScreenShare = async () => {
      const screenSharePublication = participant.getTrackPublication(Track.Source.ScreenShare);
      const screenShareTrack = screenSharePublication?.track;
      
      if (screenShareTrack && videoRef.current) {
        try {
          // Force track attachment
          await screenShareTrack.attach(videoRef.current);
          
          // Make sure the video plays
          if (videoRef.current.paused) {
            await videoRef.current.play().catch(error => {
              console.warn('Auto-play failed:', error);
            });
          }
        } catch (error) {
          console.error('Error attaching screen share track:', error);
        }
      }
    };
    
    setupScreenShare();
    
    // Clean up on unmount
    return () => {
      const screenSharePublication = participant.getTrackPublication(Track.Source.ScreenShare);
      const screenShareTrack = screenSharePublication?.track;
      if (screenShareTrack && videoRef.current) {
        screenShareTrack.detach(videoRef.current);
      }
    };
  }, [participant]);
  
  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };
  
  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  return (
    <Card className={cn("overflow-hidden", className)} ref={containerRef}>
      <CardContent className="p-0 relative">
        <video 
          ref={videoRef}
          autoPlay 
          playsInline
          className="w-full h-full object-contain bg-black"
        />
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 flex justify-between items-center">
          <span className="text-sm font-medium text-white">
            {participant.identity}'s screen
          </span>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-white/20"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? 
              <Minimize2 className="h-4 w-4" /> : 
              <Maximize2 className="h-4 w-4" />
            }
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}