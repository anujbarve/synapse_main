// components/custom/participants-list.tsx
import { useParticipants } from "@livekit/components-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mic, MicOff, Video, VideoOff, ScreenShare } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Track } from "livekit-client";
import { Badge } from "@/components/ui/badge";

export function ParticipantsList() {
  const participants = useParticipants();
  
  return (
    <Card className="flex flex-col h-full">
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-1 px-1">
            {participants.map(participant => {
              const isMicOn = !participant.isMicrophoneEnabled;
              const isCameraOn = participant.isCameraEnabled;
              const isScreenSharing = !!participant.getTrackPublication(Track.Source.ScreenShare)?.track;
              
              return (
                <div 
                  key={participant.sid} 
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-accent"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{participant.identity.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="flex-1 text-sm font-medium">
                    {participant.identity}
                    {participant.isLocal && " (You)"}
                  </span>
                  <div className="flex gap-1">
                    {isScreenSharing && (
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                        <ScreenShare className="h-3 w-3 mr-1" />
                        Sharing
                      </Badge>
                    )}
                    {isMicOn ? 
                      <Mic className="h-4 w-4" /> : 
                      <MicOff className="h-4 w-4 text-muted-foreground" />
                    }
                    {isCameraOn ? 
                      <Video className="h-4 w-4" /> : 
                      <VideoOff className="h-4 w-4 text-muted-foreground" />
                    }
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}