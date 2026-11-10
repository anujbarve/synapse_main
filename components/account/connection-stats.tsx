// components/social/connection-stats.tsx
"use client";

interface ConnectionStatsProps {
  // Accepted friend count, computed on the server
  friendCount: number;
  variant?: "default" | "compact";
}

export function ConnectionStats({ friendCount, variant = "default" }: ConnectionStatsProps) {
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
