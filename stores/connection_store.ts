"use client";

import { create } from "zustand";
import { createClient } from "@/utils/supabase/client";
import { useNotificationStore } from "./notification_store";
import { toast } from "sonner";

// User profile information
interface UserProfile {
  id: string;
  username: string;
  email?: string;
  bio?: string | null;
  profile_picture?: string | null;
  reputation?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

// Enhanced connection with user details
interface EnhancedUserConnection {
  id: number;
  user_id: string;
  connected_user_id: string;
  status: "pending" | "accepted" | "blocked";
  created_at: string | null;
  updated_at: string | null;
  // Added user details
  user_details?: UserProfile | null;
  connected_user_details?: UserProfile | null;
}

// Basic connection without user details
interface UserConnection {
  id: number;
  user_id: string;
  connected_user_id: string;
  status: "pending" | "accepted" | "blocked";
  created_at: string | null;
  updated_at: string | null;
}

// Raw connection data from Supabase
interface RawConnection {
  id: number;
  user_id: string;
  connected_user_id: string;
  status: string;
  created_at: string | null;
  updated_at: string | null;
}

interface UserConnectionStore {
  connections: EnhancedUserConnection[];
  currentConnection: EnhancedUserConnection | null;
  loading: boolean;
  error: string | null;

  // CRUD Operations
  // Create
  createConnection: (
    connection: Omit<UserConnection, "id" | "created_at" | "updated_at">
  ) => Promise<EnhancedUserConnection | null>;

  // Read Operations
  fetchConnections: (filters?: {
    user_id?: string;
    connected_user_id?: string;
    status?: "pending" | "accepted" | "blocked";
  }) => Promise<void>;

  fetchConnectionById: (id: number) => Promise<void>;

  // Specialized fetch methods
  fetchFriends: (userId: string) => Promise<void>;
  fetchPendingRequests: (userId: string) => Promise<void>;
  fetchSentRequests: (userId: string) => Promise<void>;
  fetchBlockedUsers: (userId: string) => Promise<void>;

  // Update Operations
  updateConnection: (
    id: number,
    updates: Partial<Omit<UserConnection, "id" | "created_at" | "updated_at">>
  ) => Promise<EnhancedUserConnection | null>;

  // Status-specific update methods
  acceptConnection: (id: number) => Promise<EnhancedUserConnection | null>;
  blockConnection: (id: number) => Promise<EnhancedUserConnection | null>;

  // Delete Operations
  deleteConnection: (id: number) => Promise<boolean>;

  // Bulk Operations
  bulkCreateConnections: (
    connections: Array<Omit<UserConnection, "id" | "created_at" | "updated_at">>
  ) => Promise<EnhancedUserConnection[]>;

  bulkDeleteConnections: (ids: number[]) => Promise<number>;

  // Utility Methods
  clearCurrentConnection: () => void;
  resetError: () => void;
  checkConnectionStatus: (
    userId: string,
    otherUserId: string
  ) => Promise<"pending" | "accepted" | "blocked" | null>;

  // User profile methods
  fetchUserProfiles: (
    userIds: string[]
  ) => Promise<Record<string, UserProfile>>;
  getUserById: (userId: string) => UserProfile | null;

  // Helper method for enhancing connections
  enhanceConnectionsWithUserDetails: (
    connections: RawConnection[]
  ) => Promise<EnhancedUserConnection[]>;
}

export const useUserConnectionStore = create<UserConnectionStore>(
  (set, get) => ({
    connections: [],
    currentConnection: null,
    loading: false,
    error: null,

    // Helper function to fetch user profiles
    fetchUserProfiles: async (userIds: string[]) => {
      if (!userIds.length) return {};

      const supabase = createClient();
      const { data, error } = await supabase
        .from("users")
        .select(
          "id, username, email, bio, profile_picture, reputation, created_at, updated_at"
        )
        .in("id", userIds);

      if (error) {
        console.error("Error fetching user profiles:", error);
        return {};
      }

      // Create a map of user profiles by ID
      const userMap: Record<string, UserProfile> = {};
      data.forEach((user) => {
        userMap[user.id] = user;
      });

      return userMap;
    },

    // Helper to get a user by ID from the current connections
    getUserById: (userId: string) => {
      const { connections } = get();

      // Look for the user in existing connections
      for (const conn of connections) {
        if (conn.user_id === userId && conn.user_details) {
          return conn.user_details;
        }
        if (conn.connected_user_id === userId && conn.connected_user_details) {
          return conn.connected_user_details;
        }
      }

      return null;
    },

    // Helper to enhance connections with user details
    enhanceConnectionsWithUserDetails: async (
      rawConnections: RawConnection[]
    ) => {
      if (!rawConnections.length) return [];

      // Convert raw connections to properly typed connections
      const connections: UserConnection[] = rawConnections.map((conn) => ({
        ...conn,
        // Ensure status is one of the allowed values
        status:
          conn.status === "pending" ||
          conn.status === "accepted" ||
          conn.status === "blocked"
            ? conn.status
            : "pending", // Default to pending if invalid status
      }));

      // Extract all unique user IDs
      const userIds = new Set<string>();
      connections.forEach((conn) => {
        userIds.add(conn.user_id);
        userIds.add(conn.connected_user_id);
      });

      // Fetch user profiles
      const userProfiles = await get().fetchUserProfiles(Array.from(userIds));

      // Enhance connections with user details
      return connections.map((conn) => ({
        ...conn,
        user_details: userProfiles[conn.user_id] || null,
        connected_user_details: userProfiles[conn.connected_user_id] || null,
      }));
    },

    // Create a single connection
    createConnection: async (connection) => {
      set({ loading: true, error: null });
      const supabase = createClient();

      try {
        const { data, error } = await supabase
          .from("user_connections")
          .insert(connection)
          .select()
          .single();

        if (error) throw error;

        // Enhance with user details
        const enhancedConnections =
          await get().enhanceConnectionsWithUserDetails([
            data as RawConnection,
          ]);
        const enhancedConnection = enhancedConnections[0];

        // Update local state
        set({
          connections: [enhancedConnection, ...get().connections],
          currentConnection: enhancedConnection,
          error: null,
        });

        // Create notification for friend request
        const { createNotification } = useNotificationStore.getState();

        // Only create notification if it's a pending request (not for accepted or blocked)
        if (connection.status === "pending") {
          // Get sender's username
          const senderProfile = enhancedConnection.user_details;
          const recipientId = connection.connected_user_id;

          if (senderProfile) {
            await createNotification({
              user_id: recipientId,
              content: `${senderProfile.username} sent you a friend request`,
              is_public: false,
              notification_type: "connection_request",
              related_id: `user:${connection.user_id}`,
            });
          }
        }

        return enhancedConnection;
      } catch (error) {
        const errorMessage = (error as Error).message;
        set({ error: errorMessage });
        return null;
      } finally {
        set({ loading: false });
      }
    },

    // Fetch connections with flexible filtering
    fetchConnections: async (filters = {}) => {
      set({ loading: true, error: null });
      const supabase = createClient();

      try {
        // Start with base query
        let query = supabase.from("user_connections").select("*");

        // Apply filters
        if (filters.user_id) {
          query = query.eq("user_id", filters.user_id);
        }
        if (filters.connected_user_id) {
          query = query.eq("connected_user_id", filters.connected_user_id);
        }
        if (filters.status) {
          query = query.eq("status", filters.status);
        }

        // Add ordering
        query = query.order("created_at", { ascending: false });

        const { data, error } = await query;

        if (error) throw error;

        // Enhance with user details
        const enhancedConnections =
          await get().enhanceConnectionsWithUserDetails(
            (data as RawConnection[]) || []
          );

        set({
          connections: enhancedConnections,
          error: null,
        });
      } catch (error) {
        set({
          error: (error as Error).message,
          connections: [],
        });
      } finally {
        set({ loading: false });
      }
    },

    // Fetch a specific connection by ID
    fetchConnectionById: async (id) => {
      set({ loading: true, error: null });
      const supabase = createClient();

      try {
        const { data, error } = await supabase
          .from("user_connections")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;

        // Enhance with user details
        const enhancedConnections =
          await get().enhanceConnectionsWithUserDetails([
            data as RawConnection,
          ]);
        const enhancedConnection = enhancedConnections[0];

        set({
          currentConnection: enhancedConnection,
          error: null,
        });
      } catch (error) {
        set({
          error: (error as Error).message,
          currentConnection: null,
        });
      } finally {
        set({ loading: false });
      }
    },

    // Fetch all accepted friends for a user
    fetchFriends: async (userId) => {
      set({ loading: true, error: null });
      const supabase = createClient();

      try {
        // Get connections where the user is either the requester or recipient
        const { data, error } = await supabase
          .from("user_connections")
          .select("*")
          .or(`user_id.eq.${userId},connected_user_id.eq.${userId}`)
          .eq("status", "accepted");

        if (error) throw error;

        // Enhance with user details
        const enhancedConnections =
          await get().enhanceConnectionsWithUserDetails(
            (data as RawConnection[]) || []
          );

        set({
          connections: enhancedConnections,
          error: null,
        });
      } catch (error) {
        set({
          error: (error as Error).message,
          connections: [],
        });
      } finally {
        set({ loading: false });
      }
    },

    // Fetch pending friend requests received by the user
    fetchPendingRequests: async (userId) => {
      set({ loading: true, error: null });
      const supabase = createClient();

      try {
        const { data, error } = await supabase
          .from("user_connections")
          .select("*")
          .eq("connected_user_id", userId)
          .eq("status", "pending");

        if (error) throw error;

        // Enhance with user details
        const enhancedConnections =
          await get().enhanceConnectionsWithUserDetails(
            (data as RawConnection[]) || []
          );

        set({
          connections: enhancedConnections,
          error: null,
        });
      } catch (error) {
        set({
          error: (error as Error).message,
          connections: [],
        });
      } finally {
        set({ loading: false });
      }
    },

    // Fetch friend requests sent by the user
    fetchSentRequests: async (userId) => {
      set({ loading: true, error: null });
      const supabase = createClient();

      try {
        const { data, error } = await supabase
          .from("user_connections")
          .select("*")
          .eq("user_id", userId)
          .eq("status", "pending");

        if (error) throw error;

        // Enhance with user details
        const enhancedConnections =
          await get().enhanceConnectionsWithUserDetails(
            (data as RawConnection[]) || []
          );

        set({
          connections: enhancedConnections,
          error: null,
        });
      } catch (error) {
        set({
          error: (error as Error).message,
          connections: [],
        });
      } finally {
        set({ loading: false });
      }
    },

    // Fetch users blocked by the user
    fetchBlockedUsers: async (userId) => {
      set({ loading: true, error: null });
      const supabase = createClient();

      try {
        const { data, error } = await supabase
          .from("user_connections")
          .select("*")
          .eq("user_id", userId)
          .eq("status", "blocked");

        if (error) throw error;

        // Enhance with user details
        const enhancedConnections =
          await get().enhanceConnectionsWithUserDetails(
            (data as RawConnection[]) || []
          );

        set({
          connections: enhancedConnections,
          error: null,
        });
      } catch (error) {
        set({
          error: (error as Error).message,
          connections: [],
        });
      } finally {
        set({ loading: false });
      }
    },

    // Update a connection
    updateConnection: async (id, updates) => {
      set({ loading: true, error: null });
      const supabase = createClient();

      try {
        // Get the current connection data before updating
        const { data: currentConnection } = await supabase
          .from("user_connections")
          .select("*")
          .eq("id", id)
          .single();

        if (!currentConnection) throw new Error("Connection not found");

        // Update the connection
        const { data, error } = await supabase
          .from("user_connections")
          .update(updates)
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;

        // Enhance with user details
        const enhancedConnections =
          await get().enhanceConnectionsWithUserDetails([
            data as RawConnection,
          ]);
        const enhancedConnection = enhancedConnections[0];

        // Update in local state
        set({
          connections: get().connections.map((connection) =>
            connection.id === id ? enhancedConnection : connection
          ),
          currentConnection: enhancedConnection,
          error: null,
        });

        // Create notifications based on the update type
        const { createNotification } = useNotificationStore.getState();

        // Handle status changes
        if (updates.status && updates.status !== currentConnection.status) {
          // Get user details for both users
          const userProfiles = await get().fetchUserProfiles([
            currentConnection.user_id,
            currentConnection.connected_user_id,
          ]);

          const requesterProfile = userProfiles[currentConnection.user_id];
          const recipientProfile =
            userProfiles[currentConnection.connected_user_id];

          if (requesterProfile && recipientProfile) {
            // Friend request accepted
            if (
              updates.status === "accepted" &&
              currentConnection.status === "pending"
            ) {
              // Notify the original requester that their request was accepted
              await createNotification({
                user_id: currentConnection.user_id,
                content: `${recipientProfile.username} accepted your friend request`,
                is_public: true,
                notification_type: "connection_accept",
                related_id: `user:${currentConnection.connected_user_id}`,
              });
            }

            // Friend request blocked
            else if (
              updates.status === "blocked" &&
              currentConnection.status === "pending"
            ) {
              // No notification for blocked requests - privacy concern
            }

            // Friend blocked (from accepted state)
            else if (
              updates.status === "blocked" &&
              currentConnection.status === "accepted"
            ) {
              // No notification for blocks - privacy concern
            }
          }
        }

        return enhancedConnection;
      } catch (error) {
        set({ error: (error as Error).message });
        return null;
      } finally {
        set({ loading: false });
      }
    },

    // Accept a connection request
    acceptConnection: async (id) => {
        set({ loading: true, error: null });
        const supabase = createClient();
      
        try {
          // First, get the connection details to verify authorization
          const { data: connectionData, error: fetchError } = await supabase
            .from("user_connections")
            .select("*")
            .eq("id", id)
            .single();
      
          if (fetchError) throw fetchError;
          if (!connectionData) throw new Error("Connection not found");
      
          // Get the current authenticated user
          const { data: { user }, error: authError } = await supabase.auth.getUser();
          if (authError) throw authError;
          if (!user) throw new Error("Not authenticated");
      
          // Verify that the current user is the recipient of the connection request
          if (connectionData.connected_user_id !== user.id) {
            throw new Error("You are not authorized to accept this connection request");
          }
      
          // Now proceed with the update
          const { data, error } = await supabase
            .from("user_connections")
            .update({ status: 'accepted' })
            .eq("id", id)
            .select()
            .single();
      
          if (error) throw error;
      
          // Enhance with user details
          const enhancedConnections = await get().enhanceConnectionsWithUserDetails([data as RawConnection]);
          const enhancedConnection = enhancedConnections[0];
      
          // Update in local state
          set({
            connections: get().connections.map(connection => 
              connection.id === id ? enhancedConnection : connection
            ),
            currentConnection: enhancedConnection,
            error: null
          });
      
          // Create notification for the original requester
          const { createNotification } = useNotificationStore.getState();
          
          // Get user details for notification
          const userProfiles = await get().fetchUserProfiles([
            connectionData.user_id, 
            connectionData.connected_user_id
          ]);
          
          const requesterProfile = userProfiles[connectionData.user_id];
          const recipientProfile = userProfiles[connectionData.connected_user_id];
          
          if (requesterProfile && recipientProfile) {
            await createNotification({
              user_id: connectionData.user_id,
              content: `${recipientProfile.username} accepted your connection request`,
              is_public: true,
              notification_type: 'connection_accept',
              related_id: `user:${connectionData.connected_user_id}`
            });
          }
      
          return enhancedConnection;
        } catch (error) {
          const errorMessage = (error as Error).message;
          set({ error: errorMessage });
          toast.error(errorMessage);
          return null;
        } finally {
          set({ loading: false });
        }
      },    

    // Block a user
    blockConnection: async (id) => {
      return get().updateConnection(id, { status: "blocked" });
    },

    // Delete a single connection
// Delete a single connection
deleteConnection: async (id) => {
    set({ loading: true, error: null });
    const supabase = createClient();
  
    try {
      // First, get the connection details to verify authorization
      const { data: connectionData, error: fetchError } = await supabase
        .from("user_connections")
        .select("*")
        .eq("id", id)
        .single();
  
      if (fetchError) throw fetchError;
      if (!connectionData) throw new Error("Connection not found");
  
      // Get the current authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error("Not authenticated");
  
      // Verify that the current user is either the sender or recipient of the connection
      if (connectionData.user_id !== user.id && connectionData.connected_user_id !== user.id) {
        throw new Error("You are not authorized to delete this connection");
      }
  
      // Now proceed with the deletion
      const { error } = await supabase
        .from("user_connections")
        .delete()
        .eq("id", id);
  
      if (error) throw error;
  
      // Remove from local state
      set({
        connections: get().connections.filter(connection => connection.id !== id),
        currentConnection: null,
        error: null
      });
  
      // Create notification if it was an accepted friendship that was deleted
      if (connectionData.status === 'accepted') {
        const { createNotification } = useNotificationStore.getState();
        
        // Get user details
        const userProfiles = await get().fetchUserProfiles([
          connectionData.user_id, 
          connectionData.connected_user_id
        ]);
        
        // Notify the other user about the friendship ending
        // Only notify if the current user is the one who initiated the deletion
        const otherUserId = connectionData.user_id === user.id 
          ? connectionData.connected_user_id 
          : connectionData.user_id;
          
        if (userProfiles[user.id] && userProfiles[otherUserId]) {
          await createNotification({
            user_id: otherUserId,
            content: `${userProfiles[user.id].username} removed you from their connections`,
            is_public: false,
            notification_type: 'connection_removed',
            related_id: `user:${user.id}`
          });
        }
      }
  
      return true;
    } catch (error) {
      const errorMessage = (error as Error).message;
      set({ error: errorMessage });
      toast.error(errorMessage);
      return false;
    } finally {
      set({ loading: false });
    }
  },

    // Bulk create connections
    bulkCreateConnections: async (connections) => {
      set({ loading: true, error: null });
      const supabase = createClient();

      try {
        const { data, error } = await supabase
          .from("user_connections")
          .insert(connections)
          .select();

        if (error) throw error;

        // Enhance with user details
        const enhancedConnections =
          await get().enhanceConnectionsWithUserDetails(
            (data as RawConnection[]) || []
          );

        // Update local state
        set({
          connections: [...enhancedConnections, ...get().connections],
          error: null,
        });

        // Create notifications for each pending connection
        const { createNotification } = useNotificationStore.getState();

        // Get all user IDs involved
        const userIds = new Set<string>();
        connections.forEach((conn) => {
          userIds.add(conn.user_id);
          userIds.add(conn.connected_user_id);
        });

        // Fetch all user profiles at once
        const userProfiles = await get().fetchUserProfiles(Array.from(userIds));

        // Create notifications for pending requests
        // Create notifications for pending requests
        for (const conn of connections) {
          if (conn.status === "pending") {
            const senderProfile = userProfiles[conn.user_id];

            if (senderProfile) {
              await createNotification({
                user_id: conn.connected_user_id,
                content: `${senderProfile.username} sent you a friend request`,
                is_public: false,
                notification_type: "connection_request",
                related_id: `user:${conn.user_id}`,
              });
            }
          }
        }

        return enhancedConnections;
      } catch (error) {
        set({ error: (error as Error).message });
        return [];
      } finally {
        set({ loading: false });
      }
    },

    // Bulk delete connections
    bulkDeleteConnections: async (ids) => {
      set({ loading: true, error: null });
      const supabase = createClient();

      try {
        // Get the connections data before deleting
        const { data: connectionsData } = await supabase
          .from("user_connections")
          .select("*")
          .in("id", ids);

        const { count, error } = await supabase
          .from("user_connections")
          .delete()
          .in("id", ids);

        if (error) throw error;

        // Remove from local state
        set({
          connections: get().connections.filter(
            (connection) => !ids.includes(connection.id)
          ),
          error: null,
        });

        // Create notifications for deleted accepted friendships
        if (connectionsData && connectionsData.length > 0) {
          const { createNotification } = useNotificationStore.getState();

          // Get all user IDs involved
          const userIds = new Set<string>();
          connectionsData.forEach((conn) => {
            userIds.add(conn.user_id);
            userIds.add(conn.connected_user_id);
          });

          // Fetch all user profiles at once
          const userProfiles = await get().fetchUserProfiles(
            Array.from(userIds)
          );

          // Create notifications for each deleted accepted connection
          for (const conn of connectionsData) {
            if (conn.status === "accepted") {
              // Notify both users about the friendship ending
              if (
                userProfiles[conn.user_id] &&
                userProfiles[conn.connected_user_id]
              ) {
                await createNotification({
                  user_id: conn.user_id,
                  content: `You are no longer friends with ${
                    userProfiles[conn.connected_user_id].username
                  }`,
                  is_public: false,
                  notification_type: "connection_removed",
                  related_id: `user:${conn.connected_user_id}`,
                });

                await createNotification({
                  user_id: conn.connected_user_id,
                  content: `You are no longer friends with ${
                    userProfiles[conn.user_id].username
                  }`,
                  is_public: false,
                  notification_type: "connection_removed",
                  related_id: `user:${conn.user_id}`,
                });
              }
            }
          }
        }

        return count || 0;
      } catch (error) {
        set({ error: (error as Error).message });
        return 0;
      } finally {
        set({ loading: false });
      }
    },

    // Check connection status between two users
    checkConnectionStatus: async (userId, otherUserId) => {
      set({ loading: true, error: null });
      const supabase = createClient();

      try {
        // Check both directions of the connection
        const { data, error } = await supabase
          .from("user_connections")
          .select("*")
          .or(
            `and(user_id.eq.${userId},connected_user_id.eq.${otherUserId}),` +
              `and(user_id.eq.${otherUserId},connected_user_id.eq.${userId})`
          )
          .single();

        if (error && error.code !== "PGRST116") {
          // PGRST116 is "No rows returned" error
          throw error;
        }

        if (!data) return null;

        // Validate and convert status
        const status = data.status;
        if (
          status === "pending" ||
          status === "accepted" ||
          status === "blocked"
        ) {
          return status;
        }

        // Default to null if invalid status
        return null;
      } catch (error) {
        set({ error: (error as Error).message });
        return null;
      } finally {
        set({ loading: false });
      }
    },

    // Utility method to clear current connection
    clearCurrentConnection: () => {
      set({ currentConnection: null });
    },

    // Utility method to reset error
    resetError: () => {
      set({ error: null });
    },
  })
);
