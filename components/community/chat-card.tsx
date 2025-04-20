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
  Trash2,
  Edit3,
  X,
  Loader2,
  ArrowUp,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import React, { useState, useEffect, useRef} from "react";
import { Separator } from "@radix-ui/react-separator";
import { SidebarTrigger } from "../ui/sidebar";
import { MessageType, useMessageStore, MessageWithSender } from "@/stores/messages_store";
import { useUserStore } from "@/stores/user_store";
import { useChannelStore } from "@/stores/channel_store";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCommunityPresenceStore, useCommunityPresence } from "@/stores/user_online_store";
import { createClient } from "@/utils/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Users } from "lucide-react";
import { useSingleCommunityStore } from "@/stores/single_community_store";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress"; // Added for upload progress
import { ImageKitProvider, IKUpload } from "imagekitio-next"; // Added ImageKit imports

// ImageKit configuration
const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!;
const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!;

// ImageKit authenticator function
const authenticator = async () => {
  try {
    const response = await fetch("/api/imagekit");
    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Authentication error:", error);
    toast.error("Failed to authenticate upload");
    throw error;
  }
};

// Interface for ImageKit upload response
interface ImageKitResponse {
  url: string;
  fileId: string;
  name: string;
  size: number;
  filePath: string;
  fileType: string;
  height: number;
  width: number;
  thumbnailUrl: string;
}

// Interface for IKUpload ref
interface IKUploadRef extends HTMLInputElement {
  click: () => void;
}

// ChatCard Props
interface ChatCardProps {
  userId?: string;
  communityId?: number;
  receiverId?: string;
  channelId?: number;
  className?: string;
}

// ChatCard Component
export function ChatCard({
  communityId,
  receiverId,
  channelId,
  className,
  userId: propUserId,
}: ChatCardProps) {
  // Zustand Stores
  const { user } = useUserStore();
  const { channels, fetchChannels } = useChannelStore();
  const { setCurrentCommunity } = useSingleCommunityStore();
  const {
    messages,
    fetchMessages,
    sendMessage,
    updateMessage,
    deleteMessage,
    markMessageAsRead,
    clearMessages,
    initializeRealtimeUpdates,
    loading: messagesLoading,
    error: messagesError,
    pagination,
    lastFetchParams,
  } = useMessageStore();

  // Component State
  const [inputValue, setInputValue] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // Added for ImageKit
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null); // Added for ImageKit
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  // Refs
  const ikUploadRef = useRef<IKUploadRef>(null); // Added ImageKit ref
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Derived Values
  const loggedInUserId = propUserId || user?.id;
  const isDM = !!receiverId && !communityId && !channelId;

  // Set community context
  useEffect(() => {
    if (communityId) {
      setCurrentCommunity(communityId);
    }
  }, [communityId, setCurrentCommunity]);

  // Fetch initial data & setup realtime
  useEffect(() => {
    if (!loggedInUserId) return;

    let fetchParams: Parameters<typeof fetchMessages>[0] | null = null;

    if (isDM && receiverId) {
      fetchParams = { userIds: [loggedInUserId, receiverId].sort() as [string, string], pageSize: 20 };
    } else if (communityId && channelId) {
      fetchParams = { communityId, channelId, pageSize: 20 };
      fetchChannels(communityId.toString());
    }

    let cleanupRealtime: (() => void) | null = null;

    if (fetchParams) {
       clearMessages();
       fetchMessages(fetchParams);
       cleanupRealtime = initializeRealtimeUpdates(fetchParams);
    }

    return () => {
      if (cleanupRealtime) {
        cleanupRealtime();
      }
    };
  }, [
      communityId,
      channelId,
      receiverId,
      loggedInUserId,
      isDM,
      fetchMessages,
      fetchChannels,
      initializeRealtimeUpdates,
      clearMessages
    ]);

   // Effect for scrolling to bottom
   useEffect(() => {
       const container = scrollContainerRef.current;
       if (container) {
           const isNearBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 200;
           if (isNearBottom || messages.length <= pagination.pageSize) {
               scrollToBottom();
           }
       }
   }, [messages, pagination.pageSize]);

   // Effect for infinite scroll
   useEffect(() => {
       const container = scrollContainerRef.current;

       const handleScroll = () => {
           if (container) {
               if (container.scrollTop < 200 && pagination.hasNextPage && !messagesLoading) {
                   fetchMessages({
                       ...(lastFetchParams ?? {}),
                       page: pagination.page + 1,
                   });
               }
               setShowScrollToBottom(container.scrollHeight - container.scrollTop > container.clientHeight + 300);
           }
       };

       container?.addEventListener('scroll', handleScroll);
       return () => container?.removeEventListener('scroll', handleScroll);

   }, [pagination.hasNextPage, pagination.page, messagesLoading, fetchMessages, lastFetchParams]);

  // Handlers for ImageKit upload
  const handleUploadError = (err: { message: string }) => {
    console.error("Upload error:", err);
    setIsUploading(false);
    setUploadProgress(0);
    toast.error(err.message || "Failed to upload file");
  };

  const handleUploadSuccess = (res: ImageKitResponse) => {
    console.log("Upload success:", res);
    setIsUploading(false);
    setUploadedUrl(res.url);
    setSelectedFile(null); // Clear selected file reference after successful upload
    toast.success("File uploaded successfully");
    
    // Auto-send the message with the uploaded file
    if (res.url) {
      sendMessageWithAttachment(res.url, res.fileType.startsWith("image/") ? "Image" : "File");
    }
  };

  const handleUploadProgress = (progress: { loaded: number; total: number }) => {
    setUploadProgress((progress.loaded / progress.total) * 100);
  };

  const handleUploadStart = () => {
    setIsUploading(true);
    setUploadProgress(0);
  };

  // Util functions
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const handleAttachmentClick = () => {
    ikUploadRef.current?.click();
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setUploadedUrl(null);
    setUploadProgress(0);
  };

  const sendMessageWithAttachment = async (fileUrl: string, messageType: MessageType) => {
    if (!loggedInUserId) {
      toast.error("You must be logged in to send messages");
      return;
    }

    try {
      // Prepare message data
      const messageData = {
        sender_id: loggedInUserId,
        content: inputValue.trim() || (selectedFile ? selectedFile.name : "Sent an attachment"),
        message_type: messageType,
        community_id: communityId || null,
        channel_id: channelId || null,
        receiver_id: receiverId || null,
        file_url: fileUrl,
      };

      // Send message via store action
      await sendMessage(messageData);

      // Reset input state
      setInputValue("");
      setUploadedUrl(null);
      setUploadProgress(0);
      setSelectedFile(null);
      scrollToBottom('smooth');
    } catch (error) {
      console.error("Failed to send message with attachment", error);
      toast.error(`Failed to send message: ${error || 'Unknown error'}`);
    }
  };

  const handleSendMessage = async () => {
    if ((!inputValue.trim() && !uploadedUrl) || !loggedInUserId) return;

    try {
      // If we have an uploaded file URL, send with that
      if (uploadedUrl) {
        const messageType: MessageType = 
          uploadedUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)($|\?)/i)
            ? "Image"
            : "File";
            
        await sendMessageWithAttachment(uploadedUrl, messageType);
        return;
      }

      // Otherwise, send a text message
      const messageData = {
        sender_id: loggedInUserId,
        content: inputValue.trim(),
        message_type: "Text" as MessageType,
        community_id: communityId || null,
        channel_id: channelId || null,
        receiver_id: receiverId || null,
        file_url: null,
      };

      await sendMessage(messageData);
      setInputValue("");
      scrollToBottom('smooth');
    } catch (error) {
      console.error("Failed to send message", error);
      toast.error(`Failed to send message: ${error|| 'Unknown error'}`);
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;
    try {
       await deleteMessage(messageId);
       toast.success("Message deleted.");
    } catch (error) {
        console.error("Failed to delete message", error);
        toast.error(`Failed to delete message: ${error || 'Unknown error'}`);
    }
  };

  const handleEditStart = (message: MessageWithSender) => {
    setEditingMessageId(message.id);
    setEditingContent(message.content);
  };

  const handleEditCancel = () => {
    setEditingMessageId(null);
    setEditingContent("");
  };

  const handleEditSave = async () => {
    if (!editingMessageId || !editingContent.trim()) return;

    try {
        await updateMessage(editingMessageId, { content: editingContent.trim() });
        toast.success("Message updated.");
        handleEditCancel();
    } catch (error) {
        console.error("Failed to update message", error);
        toast.error(`Failed to update message: ${error || 'Unknown error'}`);
    }
  };

  // Render Logic
  const displayedMessages = React.useMemo(() => [...messages].reverse(), [messages]);

  // Header Content Logic
  const getHeaderTitle = () => {
    if (isDM) {
      return `Direct Message`;
    } else if (communityId && channelId) {
      const channel = channels.find((c) => c.id === channelId);
      return channel ? `${channel.name}` : "Loading Channel...";
    }
    return "Chat";
  };

  const getHeaderSubtitle = () => {
    if (isDM) {
      return `Chatting with ${receiverId}`;
    } else if (communityId) {
      return `Community: ${communityId}`;
    }
    return null;
  };

  // Display error state
  if (messagesError) {
    return <div className="flex items-center justify-center h-full text-red-500 p-4">Error loading messages: {messagesError}</div>;
  }

  // Ensure user is identified before rendering main chat UI
  if (!loggedInUserId) {
    return <div className="flex items-center justify-center h-full text-muted-foreground p-4">Identifying user...</div>;
  }

  return (
    <ImageKitProvider
      publicKey={publicKey}
      urlEndpoint={urlEndpoint}
      authenticator={authenticator}
    >
      <div className={cn("h-full flex flex-col bg-background", className)}>
        {/* Header */}
        <div className="px-4 py-3 flex items-center justify-between border-b shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <SidebarTrigger className="-ml-1 md:hidden" />
            <Separator orientation="vertical" className="mr-2 h-6 hidden md:block" />
            <div className="min-w-0">
              <h3 className="font-medium truncate">{getHeaderTitle()}</h3>
              <p className="text-xs text-muted-foreground truncate">{getHeaderSubtitle()}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            {communityId && <OnlineMembersPopover communityId={communityId} />}
            <Button variant="ghost" size="icon" className="rounded-full">
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 relative">
        {messagesLoading && messages.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
          {messagesLoading && messages.length > 0 && (
            <div className="flex justify-center py-2">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Render "No messages" only if not loading and messages array is empty */}
          {!messagesLoading && displayedMessages.length === 0 ? (
            <div className="text-center text-muted-foreground pt-10">
              No messages yet. Start the conversation!
            </div>
          ) : (
            displayedMessages.map((message) => (
              <MessageItem
                key={`message-${message.id}-${message.sent_at}`}
                message={message}
                isOwnMessage={message.sender_id === loggedInUserId}
                onDelete={handleDeleteMessage}
                onEditStart={handleEditStart}
                isEditing={editingMessageId === message.id}
                editingContent={editingContent}
                onEditingContentChange={setEditingContent}
                onEditSave={handleEditSave}
                onEditCancel={handleEditCancel}
                onMarkAsRead={markMessageAsRead}
              />
            ))
          )}
          {/* Element to scroll to */}
          <div ref={messagesEndRef} />
        </div>

        {/* Scroll to Bottom Button */}
        {showScrollToBottom && (
          <Button
            variant="outline"
            size="icon"
            className="absolute bottom-24 right-6 rounded-full shadow-lg z-20 animate-bounce"
            onClick={() => scrollToBottom('smooth')}
            aria-label="Scroll to bottom"
          >
            <ArrowUp className="w-5 h-5 rotate-180" />
          </Button>
        )}

        {/* Input Area */}
        <div className="p-4 border-t shrink-0 bg-background">
          {/* ImageKit Upload (hidden) */}
          <IKUpload
            fileName={`message-${Date.now()}`}
            folder="/messages"
            validateFile={(file: File) => {
              // Store the selected file for UI display
              setSelectedFile(file);
              // Validate file size (100MB max)
              return file.size <= 100 * 1024 * 1024;
            }}
            onError={handleUploadError}
            onSuccess={handleUploadSuccess}
            onUploadProgress={handleUploadProgress}
            onUploadStart={handleUploadStart}
            style={{ display: "none" }}
            ref={ikUploadRef}
            // Accept most common file types
            accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.txt"
          />

          {/* Upload Progress Area */}
          {isUploading && (
            <div className="mb-2 p-2 bg-muted rounded-lg">
              <div className="flex justify-between items-center mb-1 text-sm">
                <span>Uploading {selectedFile?.name}</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* File Preview Area */}
          {selectedFile && !isUploading && !uploadedUrl && (
            <div className="mb-2 flex items-center justify-between bg-muted p-2 rounded-lg text-sm">
              <div className="flex items-center gap-2 overflow-hidden">
                {selectedFile.type.startsWith("image/") ? (
                  <ImageIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                ) : (
                  <Paperclip className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
                <span className="truncate">{selectedFile.name}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full shrink-0"
                onClick={removeSelectedFile}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Uploaded File Preview */}
          {uploadedUrl && !isUploading && (
            <div className="mb-2 flex items-center justify-between bg-primary/10 p-2 rounded-lg text-sm">
              <div className="flex items-center gap-2 overflow-hidden">
                {uploadedUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)($|\?)/i) ? (
                  <ImageIcon className="w-4 h-4 text-primary shrink-0" />
                ) : (
                  <Paperclip className="w-4 h-4 text-primary shrink-0" />
                )}
                <span className="truncate">File ready to send</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full shrink-0"
                onClick={removeSelectedFile}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Main Input Row */}
          <div className="flex items-center gap-2">
            {/* Attach Button */}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full shrink-0"
              onClick={handleAttachmentClick}
              disabled={isUploading}
              aria-label="Attach file"
            >
              <Paperclip className="w-5 h-5" />
            </Button>

            {/* Text Input */}
            <div className="relative flex-1">
              <Input
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
                className="pr-10"
                disabled={isUploading}
                aria-label="Message input"
              />
              {/* Emoji Button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
                disabled={isUploading}
                aria-label="Add emoji"
              >
                <SmilePlus className="w-5 h-5" />
              </Button>
            </div>
            {/* Send Button */}
            <Button
              onClick={handleSendMessage}
              disabled={((!inputValue.trim() && !uploadedUrl) || isUploading)}
              size="icon"
              className="rounded-lg shrink-0"
              aria-label="Send message"
            >
              {isUploading ? <Loader2 className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>
    </ImageKitProvider>
  );
}

// MessageItem Component
interface MessageItemProps {
  message: MessageWithSender;
  isOwnMessage: boolean;
  onDelete: (messageId: number) => void;
  onEditStart: (message: MessageWithSender) => void;
  isEditing: boolean;
  editingContent: string;
  onEditingContentChange: (content: string) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  onMarkAsRead: (messageId: number) => void;
}

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isOwnMessage,
  onDelete,
  onEditStart,
  isEditing,
  editingContent,
  onEditingContentChange,
  onEditSave,
  onEditCancel,
  onMarkAsRead,
}) => {
  const messageRef = useRef<HTMLDivElement>(null);

  // Effect for Intersection Observer (Mark as Read)
  useEffect(() => {
    if (!messageRef.current || isOwnMessage || message.is_read) {
      return; // Don't observe own messages or already read messages
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            onMarkAsRead(message.id);
            observer.unobserve(entry.target); // Stop observing once marked
          }
        });
      },
      { threshold: 0.5 } // Trigger when 50% visible
    );

    observer.observe(messageRef.current);

    return () => {
      if (messageRef.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        observer.unobserve(messageRef.current);
      }
    }
  }, [message.id, isOwnMessage, message.is_read, onMarkAsRead]);

  // Function to open image in lightbox or new tab
  const handleImageClick = (url: string) => {
    // You could implement a lightbox here, or just open in new tab
    window.open(url, '_blank');
  };

  return (
    <div
      ref={messageRef}
      className={cn(
        "flex items-start gap-3 group relative",
        isOwnMessage ? "justify-end" : ""
      )}
    >
      {/* Avatar (Show for other users) */}
      {!isOwnMessage && (
        <Avatar className="w-9 h-9 shrink-0">
          <AvatarImage src={message.sender.profile_picture || undefined} alt={message.sender.username}/>
          <AvatarFallback>{message.sender.username.slice(0,1).toUpperCase()}</AvatarFallback>
        </Avatar>
      )}

      {/* Message Bubble */}
      <div
        className={cn(
          "flex-grow-0 max-w-[75%] p-2 px-3 rounded-lg relative",
          isOwnMessage ? "bg-primary text-primary-foreground" : "bg-muted"
        )}
      >
        {/* Edit/Delete Buttons (Show on hover for own messages) */}
        {isOwnMessage && !isEditing && (
          <div className="absolute -top-2 -left-8 opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => onEditStart(message)}>
              <Edit3 className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive/70 hover:text-destructive" onClick={() => onDelete(message.id)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}

        {/* Sender Name (Show for other users) */}
        {!isOwnMessage && (
          <div className="text-xs font-medium mb-1 text-primary">
            {message.sender.username}
          </div>
        )}

        {/* Editing View */}
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editingContent}
              onChange={(e) => onEditingContentChange(e.target.value)}
              rows={3}
              className="text-sm bg-background text-foreground focus:ring-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onEditSave();
                } else if (e.key === 'Escape') {
                  onEditCancel();
                }
              }}
            />
            <div className="flex justify-end items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={onEditCancel}>Cancel</Button>
              <Button size="sm" onClick={onEditSave} disabled={!editingContent.trim()}>Save</Button>
            </div>
          </div>
        ) : (
          <>
            {/* Message Content (Image/File/Text) */}
            {message.message_type === "Image" && message.file_url && (
              <div 
                className="cursor-pointer"
                onClick={() => handleImageClick(message.file_url!)}
              >
                <Image
                  src={message.file_url}
                  alt="Sent image"
                  width={250}
                  height={250}
                  className="rounded-md mb-1 max-w-full h-auto hover:opacity-90 transition-opacity"
                />
              </div>
            )}
            {message.message_type === "File" && message.file_url && (
              <a
                href={message.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex items-center gap-2 p-2 rounded-md mb-1 hover:bg-black/10 dark:hover:bg-white/10",
                  isOwnMessage ? "bg-primary/80 hover:bg-primary/70" : "bg-muted-foreground/10 hover:bg-muted-foreground/20"
                )}
              >
                <Paperclip className="w-4 h-4 shrink-0"/>
                <span className="text-sm truncate">
                  {message.content || message.file_url.split('/').pop()?.split('?')[0].split('-').slice(1).join('-')}
                </span>
              </a>
            )}
            {/* Only display text content if it's not primarily a file message OR if there's actual text content */}
            {message.content && (
              <p className="text-sm break-words whitespace-pre-wrap">{message.content}</p>
            )}

            {/* Timestamp and Read Status */}
            <div className={cn("text-xs mt-1 flex items-center gap-1", isOwnMessage ? "justify-end text-primary-foreground/70" : "justify-start text-muted-foreground")}>
              <span>{new Date(message.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              {isOwnMessage && (
                message.is_read ? (
                  <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )
              )}
            </div>
          </>
        )}
      </div>

      {/* Avatar (Show for own messages on the right) */}
      {isOwnMessage && (
        <Avatar className="w-9 h-9 shrink-0">
          <AvatarImage src={message.sender.profile_picture || undefined} alt={message.sender.username}/>
          <AvatarFallback>{message.sender.username.slice(0,1).toUpperCase()}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

// OnlineMembersPopover Componen
            
// Copy and paste the OnlineMembersPopover component below the CommunitySettingsDialog component

interface CommunityMember {
  user_id: string;
  users: {
    username: string;
    profile_picture: string | null;
  };
}

export function OnlineMembersPopover({ communityId }: { communityId: number }) {
  const [members, setMembers] = React.useState<CommunityMember[]>([]);
  const { onlineCount, totalMembers, onlineMembers } = useCommunityPresence(communityId);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);

  // Initialize presence
  React.useEffect(() => {
    setIsLoading(true);
    // Ensure communityPresenceStore and initializePresence are correctly set up
    const cleanup = useCommunityPresenceStore.getState().initializePresence(communityId);

    

    return () => {
      console.info('Cleaning up presence for community:', communityId);
      console.info('Cleanup function:', cleanup);
      // Ensure cleanup is correctly set up in your store
      useCommunityPresenceStore.getState().cleanup(communityId);
    };
  }, [communityId]);

  // Fetch community members
  React.useEffect(() => {
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
          className="flex items-center gap-2 px-4 py-2 rounded-md hover:bg-accent group relative w-fit" // Adjusted styling for better integration
          aria-label="Online Members"
        >
          <Users className="w-5 h-5 group-hover:text-primary" />
          <span className="text-sm font-medium">
            {onlineCount} Online {/* Display only online count here */}
          </span>
           {/* Optional: Display total count next to label or inside popover */}
           {/* <span className="text-xs text-muted-foreground">/ {totalMembers}</span> */}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0">
        <div className="p-4 border-b">
          <div className="flex items-center space-x-2">
            <h4 className="text-sm font-semibold flex-1">
              Community Members
            </h4>
            <span className="text-xs text-muted-foreground">
              {onlineCount} / {totalMembers}
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
                    {/* Optional: Add a MoreHorizontal icon or button per member */}
                    {/* <MoreHorizontal
                      className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    /> */}
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