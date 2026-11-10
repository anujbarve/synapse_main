"use client";

import { CommunityBanner } from "@/components/community-banner";
import type { Community } from "@/types/custom";

interface ExploreCommunitiesGridProps {
  communities: Community[];
  memberCommunityIds: number[];
}

export function ExploreCommunitiesGrid({
  communities,
  memberCommunityIds,
}: ExploreCommunitiesGridProps) {
  const memberIds = new Set(memberCommunityIds);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 w-full">
      {communities.map((community) => (
        <div className="col-span-1" key={community.id}>
          <CommunityBanner
            id={community.id.toString()}
            title={community.name}
            description={community.description}
            banner_picture={community.banner_picture}
            isMember={memberIds.has(community.id)}
          />
        </div>
      ))}
    </div>
  );
}
