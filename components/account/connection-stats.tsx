// components/social/connection-stats.tsx
"use client";

import { useEffect } from "react";
import { useUserConnectionStore } from "@/stores/connection_store";
import { Skeleton } from "@/components/ui/skeleton";

interface ConnectionStatsProps {
  userId: string;
  variant?: "default" | "compact";
}

export function ConnectionStats({ userId, variant = "default" }: ConnectionStatsProps) {
  const { connections, fetchFriends, loading } = useUserConnectionStore();

  useEffect(() => {
    if (userId) {
      fetchFriends(userId);
    }
  }, [userId, fetchFriends]);

  const friendCount = connections.filter(conn => 
    conn.status === 'accepted' && (conn.user_id === userId || conn.connected_user_id === userId)
  ).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center">
        <Skeleton className="h-6 w-8" />
        <Skeleton className="h-4 w-12 mt-1" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <span className={variant === "compact" ? "text-lg font-semibold" : "font-bold"}>
        {friendCount}
      </span>
      <span className={variant === "compact" ? "text-xs text-muted-foreground" : "text-muted-foreground"}>
        Friends
      </span>
    </div>
  );
}