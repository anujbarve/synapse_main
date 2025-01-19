"use client";

import { useEffect } from 'react';
import { useCommunityPresence, useCommunityPresenceStore } from '@/stores/user_online_store';

export function CommunityPresenceProvider({ 
  communityId 
}: { 
  communityId: number 
}) {
  const { initializePresence, cleanup } = useCommunityPresenceStore();

  useEffect(() => {
    initializePresence(communityId);
    return () => cleanup(communityId);
  }, [communityId, initializePresence, cleanup]); // Added missing dependencies

  return null;
}

// components/CommunityHeader.tsx
export function CommunityHeader({ communityId }: { communityId: number }) {
  const { onlineCount, totalMembers } = useCommunityPresence(communityId);

  return (
    <div className="flex items-center justify-between p-4">
      <h1>Community Name</h1>
      <div className="text-sm text-gray-500">
        <span className="font-medium">{onlineCount}</span> online of{' '}
        <span className="font-medium">{totalMembers}</span> members
      </div>
    </div>
  );
}