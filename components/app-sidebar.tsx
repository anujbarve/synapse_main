"use client";

import * as React from "react";
import {
  Book,
  Home,
  Lightbulb,
  Settings2,
  StepBack,
  Users,
} from "lucide-react";
import {  Mic, Video } from "lucide-react"; // Import icons based on channel types

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "./nav-communities";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useUserStore } from "@/stores/user_store";
import { useCommunityStore } from "@/stores/communities_store";
import { useEffect } from "react";
import { useSingleCommunityStore } from "@/stores/single_community_store";
import { useChannelStore } from "@/stores/channel_store"; // Import the channel store
import { CommunitySettingsDialog } from "./community/community-settings";
import { NavRooms } from "./nav-rooms";

const data = {
  navMain: [
    {
      title: "Home",
      url: "/dashboard",
      icon: Home,
      isActive: true,
      items: [],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUserStore();
  const { userCommunities, fetchUserCommunities, loading } =
    useCommunityStore();
  const { currentCommunity } = useSingleCommunityStore();
  const {
    channels,
    fetchChannels,
    loading: channelsLoading,
  } = useChannelStore();

  useEffect(() => {
    if (user?.id) {
      fetchUserCommunities(user.id);
    }
  }, [user?.id, fetchUserCommunities]);

  // Fetch channels when the current community changes
  useEffect(() => {
    if (currentCommunity > 0) {
      fetchChannels(currentCommunity.toString());
    }
  }, [currentCommunity, fetchChannels]);

  const communityProjects = userCommunities.map((community) => ({
    name: community.name,
    url: `/community/${community.id}`,
    icon: Users, // Default icon for communities
  }));

  const isMemberOfCommunity = (communityId: number) => {
    return userCommunities.some((community) => community.id === communityId);
  };

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const handleDialogOpen = () => {
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
  };

  const transformChannelsToNavRooms = () => {
    return channels.map((channel) => {
      let channelIcon;

      // Assign icons based on channel type
      switch (channel.type) {
        case "Text":
          channelIcon = Book;  // Use Book for text-based channels
          break;
        case "Voice":
          channelIcon = Mic;   // Use Mic for voice channels
          break;
        case "Video":
          channelIcon = Video; // Use Video for video channels
          break;
        default:
          channelIcon = Book;  // Default to Book if type is unrecognized
          break;
      }

      return {
        name: channel.name,
        url: channel.type === "Text" ? `/community/${currentCommunity}/chat/${channel.id}` : `/room/${channel.id}`,
        icon: channelIcon,  // Assign the icon here
      };
    });
  };


  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Lightbulb className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Synapse Inc</span>
                  <span className="truncate text-xs">Enterprise</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      {currentCommunity === 0 ? (
        <SidebarContent>
          <NavMain items={data.navMain} />
          <NavProjects projects={communityProjects} loading={loading} />
        </SidebarContent>
      ) : (
        <SidebarContent>
          <NavMain
            items={[
              {
                title: "Back to Dashboard",
                url: "/dashboard",
                icon: StepBack,
                isActive: true,
                items: [],
              },
            ]}
          />
          <NavRooms rooms={transformChannelsToNavRooms()} loading={channelsLoading} />
        </SidebarContent>
      )}

      {typeof window !== "undefined" &&
        currentCommunity > 0 &&
        isMemberOfCommunity(currentCommunity) && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={handleDialogOpen}>
                    <Settings2 />
                    Community Settings
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
            {/* External Dialog Component */}
            <CommunitySettingsDialog
              community_id={currentCommunity}
              user_id={user?.id}
              isOpen={isDialogOpen}
              onClose={handleDialogClose}
            />
          </SidebarGroup>
        )}
      <SidebarFooter>
        <NavUser
          user={{
            id: user?.id as string,
            name: user?.username as string,
            email: user?.email as string,
            avatar: user?.profile_picture as string,
          }}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
