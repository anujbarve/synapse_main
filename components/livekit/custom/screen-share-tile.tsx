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

// In screen-share-tile.tsx, enhance the component:
export function ScreenShareTile({ participant, className }: ScreenShareTileProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [aspectRatio, setAspectRatio] = useState(16/9);
    
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
            
            // Monitor video dimensions to maintain proper aspect ratio
            const updateAspectRatio = () => {
              if (videoRef.current && videoRef.current.videoWidth && videoRef.current.videoHeight) {
                setAspectRatio(videoRef.current.videoWidth / videoRef.current.videoHeight);
              }
            };
            
            // Set initial aspect ratio after a short delay
            setTimeout(updateAspectRatio, 500);
            
            // Update aspect ratio when video dimensions change
            videoRef.current.addEventListener('resize', updateAspectRatio);
            
            return () => {
              if (videoRef.current) {
                videoRef.current.removeEventListener('resize', updateAspectRatio);
              }
            };
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
    
    // In screen-share-tile.tsx (continued):
  
  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if ((containerRef.current as any).webkitRequestFullscreen) {
        (containerRef.current as any).webkitRequestFullscreen();
      } else if ((containerRef.current as any).mozRequestFullScreen) {
        (containerRef.current as any).mozRequestFullScreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen();
      }
    }
  };
  
  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        !!document.fullscreenElement || 
        !!(document as any).webkitFullscreenElement || 
        !!(document as any).mozFullScreenElement
      );
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all duration-200", 
        className
      )} 
      ref={containerRef}
      style={{
        // Maintain aspect ratio of the screen share
        aspectRatio: aspectRatio > 0 ? aspectRatio : 16/9
      }}
    >
      <CardContent className="p-0 relative h-full">
        <video 
          ref={videoRef}
          autoPlay 
          playsInline
          className="w-full h-full object-contain bg-black"
        />
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 flex justify-between items-center opacity-0 hover:opacity-100 transition-opacity">
          <span className="text-sm font-medium text-white">
            {participant.identity}'s screen
          </span>
          
          <div className="flex gap-2">
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
        </div>
      </CardContent>
    </Card>
  );
}