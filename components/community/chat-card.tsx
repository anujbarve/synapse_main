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
  Trash2, // Icon for delete
  Edit3, // Icon for edit
  X, // Icon for cancel edit/remove file
  Loader2, // Icon for loading states
  ArrowUp, // Icon for scroll to bottom
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Separator } from "@radix-ui/react-separator";
import { SidebarTrigger } from "../ui/sidebar";
import { MessageType, useMessageStore, MessageWithSender } from "@/stores/messages_store"; // Import MessageWithSender
import { useUserStore } from "@/stores/user_store";
import { useChannelStore } from "@/stores/channel_store";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCommunityPresenceStore, useCommunityPresence } from "@/stores/user_online_store";
import { createClient } from "@/utils/supabase/client"; // Import Supabase client
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button"; // Import Button
import { Input } from "@/components/ui/input"; // Import Input
import { Textarea } from "@/components/ui/textarea"; // For editing
import { Users } from "lucide-react";
import { useSingleCommunityStore } from "@/stores/single_community_store";
import { toast } from "sonner"; // For displaying notifications/errors

// --- Helper: Supabase File Uploader (Basic Example) ---
async function uploadFileToSupabase(file: File): Promise<string> {
    const supabase = createClient();
    const user = useUserStore.getState().user; // Get current user for potential path scoping
    if (!user) throw new Error("User not logged in for file upload");

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `message_files/${fileName}`; // Adjust your bucket path as needed

    // console.log(`Uploading file: ${fileName} to path: ${filePath}`);

    const { data, error } = await supabase.storage
        .from('your-storage-bucket-name') // <--- REPLACE with your actual bucket name
        .upload(filePath, file);

    if (error) {
        console.error("Supabase storage error:", error);
        throw new Error(`Failed to upload file: ${error.message}`);
    }

    // Get public URL (ensure your bucket policies allow public reads or use signed URLs)
    const { data: urlData } = supabase.storage
        .from('your-storage-bucket-name') // <--- REPLACE with your actual bucket name
        .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
        throw new Error("Could not get public URL for uploaded file.");
    }

    // console.log(`File uploaded successfully: ${urlData.publicUrl}`);
    return urlData.publicUrl;
}


// --- ChatCard Props ---
interface ChatCardProps {
  userId?: string; // Logged-in user's ID (passed down or derived from useUserStore)
  communityId?: number;
  receiverId?: string; // ID of the other user in a DM
  channelId?: number;
  className?: string;
}

// --- ChatCard Component ---
export function ChatCard({
  communityId,
  receiverId, // This is the *other* user's ID in DM context
  channelId,
  className,
  userId: propUserId, // Renamed to avoid conflict with store user ID
}: ChatCardProps) {
  // --- Zustand Stores ---
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
    loading: messagesLoading, // Renamed to avoid conflict
    error: messagesError,
    pagination,
    lastFetchParams,
  } = useMessageStore();

  // --- Component State ---
  const [inputValue, setInputValue] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  // --- Refs ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null); // Ref for auto-scrolling
  const scrollContainerRef = useRef<HTMLDivElement>(null); // Ref for the scrollable div

  // --- Derived Values ---
  const loggedInUserId = propUserId || user?.id; // Use prop or store user ID
  const isDM = !!receiverId && !communityId && !channelId;
  const currentContextParams = isDM && loggedInUserId && receiverId
      ? { userIds: [loggedInUserId, receiverId].sort() as [string, string] } // Ensure consistent order
      : { communityId, channelId };

  // --- Effects ---

  // Set community context for other potential hooks/components
  useEffect(() => {
    if (communityId) {
      setCurrentCommunity(communityId);
    }
  }, [communityId, setCurrentCommunity]);

  // Fetch initial data & setup realtime based on context
  useEffect(() => {
    if (!loggedInUserId) return; // Don't fetch if user isn't identified

    // Determine fetch parameters based on context
    let fetchParams: Parameters<typeof fetchMessages>[0] | null = null;

    if (isDM && receiverId) {
      fetchParams = { userIds: [loggedInUserId, receiverId].sort() as [string, string], pageSize: 20 };
    } else if (communityId && channelId) {
      fetchParams = { communityId, channelId, pageSize: 20 };
      fetchChannels(communityId.toString()); // Fetch channels for the header display
    }

    let cleanupRealtime: (() => void) | null = null;

    if (fetchParams) {
       // Clear previous messages and reset pagination before fetching new context
       clearMessages(); // Includes resetting pagination
       fetchMessages(fetchParams);
       // Initialize realtime with the same context
       cleanupRealtime = initializeRealtimeUpdates(fetchParams);
    }

    // Cleanup function
    return () => {
       // console.log("ChatCard cleanup: Unsubscribing from realtime.");
      if (cleanupRealtime) {
        cleanupRealtime();
      }
      // Optional: clear messages again on unmount? Depends on desired behavior
      // clearMessages();
    };
    // Ensure dependencies cover all context identifiers and the loggedInUserId
  }, [
      communityId,
      channelId,
      receiverId,
      loggedInUserId,
      isDM,
      fetchMessages,
      fetchChannels,
      initializeRealtimeUpdates,
      clearMessages // Add clearMessages dependency
    ]);

   // Effect for scrolling to bottom
   useEffect(() => {
       // Scroll to bottom when messages load initially or new message added,
       // but only if user is already near the bottom.
       const container = scrollContainerRef.current;
       if (container) {
           const isNearBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 200; // Threshold
           // Only auto-scroll if near bottom or it's the initial load for this context
           if (isNearBottom || messages.length <= pagination.pageSize) { // Check initial load size
               scrollToBottom();
           }
       }
   }, [messages, pagination.pageSize]); // Rerun when messages change

   // Effect for infinite scroll (load more)
   useEffect(() => {
       const container = scrollContainerRef.current;

       const handleScroll = () => {
           if (container) {
                // Check if scrolled near the top
               if (container.scrollTop < 200 && pagination.hasNextPage && !messagesLoading) {
                   // console.log("Near top, fetching more messages...");
                   fetchMessages({
                       ...(lastFetchParams ?? {}), // Use last used context
                       page: pagination.page + 1, // Fetch next page
                   });
               }
               // Show/hide scroll to bottom button
               setShowScrollToBottom(container.scrollHeight - container.scrollTop > container.clientHeight + 300);
           }
       };

       container?.addEventListener('scroll', handleScroll);
       return () => container?.removeEventListener('scroll', handleScroll);

   }, [pagination.hasNextPage, pagination.page, messagesLoading, fetchMessages, lastFetchParams]);

  // --- Event Handlers ---

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        // Basic size validation (e.g., 10MB)
        if (file.size > 10 * 1024 * 1024) {
             toast.error("File is too large (max 10MB).");
             return;
        }
      setSelectedFile(file);
      // Don't overwrite text input if user was already typing
      // setInputValue(file.name);
    }
  };

  const removeSelectedFile = () => {
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
  }

  const handleSendMessage = async () => {
    if ((!inputValue.trim() && !selectedFile) || !loggedInUserId) return;

    setIsUploading(selectedFile ? true : false); // Show upload indicator if file exists

    try {
      let fileUrl: string | null = null;
      let messageType: MessageType = "Text";

      // 1. Upload file if selected
      if (selectedFile) {
        try {
          fileUrl = await uploadFileToSupabase(selectedFile);
          messageType = selectedFile.type.startsWith("image/") ? "Image" : "File";
        } catch (uploadError: any) {
           console.error("File upload failed:", uploadError);
           toast.error(`File upload failed: ${uploadError.message}`);
           setIsUploading(false);
           return; // Stop message sending process
        } finally {
           setIsUploading(false);
        }
      }

      // 2. Prepare message data
      const messageData = {
        sender_id: loggedInUserId,
        content: inputValue.trim(), // Trim whitespace
        message_type: messageType,
        community_id: communityId || null,
        channel_id: channelId || null,
        receiver_id: receiverId || null,
        file_url: fileUrl,
      };

      // 3. Send message via store action
      await sendMessage(messageData);

      // 4. Reset input state
      setInputValue("");
      removeSelectedFile(); // Use the helper to reset file state
      scrollToBottom('smooth'); // Scroll down after sending

    } catch (error: any) {
      console.error("Failed to send message", error);
       toast.error(`Failed to send message: ${error?.message || 'Unknown error'}`);
      // No need to setIsUploading(false) here as it's handled in the finally block or wasn't set
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
      if (!window.confirm("Are you sure you want to delete this message?")) return;
      try {
         await deleteMessage(messageId);
         toast.success("Message deleted.");
      } catch (error: any) {
          console.error("Failed to delete message", error);
          toast.error(`Failed to delete message: ${error?.message || 'Unknown error'}`);
      }
  }

  const handleEditStart = (message: MessageWithSender) => {
      setEditingMessageId(message.id);
      setEditingContent(message.content);
  }

  const handleEditCancel = () => {
      setEditingMessageId(null);
      setEditingContent("");
  }

  const handleEditSave = async () => {
       if (!editingMessageId || !editingContent.trim()) return;

       try {
           await updateMessage(editingMessageId, { content: editingContent.trim() });
           toast.success("Message updated.");
           handleEditCancel(); // Reset editing state
       } catch (error: any) {
           console.error("Failed to update message", error);
           toast.error(`Failed to update message: ${error?.message || 'Unknown error'}`);
       }
  }

  // --- Render Logic ---

  // Reverse messages for display (newest at the bottom)
  const displayedMessages = React.useMemo(() => [...messages].reverse(), [messages]);

  // Header Content Logic
   const getHeaderTitle = () => {
       if (isDM) {
           // In a real app, you'd fetch the receiver's username here
           return `Direct Message`; // Placeholder - fetch receiver name later
       } else if (communityId && channelId) {
           const channel = channels.find((c) => c.id === channelId);
           return channel ? `${channel.name}` : "Loading Channel...";
       }
       return "Chat"; // Default
   };

   const getHeaderSubtitle = () => {
       if (isDM) {
           return `Chatting with ${receiverId}`; // Placeholder - use receiver's actual username
       } else if (communityId) {
           // Could show community name here if available
           return `Community: ${communityId}`; // Placeholder
       }
       return null;
   }

  // Display error state
  if (messagesError) {
    return <div className="flex items-center justify-center h-full text-red-500 p-4">Error loading messages: {messagesError}</div>;
  }

  // Ensure user is identified before rendering main chat UI
  if (!loggedInUserId) {
      return <div className="flex items-center justify-center h-full text-muted-foreground p-4">Identifying user...</div>;
  }

  return (
    <div className={cn("h-full flex flex-col bg-background", className)}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <SidebarTrigger className="-ml-1 md:hidden" /> {/* Hide on medium+ screens */}
          <Separator orientation="vertical" className="mr-2 h-6 hidden md:block" />
          {/* Header Avatar/Icon (Optional) */}
           {/*
            <Avatar className="w-10 h-10">
              <AvatarImage src={ isDM ? receiverProfilePic : channelIcon } />
              <AvatarFallback>{getHeaderTitle().slice(0, 1)}</AvatarFallback>
            </Avatar>
          */}
          <div className="min-w-0">
            <h3 className="font-medium truncate">{getHeaderTitle()}</h3>
            <p className="text-xs text-muted-foreground truncate">{getHeaderSubtitle()}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Add Online Members Popover if in a community context */}
          {communityId && <OnlineMembersPopover communityId={communityId} />}
          <Button variant="ghost" size="icon" className="rounded-full">
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 relative">
            {/* Loading Indicator for initial load or pagination */}
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
                key={`message-${message.id}-${message.sent_at}`} // More unique key
                message={message}
                isOwnMessage={message.sender_id === loggedInUserId}
                onDelete={handleDeleteMessage}
                onEditStart={handleEditStart}
                isEditing={editingMessageId === message.id}
                editingContent={editingContent}
                onEditingContentChange={setEditingContent}
                onEditSave={handleEditSave}
                onEditCancel={handleEditCancel}
                onMarkAsRead={markMessageAsRead} // Pass mark as read handler
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
         {/* File Preview Area */}
         {selectedFile && (
           <div className="mb-2 flex items-center justify-between bg-muted p-2 rounded-lg text-sm">
             <div className="flex items-center gap-2 overflow-hidden">
               {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
               ) : selectedFile.type.startsWith("image/") ? (
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
               disabled={isUploading}
             >
               <X className="w-4 h-4" />
             </Button>
           </div>
         )}
        {/* Main Input Row */}
        <div className="flex items-center gap-2">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.txt" // Expanded accept types
            disabled={isUploading}
          />
          {/* Attach Button */}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full shrink-0"
            onClick={() => fileInputRef.current?.click()}
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
              className="pr-10" // Make space for emoji button
              disabled={isUploading}
              aria-label="Message input"
            />
            {/* Emoji Button (Functionality not implemented) */}
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
            disabled={(!inputValue.trim() && !selectedFile) || isUploading}
            size="icon"
            className="rounded-lg shrink-0"
            aria-label="Send message"
          >
           {isUploading ? <Loader2 className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}


// --- MessageItem Component ---
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
                        // console.log(`Message ${message.id} is visible, marking as read.`);
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


    return (
        <div
            ref={messageRef} // Ref for intersection observer
            className={cn(
                "flex items-start gap-3 group relative", // Add group for hover effects
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
                    "flex-grow-0 max-w-[75%] p-2 px-3 rounded-lg relative", // flex-grow-0 prevents bubble stretching unnecessarily
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
                            className="text-sm bg-background text-foreground focus:ring-1" // Adjust styling for edit mode
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
                          <a href={message.file_url} target="_blank" rel="noopener noreferrer">
                             <Image
                                src={message.file_url}
                                alt="Sent image"
                                width={250} // Adjust size as needed
                                height={250}
                                className="rounded-md mb-1 max-w-full h-auto cursor-pointer"
                             />
                          </a>
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
                                {message.content || message.file_url.split('/').pop()?.split('?')[0].split('-').slice(1).join('-')} {/* Extract filename */}
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
                                   <CheckCheck className="w-3.5 h-3.5 text-blue-400" /> // Different color for read receipts
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