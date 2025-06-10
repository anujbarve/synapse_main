"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Image from "next/image";
import Link from "next/link";
import { useSingleCommunityStore } from "@/stores/single_community_store";
import { useUserStore } from "@/stores/user_store";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  Users, 
  UserPlus, 
  ArrowRight, 
  Shield,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

// Community banner gradient presets
const GRADIENT_VARIANTS = [
  // Purple theme variants
  "from-[#392cce]/90 to-[#882a9d]/90", // Primary to Accent
  "from-[#392cce]/90 to-[#4d1f75]/90", // Primary to Secondary
  "from-[#4d1f75]/90 to-[#882a9d]/90", // Secondary to Accent
  
  // Alternative tones of the theme colors
  "from-[#4935e8]/90 to-[#9e35b1]/90",
  "from-[#3428b7]/90 to-[#7a2588]/90",
  "from-[#4d1f75]/90 to-[#641e73]/90",
  
  // More vibrant gradients within the theme
  "from-[#392cce]/80 via-[#5a2fb3]/80 to-[#882a9d]/80",
  "from-[#4d1f75]/80 via-[#6a2a8d]/80 to-[#882a9d]/80",
  "from-[#392cce]/80 via-[#4d1f75]/80 to-[#331a66]/80",
  "from-[#45309f]/80 via-[#6b2992]/80 to-[#882a9d]/80",
] as const;

interface CommunityBannerProps {
  id: string;
  title: string;
  description: string | null;
  banner_picture: string | null;
  isMember: boolean;
  memberCount?: number;
  postCount?: number;
  createdAt?: string;
  owner?: {
    username: string;
    id: string;
  };
}

export function CommunityBanner({
  id,
  title,
  description,
  banner_picture,
  isMember,
  owner,
}: CommunityBannerProps) {
  const [selectedGradient, setSelectedGradient] = React.useState<string>(GRADIENT_VARIANTS[0]);
  const [isImageLoading, setIsImageLoading] = React.useState(true);
  const [showFullDescription, setShowFullDescription] = React.useState(false);
  
  const { setCurrentCommunity, joinCommunity } = useSingleCommunityStore();
  const { user } = useUserStore();
  const router = useRouter();

  // Select a gradient based on community ID for consistency
  React.useEffect(() => {
    const communityIdSum = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const gradientIndex = communityIdSum % GRADIENT_VARIANTS.length;
    setSelectedGradient(GRADIENT_VARIANTS[gradientIndex]);
  }, [id]);

  const handleSetCurrentCommunity = () => {
    setCurrentCommunity(parseInt(id));
  };

  const handleJoinCommunity = async () => {
    if (user) {
      try {
        await joinCommunity(id, user.id);
        toast.success("Community joined successfully", {
          className: "bg-[#f3f5fc] dark:bg-[#040810] text-[#03050c] dark:text-[#f3f5fc] border border-[#392cce]/20",
        });
        router.push(`/community/${id}`);
      } catch (error) {
        console.error("Error joining community:", error);
        toast.error("Failed to join community", {
          className: "bg-[#f3f5fc] dark:bg-[#040810] text-[#03050c] dark:text-[#f3f5fc] border border-red-500/20",
        });
      }
    } else {
      toast.error("You must be logged in to join", {
        className: "bg-[#f3f5fc] dark:bg-[#040810] text-[#03050c] dark:text-[#f3f5fc] border border-red-500/20",
      });
    }
  };
  
  // Truncate description if needed
  const isLongDescription = description && description.length > 120;
  const truncatedDescription = isLongDescription && !showFullDescription
    ? `${description.slice(0, 120)}...`
    : description;

  return (
    <Card className="w-full overflow-hidden border-[#392cce]/10 dark:border-[#392cce]/20 bg-white dark:bg-[#040810]">
      {/* Banner Image with Gradient Overlay */}
      <div className="relative w-full h-48 sm:h-64 md:h-80 overflow-hidden">
        {/* Gradient overlay - always visible */}
        <div 
          className={cn(
            "absolute inset-0 z-10 bg-gradient-to-b from-transparent via-transparent to-black/70",
            `bg-gradient-to-r ${selectedGradient}`
          )}
        />
        
        {/* Banner image */}
        {banner_picture ? (
          <>
            {isImageLoading && (
              <div className="absolute inset-0 bg-gradient-to-r animate-pulse bg-[#040810]/80 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#392cce]/30 border-t-[#392cce] rounded-full animate-spin" />
              </div>
            )}
            <Image
              src={banner_picture}
              alt={`${title} banner`}
              className={cn(
                "w-full h-full object-cover object-center transition-opacity duration-700",
                isImageLoading ? "opacity-0" : "opacity-100"
              )}
              quality={90}
              priority
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
              onLoad={() => setIsImageLoading(false)}
            />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0c18] to-[#040810] flex items-center justify-center">
            <Users className="w-16 h-16 text-[#392cce]/20" />
          </div>
        )}
        
        {/* Community title overlay */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-5 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white text-xs font-medium"
              >
                Community
              </Badge>
              
              {/* Member status badge - moved up here */}
              {isMember && (
                <Badge 
                  variant="outline" 
                  className="bg-[#392cce]/20 backdrop-blur-sm border-[#392cce]/30 text-white text-xs font-medium"
                >
                  <CheckCircle2 className="h-3 w-3 mr-1.5" />
                  Member
                </Badge>
              )}
            </div>
            
            {owner && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href={`/account/${owner.id}`} className="hover:opacity-80 transition-opacity">
                      <Badge 
                        variant="outline" 
                        className="bg-[#392cce]/20 backdrop-blur-sm border-[#392cce]/30 text-white text-xs font-medium"
                      >
                        <Shield className="h-3 w-3 mr-1" />
                        {owner.username}
                      </Badge>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Community Owner</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-md">
            {title}
          </h1>
          
        </div>
      </div>
      
      {/* Content Section */}
      <div className="p-5 md:p-6">
        {/* Description */}
        {description && (
          <div className="mb-5">
            <p className="text-[#03050c]/90 dark:text-[#f3f5fc]/90 text-sm leading-relaxed">
              {truncatedDescription}
            </p>
            {isLongDescription && (
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="mt-2 text-xs font-medium text-[#392cce] dark:text-[#392cce] hover:underline focus:outline-none"
              >
                {showFullDescription ? "Show less" : "Read more"}
              </button>
            )}
          </div>
        )}
        
        {/* Action Buttons - Improved layout */}
        <div className="flex flex-wrap gap-2">
          {isMember ? (
            <Link href={`/community/${id}`} className="w-full">
              <Button 
                variant="default" 
                className="w-full bg-[#392cce] hover:bg-[#392cce]/90 text-white"
                onClick={handleSetCurrentCommunity}
              >
                <Users className="mr-2 h-4 w-4" />
                Switch to Community
              </Button>
            </Link>
          ) : (
            <div className="w-full flex flex-col sm:flex-row gap-2">
              <Link href={`/community/${id}`} className="w-full sm:flex-1">
                <Button 
                  variant="outline" 
                  className="w-full border-[#392cce]/20 text-[#392cce] hover:bg-[#392cce]/10 hover:text-[#392cce]"
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  View Community
                </Button>
              </Link>
              <Button 
                variant="default" 
                className="w-full sm:flex-1 bg-[#392cce] hover:bg-[#392cce]/90 text-white"
                onClick={handleJoinCommunity}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Join Community
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}