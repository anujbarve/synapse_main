"use client"

import {
  Users,
  type LucideIcon,
} from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"

interface Channel {
  id: string | number
  name: string
  url: string
  icon: LucideIcon
  type: "Text" | "Voice" | "Video"
  iconColor?: string
  backgroundColor?: string
  description?: string
}

interface NavRoomsProps {
  rooms: Channel[]
  loading?: boolean
}

export function NavRooms({ rooms, loading = false }: NavRoomsProps) {
  // Group channels by type
  const textChannels = rooms.filter(room => room.type === "Text");
  const voiceChannels = rooms.filter(room => room.type === "Voice");
  const videoChannels = rooms.filter(room => room.type === "Video");
  
  const renderChannelGroup = (channels: Channel[], groupLabel: string) => {
    if (channels.length === 0) return null;
    
    return (
      <SidebarGroup>
        <SidebarGroupLabel>{groupLabel}</SidebarGroupLabel>
        <SidebarMenu>
          {channels.map((channel) => (
            <SidebarMenuItem key={channel.id}>
              <SidebarMenuButton 
                asChild 
                className="group relative"
              >
                <a href={channel.url}>
                  {/* Hover background with channel type color */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-md"
                    style={{ backgroundColor: channel.backgroundColor || 'rgba(var(--primary), 0.1)' }}
                  />
                  
                  {/* Channel icon and name */}
                  <div className="relative flex items-center w-full">
                    <channel.icon 
                      className="h-4 w-4 shrink-0" 
                      style={{ color: channel.iconColor }}
                    />
                    <span className="ml-2 truncate">
                      {channel.name}
                    </span>

                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>
    );
  };
  
  if (loading) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>
          <Skeleton className="h-4 w-16" />
        </SidebarGroupLabel>
        <SidebarMenu>
          {Array(4).fill(0).map((_, i) => (
            <SidebarMenuItem key={i}>
              <div className="flex items-center space-x-3 py-2 px-3">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>
    );
  }

  if (rooms.length === 0) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>Channels</SidebarGroupLabel>
        <div className="px-3 py-6 text-center">
          <Users className="mx-auto h-8 w-8 text-muted-foreground opacity-50" />
          <p className="mt-2 text-sm text-muted-foreground">
            No channels available
          </p>
        </div>
      </SidebarGroup>
    );
  }

  return (
    <>
      {renderChannelGroup(textChannels, "Text Channels")}
      {renderChannelGroup(voiceChannels, "Media Channels")}
      {renderChannelGroup(videoChannels, "Media Channels")}
    </>
  );
}