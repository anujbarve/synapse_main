// components/custom/room-settings.tsx
import { useState, useEffect, useRef } from "react";
import { useRoomContext } from "@livekit/components-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface RoomSettingsProps {
  isOpen?: boolean;
}

export function RoomSettings({ isOpen = true }: RoomSettingsProps) {
  const room = useRoomContext();
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [speakerDevices, setSpeakerDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>("");
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>("");
  const [selectedSpeakerDevice, setSelectedSpeakerDevice] = useState<string>("");
  const [mirrorVideo, setMirrorVideo] = useState(true);
  const [previewTrack, setPreviewTrack] = useState<MediaStreamTrack | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  
  // Load available devices
  useEffect(() => {
    async function loadDevices() {
      try {
        // Request permissions first
        await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        
        const videoInputs = devices.filter(device => device.kind === 'videoinput');
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        const audioOutputs = devices.filter(device => device.kind === 'audiooutput');
        
        setVideoDevices(videoInputs);
        setAudioDevices(audioInputs);
        setSpeakerDevices(audioOutputs);
        
        // Set initial selected devices
        if (videoInputs.length > 0) {
          setSelectedVideoDevice(videoInputs[0].deviceId);
        }
        
        if (audioInputs.length > 0) {
          setSelectedAudioDevice(audioInputs[0].deviceId);
        }
        
        if (audioOutputs.length > 0) {
          setSelectedSpeakerDevice(audioOutputs[0].deviceId);
        }
      } catch (e) {
        console.error("Error loading devices:", e);
      }
    }
    
    loadDevices();
    
    // Listen for device changes
    navigator.mediaDevices.addEventListener('devicechange', loadDevices);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', loadDevices);
    };
  }, []);
  
  // Create and attach preview
  useEffect(() => {
    let track: MediaStreamTrack | null = null;
    let stream: MediaStream | null = null;
    
    async function startVideoPreview() {
      if (selectedVideoDevice && isOpen) {
        try {
          // Stop any existing preview track
          if (previewTrack) {
            previewTrack.stop();
            setPreviewTrack(null);
          }
          
          // Stop any existing stream
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }
          
          // Create a new stream with the selected device
          stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: selectedVideoDevice }
          });
          
          track = stream.getVideoTracks()[0];
          setPreviewTrack(track);
          
          if (videoPreviewRef.current && track) {
            videoPreviewRef.current.srcObject = new MediaStream([track]);
            
            // Ensure the video plays
            try {
              await videoPreviewRef.current.play();
            } catch (e) {
              console.warn('Auto-play failed:', e);
            }
          }
        } catch (e) {
          console.error("Error starting video preview:", e);
        }
      }
    }
    
    // Add a small delay to ensure DOM is ready
    const timer = setTimeout(startVideoPreview, 100);
    
    // Cleanup function
    return () => {
      clearTimeout(timer);
      if (track) {
        track.stop();
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      setPreviewTrack(null);
    };
  }, [selectedVideoDevice, isOpen, previewTrack]);
  // Cleanup when component unmounts or when isOpen changes
  useEffect(() => {
    if (!isOpen && previewTrack) {
      previewTrack.stop();
      setPreviewTrack(null);
    }
    
    return () => {
      if (previewTrack) {
        previewTrack.stop();
        setPreviewTrack(null);
      }
    };
  }, [isOpen, previewTrack]);
  
  const applySettings = async () => {
    try {
      if (selectedVideoDevice) {
        await room.switchActiveDevice('videoinput', selectedVideoDevice);
      }
      
      if (selectedAudioDevice) {
        await room.switchActiveDevice('audioinput', selectedAudioDevice);
      }
      
      if (selectedSpeakerDevice) {
        await room.switchActiveDevice('audiooutput', selectedSpeakerDevice);
      }
      
      // Force republish tracks after device switch
      setTimeout(async () => {
        const localParticipant = room.localParticipant;
        
        // Force camera republish if enabled
        if (localParticipant.isCameraEnabled) {
          await localParticipant.setCameraEnabled(false);
          await localParticipant.setCameraEnabled(true);
        }
        
        // Force microphone republish if enabled
        if (!localParticipant.isMicrophoneEnabled) {
          await localParticipant.setMicrophoneEnabled(false);
          await localParticipant.setMicrophoneEnabled(true);
        }
      }, 500);
    } catch (e) {
      console.error("Error applying settings:", e);
    }
  };
  
  return (
    <Card className="flex flex-col h-full">
      <CardContent className="space-y-4 overflow-auto">
        <div className="space-y-2">
          <Label htmlFor="camera">Camera</Label>
          <Select 
            value={selectedVideoDevice} 
            onValueChange={setSelectedVideoDevice}
          >
            <SelectTrigger id="camera">
              <SelectValue placeholder="Select camera" />
            </SelectTrigger>
            <SelectContent>
              {videoDevices.map(device => (
                <SelectItem key={device.deviceId} value={device.deviceId}>
                  {device.label || `Camera ${videoDevices.indexOf(device) + 1}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Camera preview */}
          <div className="mt-2 bg-muted rounded-md aspect-video overflow-hidden">
            <video 
              ref={videoPreviewRef} 
              autoPlay 
              playsInline 
              muted 
              className={cn(
                "w-full h-full object-cover",
                mirrorVideo && "scale-x-[-1]"
              )} 
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="microphone">Microphone</Label>
          <Select 
            value={selectedAudioDevice} 
            onValueChange={setSelectedAudioDevice}
          >
            <SelectTrigger id="microphone">
              <SelectValue placeholder="Select microphone" />
            </SelectTrigger>
            <SelectContent>
              {audioDevices.map(device => (
                <SelectItem key={device.deviceId} value={device.deviceId}>
                  {device.label || `Microphone ${audioDevices.indexOf(device) + 1}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="speaker">Speaker</Label>
          <Select 
            value={selectedSpeakerDevice} 
            onValueChange={setSelectedSpeakerDevice}
          >
            <SelectTrigger id="speaker">
              <SelectValue placeholder="Select speaker" />
            </SelectTrigger>
            <SelectContent>
              {speakerDevices.map(device => (
                <SelectItem key={device.deviceId} value={device.deviceId}>
                  {device.label || `Speaker ${speakerDevices.indexOf(device) + 1}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="mirror-video">Mirror my video</Label>
          <Switch 
            id="mirror-video" 
            checked={mirrorVideo} 
            onCheckedChange={setMirrorVideo} 
          />
        </div>
        
        <Button onClick={applySettings} className="w-full">
          Apply Settings
        </Button>
      </CardContent>
    </Card>
  );
}