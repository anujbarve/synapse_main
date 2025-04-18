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

export function VideoTile({ participant, className, showMuteIndicator = true }: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [microphoneMuted, setMicrophoneMuted] = useState(false);
  
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
  
  // Set up speaking detection and mute state
  useEffect(() => {
    const handleSpeakingChanged = () => {
      setIsSpeaking(participant.isSpeaking);
    };
    
    const handleMuteChanged = (pub: TrackPublication) => {
      if (pub.source === Track.Source.Microphone) {
        setMicrophoneMuted(pub.isMuted);
      }
    };
    
    // Initialize mute state
    const micPub = participant.getTrackPublication(Track.Source.Microphone);
    if (micPub) {
      setMicrophoneMuted(micPub.isMuted);
    }
    
    participant.on('isSpeakingChanged', handleSpeakingChanged);
    participant.on('trackMuted', handleMuteChanged);
    participant.on('trackUnmuted', handleMuteChanged);
    
    return () => {
      participant.off('isSpeakingChanged', handleSpeakingChanged);
      participant.off('trackMuted', handleMuteChanged);
      participant.off('trackUnmuted', handleMuteChanged);
    };
  }, [participant]);
  
  // Check if camera is enabled
  const cameraPublication = participant.getTrackPublication(Track.Source.Camera);
  const cameraEnabled = 
    !!cameraPublication?.track && 
    !cameraPublication.isMuted;
  
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
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-white">
              {participant.identity} {participant.isLocal && "(You)"}
            </span>
            
            <div className="flex items-center gap-2">
              {isScreenSharing && (
                <Badge variant="secondary" className="bg-blue-500 text-white">
                  Sharing
                </Badge>
              )}
              
              {!cameraEnabled && (
                <Badge variant="secondary" className="bg-slate-500 text-white">
                  Video Off
                </Badge>
              )}
              
              {showMuteIndicator && (
                microphoneMuted ? 
                  <MicOff className="h-4 w-4 text-white" /> : 
                  <Mic className="h-4 w-4 text-white" />
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}