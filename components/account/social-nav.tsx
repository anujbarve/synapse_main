// components/layout/social-nav.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { Users, UserPlus, UserX } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface SocialNavProps {
  // Logged-in viewer's id (null when logged out)
  viewerId: string | null;
  // Pending requests received by the viewer, computed on the server
  pendingCount: number;
}

export function SocialNav({ viewerId, pendingCount }: SocialNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Timer: re-run the server loaders every minute so the pending badge stays current
  useEffect(() => {
    if (!viewerId) return;

    const interval = setInterval(() => {
      router.refresh();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [viewerId, router]);

  if (!viewerId) return null;

  const pendingRequestsCount = pendingCount;

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
