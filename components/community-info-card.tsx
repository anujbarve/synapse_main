"use client";

import * as React from "react";
import { CalendarIcon, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import { Badge } from "./ui/badge";
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
  const { onlineMembers } = useCommunityPresence(communityId || 0);
  const { joinCommunity } = useSingleCommunityStore();
  const { user } = useUserStore();

  const handleJoinCommunity = async () => {
    if (user && communityId) {
      try {
        await joinCommunity(communityId.toString(), user.id);
        toast.success("Room Joined Successfully"); // Navigate to the community after successful join
      } catch (error) {
        console.error("Error joining community:", error);
      }
    }
  };

  return (
    <Card>
      {/* Banner Image */}
      <div className="relative w-full h-40">
        {banner_picture ? (
          <Image
            src={banner_picture}
            alt="Community Banner"
            className="w-full h-full object-cover rounded-lg"
            height={300}
            width={1080}
          />
        ) : (
          <div className="bg-gray-200 w-full h-full flex items-center justify-center text-gray-500 rounded-t-lg">
            No Banner Image
          </div>
        )}
      </div>
      <CardHeader>
        <CardTitle>
          <div>
            <h2 className="text-xl">{name}</h2>
          </div>
        </CardTitle>
        <CardDescription className="mt-4">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Community Stats */}
          <div className="grid grid-cols-2 gap-4 border-b pb-4">
            <div className="text-center">
              <p className="font-bold">{members}</p>
              <p className="text-xs text-muted-foreground">Members</p>
            </div>
            <div className="text-center">
              <p className="font-bold">{online_members}</p>
              <p className="text-xs text-muted-foreground">Online</p>
            </div>
          </div>

          {/* Created Date */}
          <div className="flex items-center space-x-2 text-sm">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            {created_at ? (
              <span>{new Date(created_at).toISOString().split("T")[0]}</span>
            ) : (
              <></>
            )}
          </div>

          {/* Members Section */}
          <div className="space-y-2 border-t pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Members
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllMembers(!showAllMembers)}
              >
                {showAllMembers ? "Show Less" : "Show More"}
              </Button>
            </div>

            <ScrollArea
              className={`${showAllMembers ? "h-[200px]" : "h-[100px]"}`}
            >
              <div className="space-y-2">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.profile_picture || ""} />
                          <AvatarFallback>
                            {user.username.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span
                          className={cn(
                            "absolute bottom-0 right-0 h-2 w-2 rounded-full ring-2 ring-white",
                            !!onlineMembers[user.id]
                              ? "bg-green-500"
                              : "bg-gray-300"
                          )}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{user.username}</p>
                        {user.role && (
                          <Badge
                            variant={
                              user.role === "admin"
                                ? "destructive"
                                : user.role === "moderator"
                                ? "blue"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            {user.role.charAt(0).toUpperCase() +
                              user.role.slice(1)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Community Rules */}
          <div className="space-y-2 border-t pt-4">
            <h3 className="text-sm font-medium">Community Rules</h3>
            <div className="space-y-2 text-sm">
              <p className="flex items-center space-x-2">
                <span className="font-medium">1.</span>
                <span>Be respectful and helpful</span>
              </p>
              <p className="flex items-center space-x-2">
                <span className="font-medium">2.</span>
                <span>No spam or self-promotion</span>
              </p>
              <p className="flex items-center space-x-2">
                <span className="font-medium">3.</span>
                <span>Follow Synapses content policy</span>
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        {isMember ? (
         <Link href={`/community/${communityId}/create_post`} className="w-full">
           <Button variant="default" className="w-full">
            Create Post
          </Button>
         </Link>
        ) : (
          <Button className="w-full" onClick={handleJoinCommunity} >Join Community</Button>
        )}
      </CardFooter>
    </Card>
  );
}
