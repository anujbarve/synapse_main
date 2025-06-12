"use client";

import * as React from "react";
import {
  Hash,
  Home,
  LaptopMinimal,
  Lightbulb,
  Settings2,
  StepBack,
  Users,
} from "lucide-react";

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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

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



  const router = useRouter();
  const { moderationStatus, checkModStatus, clearModStatus } = useSingleCommunityStore();
  const [showBanDialog, setShowBanDialog] = React.useState(false);

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
    let iconColor;
    let backgroundColor;
    
    // Assign icons and colors based on channel type
    switch (channel.type) {
      case "Text":
        channelIcon = Hash; // Changed from Book to Hash for text channels
        iconColor = "#392cce"; // Primary color
        backgroundColor = "rgba(57, 44, 206, 0.1)"; // Primary with opacity
        break;
      case "Voice":
        channelIcon = LaptopMinimal;
        iconColor = "#4d1f75"; // Secondary color
        backgroundColor = "rgba(77, 31, 117, 0.1)"; // Secondary with opacity
        break;
      case "Video":
        channelIcon = LaptopMinimal;
        iconColor = "#882a9d"; // Accent color
        backgroundColor = "rgba(136, 42, 157, 0.1)"; // Accent with opacity
        break;
      default:
        channelIcon = Hash;
        iconColor = "#392cce"; // Default to primary
        backgroundColor = "rgba(57, 44, 206, 0.1)";
        break;
    }
    
    // Update the URL format to include communityId for non-text channels
    const channelUrl = channel.type === "Text" 
      ? `/community/${currentCommunity}/chat/${channel.id}` 
      : `/community/${currentCommunity}/room/${channel.id}`;

    
    return {
      id: channel.id,
      name: channel.name,
      url: channelUrl,
      icon: channelIcon,
      type: channel.type as "Text" | "Voice" | "Video",
      iconColor: iconColor,
      backgroundColor: backgroundColor,
      description: channel.description || ""
    };
  });
};

  useEffect(() => {
    if (user?.id && currentCommunity) {
      checkModStatus(user.id, currentCommunity.toString());
    }

    return () => {
      clearModStatus();
    };
  }, [user?.id, currentCommunity,clearModStatus, checkModStatus]);

  // Add this useEffect to show the ban dialog
  useEffect(() => {
    if (moderationStatus.isBanned) {
      setShowBanDialog(true);
    }
  }, [moderationStatus.isBanned]);

  // Add this handler
  const handleReturnToDashboard = () => {
    router.push('/dashboard');
    setShowBanDialog(false);
  };

  
  // Add the ban dialog component
  const BanDialog = () => (
    <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Ban className="h-5 w-5" />
            Access Denied
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm">
            You have been banned from{" "}
            <span className="font-semibold">
              {moderationStatus.communityName || "this community"}
            </span>
          </p>
          {moderationStatus.banReason && (
            <div className="rounded-md bg-muted p-3">
              <p className="text-xs font-medium">Reason:</p>
              <p className="text-sm">{moderationStatus.banReason}</p>
            </div>
          )}
          {moderationStatus.banDate && (
            <p className="text-xs text-muted-foreground">
              Banned on: {new Date(moderationStatus.banDate).toLocaleDateString()}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button 
            variant="destructive" 
            onClick={handleReturnToDashboard}
            className="w-full"
          >
            Return to Dashboard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );


  return (
    <>
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
            {/* Only show rooms if user is not banned */}
            {!moderationStatus.isBanned && (
              <NavRooms 
                rooms={transformChannelsToNavRooms()} 
                loading={channelsLoading} 
              />
            )}
            {/* Show ban message in sidebar */}
            {moderationStatus.isBanned && (
              <div className="px-4 py-3 mt-4">
                <div className="flex items-center gap-2 text-destructive">
                  <Ban className="h-4 w-4" />
                  <span className="text-sm font-medium">Access Restricted</span>
                </div>
              </div>
            )}
          </SidebarContent>
        )}

        {/* Only show community settings if user is not banned */}
        {typeof window !== "undefined" &&
          currentCommunity > 0 &&
          isMemberOfCommunity(currentCommunity) &&
          !moderationStatus.isBanned && (
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
      
      {/* Keep the ban dialog */}
      <BanDialog />
    </>
  );
}
