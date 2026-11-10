// stores/useCommunityPresenceStore.ts
import { create } from "zustand";
import { createClient } from "@/utils/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

interface PresenceState {
  userId: string;
  lastSeen?: string;
}

// Payload each member tracks on the community presence channel
type PresencePayload = {
  userId?: string;
  timestamp?: string;
};

interface CommunityPresence {
  onlineMembers: Record<string, PresenceState>;
  totalMembers: number;
}

interface CommunityPresenceStore {
  communities: Record<number, CommunityPresence>;
  initializePresence: (communityId: number) => Promise<void>;
  cleanup: (communityId: number) => void;
  error: string | null;
}

const log = (message: string, data?: unknown) => {
};

export const useCommunityPresenceStore = create<CommunityPresenceStore>((set, get) => {
  const channels: Record<number, RealtimeChannel> = {};

  return {
    communities: {},
    error: null,

    initializePresence: async (communityId: number) => {
      if (channels[communityId]) {
        log(`Presence already initialized for community ${communityId}`);
        return;
      }

      try {
        const supabase = createClient();

        // Get community members and current user
        const [{ data: members, error: membersError }, { data: { user }, error: userError }] = await Promise.all([
          supabase.from('community_members').select('user_id').eq('community_id', communityId),
          supabase.auth.getUser()
        ]);

        if (membersError) throw membersError;
        if (userError) throw userError;
        if (!user) throw new Error('No authenticated user');

        // Create a Set of community member IDs for efficient lookup
        const communityMemberIds = new Set(members?.map(m => m.user_id) || []);

        // Initialize community presence state
        set(state => ({
          communities: {
            ...state.communities,
            [communityId]: {
              onlineMembers: {},
              totalMembers: communityMemberIds.size
            }
          }
        }));

        // Create a single channel for the community
        channels[communityId] = supabase.channel(`community:${communityId}`, {
          config: {
            presence: {
              key: 'presence',
            },
          },
        });

        channels[communityId]
          .on('presence', { event: 'sync' }, () => {
            const presenceState = channels[communityId].presenceState<PresencePayload>();
            log(`Presence sync for community ${communityId}`, presenceState);

            // Get online users that are community members
            const onlineMembers = Object.values(presenceState).reduce<Record<string, PresenceState>>((acc, presences) => {
              presences.forEach((presence) => {
                if (presence.userId && communityMemberIds.has(presence.userId)) {
                  acc[presence.userId] = {
                    userId: presence.userId,
                    lastSeen: presence.timestamp
                  };
                }
              });
              return acc;
            }, {});

            set(state => ({
              communities: {
                ...state.communities,
                [communityId]: {
                  ...state.communities[communityId],
                  onlineMembers
                }
              }
            }));
          })
          .on<PresencePayload>('presence', { event: 'join' }, ({ key, newPresences }) => {
            log(`Users joined community ${communityId}`, newPresences);
            set(state => {
              const currentOnlineMembers = { ...state.communities[communityId]?.onlineMembers };
              newPresences.forEach((presence) => {
                if (presence.userId && communityMemberIds.has(presence.userId)) {
                  currentOnlineMembers[presence.userId] = {
                    userId: presence.userId,
                    lastSeen: presence.timestamp
                  };
                }
              });
              
              return {
                communities: {
                  ...state.communities,
                  [communityId]: {
                    ...state.communities[communityId],
                    onlineMembers: currentOnlineMembers
                  }
                }
              };
            });
          })
          .on<PresencePayload>('presence', { event: 'leave' }, ({ key, leftPresences }) => {
            log(`Users left community ${communityId}`, leftPresences);
            set(state => {
              const currentOnlineMembers = { ...state.communities[communityId]?.onlineMembers };
              leftPresences.forEach((presence) => {
                if (presence.userId) {
                  delete currentOnlineMembers[presence.userId];
                }
              });
              
              return {
                communities: {
                  ...state.communities,
                  [communityId]: {
                    ...state.communities[communityId],
                    onlineMembers: currentOnlineMembers
                  }
                }
              };
            });
          });

        // Subscribe and track presence only if the user is a community member
        if (communityMemberIds.has(user.id)) {
          await channels[communityId].subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              await channels[communityId].track({
                userId: user.id,
                timestamp: new Date().toISOString()
              });
            }
          });
        }

      } catch (error) {
        log(`Error initializing presence for community ${communityId}`, error);
        set({ error: error instanceof Error ? error.message : String(error) });
      }
    },

    cleanup: (communityId: number) => {
      if (channels[communityId]) {
        log(`Cleaning up presence for community ${communityId}`);
        channels[communityId].unsubscribe();
        delete channels[communityId];
      }
    },
  };
});

export const useCommunityPresence = (communityId: number) => {
  const community = useCommunityPresenceStore(state => state.communities[communityId]);
  
  return {
    onlineCount: Object.keys(community?.onlineMembers || {}).length,
    totalMembers: community?.totalMembers || 0,
    onlineMembers: community?.onlineMembers || {}
  };
};

export const useMemberPresence = (communityId: number, userId: string) => {
  const community = useCommunityPresenceStore(state => state.communities[communityId]);
  return {
    isOnline: !!community?.onlineMembers[userId],
    lastSeen: community?.onlineMembers[userId]?.lastSeen
  };
};