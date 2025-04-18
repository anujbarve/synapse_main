// components/custom/room-settings.tsx
import { useState, useEffect, useRef } from "react";
import { useRoomContext } from "@livekit/components-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { LocalVideoTrack, createLocalVideoTrack } from "livekit-client"; // Import createLocalVideoTrack

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

  // Use a ref to hold the preview track to avoid it triggering the effect
  const previewTrackRef = useRef<LocalVideoTrack | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  // Function to load devices
  const loadDevices = async () => {
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
      // Prefer currently active device if available
      const currentVideoDeviceId = room.localParticipant.activeDeviceMap.get('videoinput');
      setSelectedVideoDevice(currentVideoDeviceId || videoInputs[0]?.deviceId || "");

      const currentAudioDeviceId = room.localParticipant.activeDeviceMap.get('audioinput');
      setSelectedAudioDevice(currentAudioDeviceId || audioInputs[0]?.deviceId || "");

      // Note: Speaker device selection via enumerateDevices and switchActiveDevice
      // is not universally supported. The standard is element.setSinkId().
      // LiveKit might have its own abstraction or it might only work in specific browsers.
      // We'll keep the existing logic for now but be aware of potential limitations.
      const currentSpeakerDeviceId = room.localParticipant.activeDeviceMap.get('audiooutput');
      setSelectedSpeakerDevice(currentSpeakerDeviceId || audioOutputs[0]?.deviceId || "");

    } catch (e) {
      console.error("Error loading devices:", e);
    }
  };

  // Load available devices and listen for changes
  useEffect(() => {
    loadDevices();

    // Listen for device changes
    navigator.mediaDevices.addEventListener('devicechange', loadDevices);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', loadDevices);
    };
    // Dependency on room is needed because localParticipant is accessed
  }, [room]);

  // Create and attach preview
  useEffect(() => {
    async function startVideoPreview() {
      if (selectedVideoDevice && isOpen) {
        try {
          // Stop any existing preview track
          if (previewTrackRef.current) {
            previewTrackRef.current.stop();
            previewTrackRef.current = null;
          }

          // Create a new track with the selected device
          // Use createLocalVideoTrack (imported globally from livekit-client)
          const track = await createLocalVideoTrack({
            deviceId: selectedVideoDevice,
          });
          previewTrackRef.current = track;

          if (videoPreviewRef.current) {
            // Attach the track to the video element
            track.attach(videoPreviewRef.current);

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
      } else {
        // If no device selected or settings are closed, stop preview
        if (previewTrackRef.current) {
          previewTrackRef.current.stop();
          previewTrackRef.current = null;
          if (videoPreviewRef.current) {
            videoPreviewRef.current.srcObject = null;
          }
        }
      }
    }

    startVideoPreview();

    // Cleanup function
    return () => {
      if (previewTrackRef.current) {
        previewTrackRef.current.stop();
        previewTrackRef.current = null;
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = null;
        }
      }
    };
    // Re-run effect if selectedVideoDevice or isOpen changes
  }, [selectedVideoDevice, isOpen]); // Removed 'room' from dependencies as createLocalVideoTrack is not a room method

  const applySettings = async () => {
    try {
      if (selectedVideoDevice) {
        // switchActiveDevice handles stopping the old track and creating/publishing the new one
        await room.switchActiveDevice('videoinput', selectedVideoDevice);
      }

      if (selectedAudioDevice) {
        await room.switchActiveDevice('audioinput', selectedAudioDevice);
      }

      // Switching audio output device
      if (selectedSpeakerDevice) {
        // Check if setSinkId is supported on the video element
        if ((videoPreviewRef.current as any)?.setSinkId) {
          try {
             await (videoPreviewRef.current as any).setSinkId(selectedSpeakerDevice);
             console.log(`Successfully set sinkId for video element to ${selectedSpeakerDevice}`);
          } catch (e) {
             console.error("Error setting sinkId for video element:", e);
             // Fallback or alternative approach if setSinkId fails or isn't supported
             // LiveKit's switchActiveDevice for audiooutput might handle this
             // internally for tracks managed by LiveKit, but direct element
             // control is needed for preview.
          }
        } else {
           // If setSinkId is not supported on the element, try LiveKit's API
           // This might not affect the preview video element but could affect
           // other audio played by LiveKit.
           await room.switchActiveDevice('audiooutput', selectedSpeakerDevice);
           console.warn("setSinkId not supported on video element, attempting LiveKit switchActiveDevice for audiooutput.");
        }
      }

      // LiveKit's switchActiveDevice should handle republishing the tracks
      // if they were already published. The manual setEnabled(false/true)
      // with a timeout is likely unnecessary and can cause issues.
      // Removed the manual republishing logic in the previous fix.

    } catch (e) {
      console.error("Error applying settings:", e);
    }
  };

  // Stop preview when component unmounts or isOpen becomes false
  useEffect(() => {
    if (!isOpen && previewTrackRef.current) {
      previewTrackRef.current.stop();
      previewTrackRef.current = null;
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = null;
      }
    }

    return () => {
      if (previewTrackRef.current) {
        previewTrackRef.current.stop();
        previewTrackRef.current = null;
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = null;
        }
      }
    };
  }, [isOpen]); // Dependency on isOpen to stop preview when settings are closed


  return (
    <Card className={cn("flex flex-col h-full", !isOpen && "hidden")}> {/* Hide card if not open */}
      <CardHeader className="py-3">
        <CardTitle className="text-lg">Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 overflow-auto flex-grow"> {/* flex-grow to take available space */}
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
            disabled={speakerDevices.length === 0} // Disable if no speaker devices
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
      </CardContent>
      <CardFooter className="py-3">
        <Button onClick={applySettings} className="w-full">
          Apply Settings
        </Button>
      </CardFooter>
    </Card>
  );
}