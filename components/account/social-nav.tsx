// components/layout/social-nav.tsx
"use client";

import { useUserConnectionStore } from "@/stores/connection_store";
import { useUserStore } from "@/stores/user_store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { Users, UserPlus, UserX } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SocialNav() {
  const pathname = usePathname();
  const { user } = useUserStore();
  const { fetchPendingRequests, connections } = useUserConnectionStore();
  
  useEffect(() => {
    if (user?.id) {
      fetchPendingRequests(user.id);
      
      // Set up polling to check for new requests
      const interval = setInterval(() => {
        fetchPendingRequests(user.id);
      }, 60000); // Check every minute
      
      return () => clearInterval(interval);
    }
  }, [user?.id, fetchPendingRequests]);
  
  const pendingRequestsCount = connections.length;
  
  if (!user) return null;
  
  return (
    <div className="flex items-center gap-1 md:gap-2">
      <Link href="/connections">
        <Button 
          variant={pathname?.startsWith('/connections') && !pathname?.includes('/requests') && !pathname?.includes('/blocked') ? "default" : "ghost"} 
          size="sm"
          className="relative"
        >
          <Users className="h-4 w-4" />
          <span className="sr-only md:not-sr-only md:ml-2">Friends</span>
        </Button>
        </Link>
      
      <Link href="/connections/requests">
        <Button 
          variant={pathname?.includes('/requests') ? "default" : "ghost"} 
          size="sm"
          className="relative"
        >
          <UserPlus className="h-4 w-4" />
          <span className="sr-only md:not-sr-only md:ml-2">Requests</span>
          {pendingRequestsCount > 0 && (
            <Badge 
              variant="destructive"
              className="absolute -top-1 -right-1 px-1 py-0.5 min-w-4 h-4 flex items-center justify-center text-[10px]"
            >
              {pendingRequestsCount > 99 ? '99+' : pendingRequestsCount}
            </Badge>
          )}
        </Button>
      </Link>
      
      <Link href="/connections/blocked">
        <Button 
          variant={pathname?.includes('/blocked') ? "default" : "ghost"} 
          size="sm"
        >
          <UserX className="h-4 w-4" />
          <span className="sr-only md:not-sr-only md:ml-2">Blocked</span>
        </Button>
      </Link>
    </div>
  );
}