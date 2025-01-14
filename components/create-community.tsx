"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function CreateCommunity() {
  return (
    <Card className="w-full max-w-3xl mx-auto mb-4">
      <CardHeader>
        <CardTitle className="text-lg font-bold">Create a Community</CardTitle>
      </CardHeader>

      <CardContent>
        {/* Post Title Input */}
        <div className="mb-4">
          <Input
            type="text"
            placeholder="Enter a title for your post"
            className="w-full"
          />
        </div>

        {/* Post Content Input */}
        <div className="mb-4">
          <Textarea
            placeholder="Write something here..."
            className="w-full"
            rows={4}
          />
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between">
        {/* Post Button */}
        <Button>Post</Button>

        {/* Cancel Button */}
        <Button variant="outline">Cancel</Button>
      </CardFooter>
    </Card>
  );
}
