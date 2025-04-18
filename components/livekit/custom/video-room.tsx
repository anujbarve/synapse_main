// components/custom/video-room.tsx
import { VideoGrid } from "./video-grid";
import { MediaControls } from "./media-controls";

interface VideoRoomProps {
  roomName: string;
}

export function VideoRoom({ roomName }: VideoRoomProps) {
  return (
    <div className="flex flex-col h-screen max-h-screen p-4 gap-4">
      <h2 className="text-2xl font-bold">{roomName}</h2>
      
      <div className="flex-1 overflow-auto">
        <VideoGrid />
      </div>
      
      <div className="flex justify-center">
        <MediaControls />
      </div>
    </div>
  );
}