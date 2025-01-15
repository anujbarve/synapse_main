"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";

interface CommunityInfo {
  name: string| undefined;
  description: string | null |undefined;
  banner_picture: string | null | undefined;
  created_at:string | null | undefined;
  members: string | undefined;
  online_members: string | undefined;
  ranking: string | undefined;
}

export function CommunityInfoCard({
  name,
  description,
  banner_picture,
  created_at,
  members,
  online_members,
  ranking,
}: CommunityInfo) {
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
        <CardDescription className="mt-4">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Community Stats */}
          <div className="grid grid-cols-3 gap-4 border-b pb-4">
            <div className="text-center">
              <p className="font-bold">{members}</p>
              <p className="text-xs text-muted-foreground">Members</p>
            </div>
            <div className="text-center">
              <p className="font-bold">{online_members}</p>
              <p className="text-xs text-muted-foreground">Online</p>
            </div>
            <div className="text-center">
              <p className="font-bold">#{ranking}</p>
              <p className="text-xs text-muted-foreground">Ranking</p>
            </div>
          </div>

          {/* Created Date */}
          <div className="flex items-center space-x-2 text-sm">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            {created_at ? <span>{new Date(created_at).toISOString().split('T')[0]}</span> : <></>}
          </div>

          {/* Community Rules */}
          <div className="space-y-2">
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
        <Button className="w-full">Join Community</Button>
        <Button variant="outline" className="w-full">
          Create Post
        </Button>
      </CardFooter>
    </Card>
  );
}
