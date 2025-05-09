// components/custom/video-grid.tsx
import { useParticipants } from "@livekit/components-react";
import { VideoTile } from "./video-tile";
import { cn } from "@/lib/utils";

interface VideoGridProps {
  className?: string;
}

export function VideoGrid({ className }: VideoGridProps) {
  const participants = useParticipants();
  
  return (
    <div 
      className={cn(
        "grid gap-4 h-full w-full",
        participants.length === 1 && "grid-cols-1",
        participants.length === 2 && "grid-cols-2",
        participants.length >= 3 && participants.length <= 4 && "grid-cols-2",
        participants.length >= 5 && participants.length <= 6 && "grid-cols-3",
        participants.length >= 7 && "grid-cols-4",
        className
      )}
    >
      {participants.map(participant => (
        <VideoTile 
          key={participant.sid} 
          participant={participant} 
          className="aspect-video w-full"
        />
      ))}
    </div>
  );
}