// components/custom/room-chat.tsx
import { useState, useEffect, useRef } from "react";
import { useRoomContext } from "@livekit/components-react";
import { DataPacket_Kind, RoomEvent, RemoteParticipant } from "livekit-client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: Date;
  isLocal: boolean;
}

export function RoomChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const room = useRoomContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // components/custom/room-chat.tsx (continued)
  useEffect(() => {
    // Fix the type signature to match what LiveKit expects
    const handleDataReceived = (
      payload: Uint8Array, 
      participant?: RemoteParticipant, 
      kind?: DataPacket_Kind
    ) => {
      // Only process if we have all required data
      if (!participant || kind !== DataPacket_Kind.RELIABLE) return;
      
      try {
        const data = JSON.parse(new TextDecoder().decode(payload));
        if (data.type === 'chat') {
          const newMessage: ChatMessage = {
            id: `${Date.now()}-${participant.identity}`,
            sender: participant.identity,
            message: data.message,
            timestamp: new Date(),
            isLocal: false
          };
          
          setMessages(prev => [...prev, newMessage]);
        }
      } catch (e) {
        console.error("Error parsing chat message:", e);
      }
    };
    
    room.on(RoomEvent.DataReceived, handleDataReceived);
    
    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room]);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const sendMessage = () => {
    if (!inputValue.trim() || !room.localParticipant) return;
    
    const message = {
      type: 'chat',
      message: inputValue
    };
    
    // Send to other participants
    const msgBytes = new TextEncoder().encode(JSON.stringify(message));
    
    // Fix: Use the correct options format for publishData
    room.localParticipant.publishData(msgBytes, {
      reliable: true // Use reliable delivery option instead of enum
    });
    
    // Add to local messages
    const newMessage: ChatMessage = {
      id: `${Date.now()}-${room.localParticipant.identity}`,
      sender: room.localParticipant.identity,
      message: inputValue,
      timestamp: new Date(),
      isLocal: true
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInputValue("");
  };
  
  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="py-3">
        <CardTitle className="text-lg">Chat</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full px-4">
          <div className="space-y-4 py-4">
            {messages.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">
                No messages yet. Start the conversation!
              </p>
            ) : (
              messages.map(msg => (
                <div 
                  key={msg.id} 
                  className={`max-w-[80%] ${msg.isLocal ? 'ml-auto bg-primary text-primary-foreground' : 'bg-muted'} p-3 rounded-lg`}
                >
                  <div className="flex justify-between text-xs mb-1">
                    <span className={msg.isLocal ? 'text-primary-foreground/80' : 'text-muted-foreground'}>
                      {msg.sender}
                    </span>
                    <span className={msg.isLocal ? 'text-primary-foreground/80' : 'text-muted-foreground'}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="break-words">{msg.message}</p>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="border-t p-3">
        <form 
          className="flex gap-2 w-full" 
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}>
          <Input 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!inputValue.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}