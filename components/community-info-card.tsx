"use client";

import * as React from "react";
import {
  CalendarIcon,
  Users,
  Info,
  UserPlus,
  MessageSquarePlusIcon,
  Eye,
  ShieldAlert,
  ShieldCheck,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useCommunityPresence } from "@/stores/user_online_store";
import { useSingleCommunityStore } from "@/stores/single_community_store";
import { useUserStore } from "@/stores/user_store";
import Link from "next/link";
import { toast } from "sonner";

interface User {
  id: string;
  username: string;
  profile_picture: string | null;
  role?: "admin" | "moderator" | "member";
}

interface CommunityInfo {
  name: string | undefined;
  description: string | null | undefined;
  banner_picture: string | null | undefined;
  created_at: string | null | undefined;
  members: string | undefined;
  online_members: string | undefined;
  users?: User[];
  communityId?: number;
  isMember: boolean;
}

export function CommunityInfoCard({
  name,
  description,
  banner_picture,
  created_at,
  members,
  online_members,
  users = [],
  communityId,
  isMember,
}: CommunityInfo) {
  const [showAllMembers, setShowAllMembers] = React.useState(false);
  const [isImageLoading, setIsImageLoading] = React.useState(true);
  const { onlineMembers } = useCommunityPresence(communityId || 0);
  const { joinCommunity } = useSingleCommunityStore();
  const { user } = useUserStore();

  const handleJoinCommunity = async () => {
    if (user && communityId) {
      try {
        await joinCommunity(communityId.toString(), user.id);
        toast.success("Successfully joined community", {
          className:
            "bg-[#f3f5fc] dark:bg-[#040810] text-[#03050c] dark:text-[#f3f5fc] border border-[#392cce]/20",
        });
      } catch (error) {
        console.error("Error joining community:", error);
        toast.error("Failed to join community", {
          className:
            "bg-[#f3f5fc] dark:bg-[#040810] text-[#03050c] dark:text-[#f3f5fc] border border-red-500/20",
        });
      }
    }
  };

  // Get admins and moderators
  const admins = users.filter((user) => user.role === "admin");
  const moderators = users.filter((user) => user.role === "moderator");
  const regularMembers = users.filter(
    (user) => !user.role || user.role === "member"
  );

  // Format date
  const formattedDate = created_at
    ? new Date(created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <Card className="w-full border-[#392cce]/10 dark:border-[#392cce]/20 bg-white dark:bg-[#040810] shadow-md">
      {/* Banner Image */}
      <div className="relative w-full h-48 overflow-hidden rounded-t-lg">
        {/* Gradient overlay - always visible */}
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-transparent via-transparent to-black/50" />

        {banner_picture ? (
          <>
            {isImageLoading && (
              <div className="absolute inset-0 bg-gradient-to-r animate-pulse bg-[#040810]/80 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#392cce]/30 border-t-[#392cce] rounded-full animate-spin" />
              </div>
            )}
            <Image
              src={banner_picture}
              alt={`${name} banner`}
              className={cn(
                "w-full h-full object-cover transition-opacity duration-700",
                isImageLoading ? "opacity-0" : "opacity-100"
              )}
              fill
              sizes="(max-width: 768px) 100vw, 500px"
              onLoad={() => setIsImageLoading(false)}
            />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0c18] to-[#040810] flex items-center justify-center">
            <Users className="w-16 h-16 text-[#392cce]/20" />
          </div>
        )}

        {/* Membership badge overlay */}
        {isMember && (
          <div className="absolute top-4 right-4 z-20">
            <Badge
              variant="outline"
              className="bg-[#392cce]/20 backdrop-blur-sm border-[#392cce]/30 text-white text-xs font-medium"
            >
              <UserPlus className="h-3 w-3 mr-1.5" />
              Member
            </Badge>
          </div>
        )}

        {/* Community name overlay */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/70 to-transparent">
          <h2 className="text-xl md:text-2xl font-bold text-white drop-shadow-sm">
            {name}
          </h2>
          {formattedDate && (
            <div className="flex items-center text-xs text-white/80 mt-1">
              <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
              Created {formattedDate}
            </div>
          )}
        </div>
      </div>

      <CardHeader className="pt-5 px-5">
        {/* Community Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-[#392cce]/5 dark:bg-[#392cce]/10 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center">
              <Users className="h-5 w-5 text-[#392cce] mr-2" />
              <div>
                <p className="text-sm text-[#03050c]/70 dark:text-[#f3f5fc]/70">
                  Members
                </p>
                <p className="font-bold text-[#03050c] dark:text-[#f3f5fc]">
                  {members}
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="bg-[#392cce]/10 border-[#392cce]/20 text-[#392cce]"
            >
              Total
            </Badge>
          </div>

          <div className="bg-[#4d1f75]/5 dark:bg-[#4d1f75]/10 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center">
              <Users className="h-5 w-5 text-[#4d1f75] mr-2" />
              <div>
                <p className="text-sm text-[#03050c]/70 dark:text-[#f3f5fc]/70">
                  Online
                </p>
                <p className="font-bold text-[#03050c] dark:text-[#f3f5fc]">
                  {online_members}
                </p>
              </div>
            </div>
            <div className="h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-green-500/20" />
          </div>
        </div>

        {/* Description */}
        {description && (
          <div className="bg-[#f3f5fc]/50 dark:bg-[#0a0c18] border border-[#392cce]/10 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <Info className="h-4 w-4 text-[#392cce] mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-[#03050c]/90 dark:text-[#f3f5fc]/90">
                {description}
              </p>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="px-5 pt-0">
        <div className="space-y-5">
          {/* Members Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-[#03050c] dark:text-[#f3f5fc] flex items-center gap-2">
                <Users className="h-4 w-4 text-[#392cce]" />
                Community Members
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllMembers(!showAllMembers)}
                className="h-8 text-xs text-[#392cce] hover:text-[#392cce] hover:bg-[#392cce]/10"
              >
                {showAllMembers ? "Show Less" : "Show All"}
              </Button>
            </div>

            <ScrollArea
              className={cn(
                "rounded-lg border border-[#392cce]/10 dark:border-[#0a0c18]",
                showAllMembers ? "h-[240px]" : "h-[130px]"
              )}
            >
              {admins.length > 0 && (
                <div className="px-3 py-2">
                  <p className="text-xs font-medium text-[#03050c]/60 dark:text-[#f3f5fc]/60 mb-2">
                    Admins
                  </p>
                  <div className="space-y-1">
                    {admins.map((user) => (
                      <MemberItem
                        key={user.id}
                        user={user}
                        isOnline={!!onlineMembers[user.id]}
                      />
                    ))}
                  </div>
                </div>
              )}

              {moderators.length > 0 && (
                <div className="px-3 py-2">
                  <p className="text-xs font-medium text-[#03050c]/60 dark:text-[#f3f5fc]/60 mb-2">
                    Moderators
                  </p>
                  <div className="space-y-1">
                    {moderators.map((user) => (
                      <MemberItem
                        key={user.id}
                        user={user}
                        isOnline={!!onlineMembers[user.id]}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="px-3 py-2">
                <p className="text-xs font-medium text-[#03050c]/60 dark:text-[#f3f5fc]/60 mb-2">
                  Members
                </p>
                <div className="space-y-1">
                  {regularMembers.map((user) => (
                    <MemberItem
                      key={user.id}
                      user={user}
                      isOnline={!!onlineMembers[user.id]}
                    />
                  ))}
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Community Rules */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-[#03050c] dark:text-[#f3f5fc] flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#882a9d]" />
              Community Rules
            </h3>

            <div className="bg-[#f3f5fc]/50 dark:bg-[#0a0c18] border border-[#392cce]/10 rounded-lg overflow-hidden">
              <div className="p-3 border-b border-[#392cce]/10">
                <div className="flex gap-2">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#392cce]/10 flex items-center justify-center text-xs font-bold text-[#392cce]">
                    1
                  </div>
                  <p className="text-sm text-[#03050c]/90 dark:text-[#f3f5fc]/90">
                    Be respectful and helpful
                  </p>
                </div>
              </div>

              <div className="p-3 border-b border-[#392cce]/10">
                <div className="flex gap-2">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#392cce]/10 flex items-center justify-center text-xs font-bold text-[#392cce]">
                    2
                  </div>
                  <p className="text-sm text-[#03050c]/90 dark:text-[#f3f5fc]/90">
                    No spam or self-promotion
                  </p>
                </div>
              </div>

              <div className="p-3">
                <div className="flex gap-2">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#392cce]/10 flex items-center justify-center text-xs font-bold text-[#392cce]">
                    3
                  </div>
                  <p className="text-sm text-[#03050c]/90 dark:text-[#f3f5fc]/90">
                    Follow Synapses content policy
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="px-5 py-4 border-t border-[#392cce]/10 dark:border-[#0a0c18]">
        {isMember ? (
          <div className="w-full grid grid-cols-2 gap-3">
            <Link
              href={`/community/${communityId}/create_post`}
              className="w-full"
            >
              <Button
                variant="default"
                className="w-full bg-[#392cce] hover:bg-[#392cce]/90 text-white"
              >
                <MessageSquarePlusIcon className="mr-2 h-4 w-4" />
                Create Post
              </Button>
            </Link>
            <Link href={`/community/${communityId}`} className="w-full">
              <Button
                variant="outline"
                className="w-full border-[#392cce]/20 text-[#392cce] hover:bg-[#392cce]/10 hover:text-[#392cce]"
              >
                <Eye className="mr-2 h-4 w-4" />
                View Community
              </Button>
            </Link>
          </div>
        ) : (
          <Button
            className="w-full bg-[#392cce] hover:bg-[#392cce]/90 text-white"
            onClick={handleJoinCommunity}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Join Community
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

// Member item component
interface MemberItemProps {
  user: User;
  isOnline: boolean;
}

const MemberItem: React.FC<MemberItemProps> = ({ user, isOnline }) => {
  // Role badge styling
  const getRoleBadgeStyle = (role?: string) => {
    switch (role) {
      case "admin":
        return "bg-[#882a9d]/10 text-[#882a9d] border-[#882a9d]/30";
      case "moderator":
        return "bg-[#392cce]/10 text-[#392cce] border-[#392cce]/30";
      default:
        return "bg-[#4d1f75]/10 text-[#4d1f75] border-[#4d1f75]/30";
    }
  };

  return (
    <Link href={`/account/${user.id}`}>
      <div className="flex items-center justify-between p-2 hover:bg-[#392cce]/5 dark:hover:bg-[#392cce]/10 rounded-md transition-colors">
        <div className="flex items-center gap-2">
          <div className="relative flex-shrink-0">
            <Avatar className="h-8 w-8 border border-white dark:border-[#0a0c18]">
              <AvatarImage src={user.profile_picture || ""} />
              <AvatarFallback className="bg-[#392cce]/10 text-[#392cce]">
                {user.username.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span
              className={cn(
                "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-[#040810]",
                isOnline ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
              )}
            />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-medium text-[#03050c] dark:text-[#f3f5fc] truncate">
              {user.username}
            </p>
          </div>
        </div>

        {user.role && user.role !== "member" && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] px-1.5 py-0",
                    getRoleBadgeStyle(user.role)
                  )}
                >
                  {user.role === "admin" ? (
                    <ShieldAlert className="h-3 w-3" />
                  ) : (
                    <ShieldCheck className="h-3 w-3" />
                  )}
                </Badge>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                className="bg-[#040810] border-[#0a0c18] text-[#f3f5fc]"
              >
                <p>{user.role === "admin" ? "Admin" : "Moderator"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </Link>
  );
};
