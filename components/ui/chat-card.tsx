"use client";

import {
  SmilePlus,
  Check,
  CheckCheck,
  MoreHorizontal,
  Send,
  Image as ImageIcon,
  Paperclip,
  Search,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { Separator } from "@radix-ui/react-separator";
import { SidebarTrigger } from "./sidebar";
import { MessageType, useMessageStore } from "@/stores/messages_store";
import { useUserStore } from "@/stores/user_store";
import { useChannelStore } from "@/stores/channel_store";

import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { 
  useCommunityPresenceStore, 
  useCommunityPresence 
} from "@/stores/user_online_store";
import { createClient } from '@/utils/supabase/client';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Users } from 'lucide-react';
import React from "react";

interface ChatCardProps {
  communityId?: number;
  receiverId?: string;
  channelId?: number;
  className?: string;
}

export function  ChatCard({
  communityId,
  receiverId,
  channelId,
  className,
}: ChatCardProps) {
  const { user } = useUserStore();
  const [inputValue, setInputValue] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Access store methods and state
  const { 
    messages, 
    fetchMessages, 
    sendMessage,
    loading,
    error
  } = useMessageStore();

  const { 
    channels,
    fetchChannels
  } = useChannelStore();

  useEffect(() => {
    // Initialize realtime updates
    const cleanup = useMessageStore.getState().initializeRealtimeUpdates();
  
    // Fetch messages
    if (communityId && channelId) {
      fetchChannels(communityId.toString());
      fetchMessages({
        communityId, 
        channelId
      });
    } else if (receiverId) {
      fetchMessages({
        receiverId
      });
    }
  
    // Cleanup subscription when component unmounts
    return () => {
      cleanup();
    };
  }, [communityId, channelId, receiverId, fetchMessages,fetchChannels]);

  const filteredMessages = React.useMemo(() => {
    return messages.filter(message => {
      // Filter based on current context
      if (communityId && channelId) {
        return message.community_id === communityId && 
               message.channel_id === channelId;
      }
      if (receiverId) {
        return message.receiver_id === receiverId;
      }
      return true;
    });
  }, [messages, communityId, channelId, receiverId]);


  const handleSendMessage = async () => {
    if (!inputValue.trim() && !selectedFile || !user) return;

    try {
      let messageType: MessageType = 'Text';
      if (selectedFile) { 
        messageType = selectedFile.type.startsWith('image/') ? 'Image' : 'File';
      }

      const messageData = {
        sender_id: user.id,
        content: inputValue,
        message_type: messageType,
        community_id: communityId || null,
        channel_id: channelId || null,
        receiver_id: receiverId || null,
        file_url: selectedFile ? URL.createObjectURL(selectedFile) : null
      };

      await sendMessage(messageData);

      // Reset input and file
      setInputValue("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error("Failed to send message", error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setInputValue(file.name);
    }
  };

  // Render error if exists
  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        Error: {error}
      </div>
    );
  }

  if (!user) return null; // Prevent rendering if no user

  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b shrink-0">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-violet-500 flex items-center justify-center text-lg font-medium text-white">
              {communityId ? 'C' : 'M'}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2" />
          </div>
          <div>
            <h3 className="font-medium">
              {communityId 
                ? `Community Channel : ${channels.find(c => c.id === channelId)?.name}` 
                : 'Direct Message'}
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Add Online Members Popover if in a community context */}
          {communityId && (
            <OnlineMembersPopover communityId={communityId} />
          )}
          <button
            type="button"
            className="p-2 rounded-full hover:bg-muted"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="text-center text-muted-foreground">Loading messages...</div>
        ) : filteredMessages.length === 0 ? (
          <div className="text-center text-muted-foreground">No messages yet</div>
        ) : (
          filteredMessages.map((message,index) => (
            <div key={`message-${message.id}-${message.sent_at}-${index}`}  className="flex items-start gap-3">
              <Image
                src={message.sender.profile_picture || '/default-avatar.png'}
                alt={message.sender.username}
                width={36}
                height={36}
                className="rounded-full"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{message.sender.username}</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(message.sent_at).toLocaleTimeString()}
                  </span>
                </div>
                {message.message_type === 'Image' && message.file_url && (
                  <Image 
                    src={message.file_url} 
                    alt="Sent image" 
                    width={200} 
                    height={200} 
                    className="rounded-lg mb-2"
                  />
                )}
                <p className="break-words">{message.content}</p>
              </div>
              <div className="flex items-center self-end mb-1">
                {message.is_read ? (
                  <CheckCheck className="w-4 h-4 text-blue-500" />
                ) : (
                  <Check className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t shrink-0">
        <div className="flex items-center gap-2">
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            onChange={handleFileSelect}
            accept="image/*,application/pdf,.doc,.docx"
          />
          <button
            type="button"
            className="p-1.5 rounded-full hover:bg-muted/80"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="w-5 h-5" />
          </button>

          <div className="relative flex-1">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Write a message..."
              className="w-full px-4 py-2.5 rounded-lg bg-muted focus:outline-none focus:ring-1"
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-muted/80"
            >
              <SmilePlus className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() && !selectedFile}
            className="p-2.5 rounded-lg transition-colors bg-muted hover:bg-muted/80 disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        {selectedFile && (
          <div className="mt-2 flex items-center justify-between bg-muted p-2 rounded-lg">
            <div className="flex items-center">
              {selectedFile.type.startsWith('image/') ? (
                <ImageIcon className="w-5 h-5 mr-2" />
              ) : (
                <Paperclip className="w-5 h-5 mr-2" />
              )}
              <span>{selectedFile.name}</span>
            </div>
            <button 
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="p-1 rounded-full hover:bg-muted/80"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface CommunityMember {
  user_id: string;
  users: {
    username: string;
    profile_picture: string | null;
  };
}

export function OnlineMembersPopover({ communityId }: { communityId: number }) {
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const { onlineCount, totalMembers, onlineMembers } = useCommunityPresence(communityId);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Initialize presence
  useEffect(() => {
    setIsLoading(true);
    useCommunityPresenceStore.getState().initializePresence(communityId);

    return () => {
      useCommunityPresenceStore.getState().cleanup(communityId);
    };
  }, [communityId]);

  // Fetch community members
  useEffect(() => {
    async function fetchMembers() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('community_members')
          .select('user_id, users(username, profile_picture)')
          .eq('community_id', communityId);

        if (data) {
          setMembers(data);
          setIsLoading(false);
        }

        if (error) throw error;
      } catch (error) {
        console.error('Failed to fetch community members', error);
        setIsLoading(false);
      }
    }

    fetchMembers();
  }, [communityId]);

  // Filtered and sorted members
  const filteredMembers = React.useMemo(() => {
    return members
      .filter(member => 
        member.users.username.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        const aOnline = onlineMembers[a.user_id];
        const bOnline = onlineMembers[b.user_id];
        
        if (aOnline && !bOnline) return -1;
        if (!aOnline && bOnline) return 1;
        
        return a.users.username.localeCompare(b.users.username);
      });
  }, [members, onlineMembers, searchTerm]);

  // Render loading skeleton
  const renderLoadingSkeleton = () => (
    <div className="space-y-2 p-2">
      {[...Array(4)].map((_, index) => (
        <div 
          key={index} 
          className="flex items-center space-x-4 p-2 rounded-lg bg-muted/20 animate-pulse"
        >
          <div className="w-10 h-10 bg-muted/30 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 bg-muted/30"></div>
            <div className="h-3 w-1/2 bg-muted/30"></div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button 
          className="flex items-center gap-2 p-2 rounded-full hover:bg-accent group relative"
          aria-label="Online Members"
        >
          <Users className="w-5 h-5 group-hover:text-primary" />
          <span className="text-sm font-medium">
            {onlineCount} / {totalMembers}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0">
        <div className="p-4 border-b">
          <div className="flex items-center space-x-2">
            <h4 className="text-sm font-semibold flex-1">
              Community Members
            </h4>
            <span className="text-xs text-muted-foreground">
              {onlineCount} Online
            </span>
          </div>
          <div className="mt-2 relative">
            <input 
              type="text"
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm 
              bg-background 
              focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          </div>
        </div>
        
        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            renderLoadingSkeleton()
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground text-sm">
              No members found
            </div>
          ) : (
            <div className="divide-y">
              {filteredMembers.map(member => {
                const isOnline = onlineMembers[member.user_id];
                return (
                  <div 
                    key={member.user_id} 
                    className={`
                      flex items-center p-3 
                      ${isOnline 
                        ? 'bg-green-50/50 dark:bg-green-950/30' 
                        : 'hover:bg-accent'}
                      transition-colors group
                      cursor-pointer
                    `}
                    onClick={() => {
                      // Optional: Add action on member click
                      // e.g., navigate to profile or open direct message
                    }}
                  >
                    <div className="relative mr-4">
                      <Avatar className={`
                        w-10 h-10
                        ring-2 
                        ${isOnline 
                          ? 'ring-green-500/50' 
                          : 'ring-muted-foreground/20'}
                      `}>
                        <AvatarImage 
                          src={member.users.profile_picture || undefined} 
                          alt={member.users.username}
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {member.users.username.slice(0,2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {isOnline && (
                        <span 
                          className="absolute bottom-0 right-0 w-3 h-3 
                          bg-green-500 border-2 border-background rounded-full 
                          animate-pulse"
                        ></span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-primary">
                        {member.users.username}
                      </p>
                      <p className={`
                        text-xs truncate
                        ${isOnline 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-muted-foreground'}
                      `}>
                        {isOnline ? 'Online' : 'Offline'}
                      </p>
                    </div>
                    <MoreHorizontal 
                      className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" 
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}