  "use client";

  import * as React from "react";
  import { ArrowDownIcon, ArrowUpIcon, Heart, MessageSquare, Share } from "lucide-react";
  import { Button } from "@/components/ui/button";
  import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

  export function RedditPost() {
    return (
      <Card className="w-full max-w-3xl mx-auto mb-4">
        <CardHeader>
          {/* Post Title */}
          <CardTitle className="text-lg font-bold">
            Example Post Title
          </CardTitle>
        </CardHeader>

        <CardContent>
          {/* Image/Video Placeholder */}
          <div className="aspect-video rounded-lg bg-muted/50 mb-4">
              <Image src="https://preview.redd.it/this-is-mt-kailash-in-tibet-just-north-of-nepal-it-has-v0-fpsz097efwae1.jpeg?width=1080&crop=smart&auto=webp&s=f5d4b9641f4a30023ba85c61f91a833cd40a332e" alt=""/>
          </div>

          {/* Post Body */}
          <p className="text-sm text-muted-foreground">
            This is a placeholder for the post body. Add a short description or main text here.
          </p>
        </CardContent>

        <CardFooter className="flex items-center justify-between">
          {/* Vote and Action Buttons */}
          <div className="flex items-center gap-2">
            <Button variant="outline" >
              <ArrowUpIcon/>1.2 K
            </Button>
            <Button variant="outline">
            <ArrowDownIcon/> 987
            </Button>
          </div>

          {/* Interaction Buttons */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <MessageSquare className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Heart className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Share className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    );
  }
