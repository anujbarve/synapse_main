"use client";

import * as React from "react";
import {
  CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "./ui/badge";

export function CommunityInfoCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <img
            src="https://via.placeholder.com/50" // Add your community icon
            alt="Community Icon"
            width={40}
            height={40}
            className="rounded-full"
          />
          <div>
            <h2 className="text-xl">CommunityName</h2>
            <p className="text-sm text-muted-foreground">CommunityName</p>
          </div>
        </CardTitle>
        <CardDescription className="mt-4">
          Welcome to our community! This is a place to discuss and share
          everything related to our interests.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Community Stats */}
          <div className="grid grid-cols-3 gap-4 border-b pb-4">
            <div className="text-center">
              <p className="font-bold">1.2m</p>
              <p className="text-xs text-muted-foreground">Members</p>
            </div>
            <div className="text-center">
              <p className="font-bold">2.4k</p>
              <p className="text-xs text-muted-foreground">Online</p>
            </div>
            <div className="text-center">
              <p className="font-bold">#142</p>
              <p className="text-xs text-muted-foreground">Ranking</p>
            </div>
          </div>

          {/* Created Date */}
          <div className="flex items-center space-x-2 text-sm">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <span>Created Jan 25, 2018</span>
          </div>

          {/* Topics */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Topics</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Technology</Badge>
              <Badge variant="secondary">Programming</Badge>
              <Badge variant="secondary">Web Development</Badge>
            </div>
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
                <span>Follow Synapse's content policy</span>
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
