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

// Define a type for fullscreen-related methods
interface FullscreenElement extends HTMLElement {
  webkitRequestFullscreen?: () => void;
  mozRequestFullScreen?: () => void;
}

interface FullscreenDocument extends Document {
  webkitFullscreenElement?: Element;
  mozFullScreenElement?: Element;
  webkitExitFullscreen?: () => void;
  mozCancelFullScreen?: () => void;
}

export function ScreenShareTile({ participant, className }: ScreenShareTileProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [aspectRatio, setAspectRatio] = useState(16/9);
    
    // Set up screen share video with improved track attachment
    useEffect(() => {
      let currentVideoElement: HTMLVideoElement | null = null;
      const setupScreenShare = async () => {
        const screenSharePublication = participant.getTrackPublication(Track.Source.ScreenShare);
        const screenShareTrack = screenSharePublication?.track;
        
        if (screenShareTrack && videoRef.current) {
          try {
            // Store reference to current video element
            currentVideoElement = videoRef.current;

            // Force track attachment
            await screenShareTrack.attach(currentVideoElement);
            
            // Make sure the video plays
            if (currentVideoElement.paused) {
              await currentVideoElement.play().catch(error => {
                console.warn('Auto-play failed:', error);
              });
            }
            
            // Monitor video dimensions to maintain proper aspect ratio
            const updateAspectRatio = () => {
              if (currentVideoElement && currentVideoElement.videoWidth && currentVideoElement.videoHeight) {
                setAspectRatio(currentVideoElement.videoWidth / currentVideoElement.videoHeight);
              }
            };
            
            // Set initial aspect ratio after a short delay
            setTimeout(updateAspectRatio, 500);
            
            // Update aspect ratio when video dimensions change
            currentVideoElement.addEventListener('resize', updateAspectRatio);
            
            return () => {
              if (currentVideoElement) {
                currentVideoElement.removeEventListener('resize', updateAspectRatio);
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
        if (screenShareTrack && currentVideoElement) {
          screenShareTrack.detach(currentVideoElement);
        }
      };
    }, [participant]);
  
    // Handle fullscreen toggle
    const toggleFullscreen = () => {
      if (!containerRef.current) return;
      
      const fullscreenDoc = document as FullscreenDocument;
      const fullscreenContainer = containerRef.current as FullscreenElement;
      
      const requestFullscreen = 
        fullscreenContainer.requestFullscreen || 
        fullscreenContainer.webkitRequestFullscreen || 
        fullscreenContainer.mozRequestFullScreen;
      
      const exitFullscreen = 
        fullscreenDoc.exitFullscreen || 
        fullscreenDoc.webkitExitFullscreen || 
        fullscreenDoc.mozCancelFullScreen;
      
      if (!isFullscreen && requestFullscreen) {
        requestFullscreen.call(fullscreenContainer);
      } else if (isFullscreen && exitFullscreen) {
        exitFullscreen.call(fullscreenDoc);
      }
    };
  
    // Listen for fullscreen changes
    useEffect(() => {
      const fullscreenDoc = document as FullscreenDocument;
      
      const handleFullscreenChange = () => {
        setIsFullscreen(
          !!document.fullscreenElement || 
          !!fullscreenDoc.webkitFullscreenElement || 
          !!fullscreenDoc.mozFullScreenElement
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
              {participant.identity}&apos;s screen
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