// stores/useNotificationStore.ts
"use client";

import { create } from "zustand";
import { createClient } from "@/utils/supabase/client";

// Notification types
export type NotificationType =
  | "connection_request"
  | "connection_accept"
  | "connection_removed"
  | "channel_created"
  | "channel_deleted"
  | "channel_updated"
  | "post_upvote"
  | "post_downvote"
  | "post_comment"
  | "post_deleted"
  | "post_updated"
  | "new_post"
  | "comment_upvote"
  | "comment_downvote"
  | "comment_reply"
  | "system"
  | "custom"
  | "community_created"
  | "community_updated"
  | "community_deleted"
  | "community_joined"
  | "community_left"
  | "community_member_joined"
  | "community_member_left";

// Notification interface matching the database schema
export interface Notification {
  id: number;
  user_id: string;
  content: string;
  is_read: boolean;
  is_public: boolean;
  notification_type: NotificationType | null;
  related_id: string | null;
  created_at: string;
}

// Interface for creating a new notification
export interface CreateNotificationParams {
  user_id: string;
  content: string;
  is_public?: boolean;
  notification_type?: NotificationType;
  related_id?: string;
}

interface NotificationState {
  notifications: Notification[];
  publicNotifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;

  // Fetch notifications for a user
  fetchNotifications: (userId: string, limit?: number) => Promise<void>;

  // Fetch only unread notifications
  fetchUnreadNotifications: (userId: string) => Promise<void>;

  // Fetch public notifications (e.g., for a profile page)
  fetchPublicNotifications: (userId: string, limit?: number) => Promise<void>;

  // Fetch notifications by type
  fetchNotificationsByType: (
    userId: string,
    type: NotificationType
  ) => Promise<void>;

  // Get the count of unread notifications
  getUnreadCount: (userId: string) => Promise<number>;

  // Mark specific notifications as read
  markAsRead: (notificationIds: number[]) => Promise<void>;

  // Mark all notifications as read for a user
  markAllAsRead: (userId: string) => Promise<void>;

  // Create a new notification
  createNotification: (
    params: CreateNotificationParams
  ) => Promise<Notification | null>;

  // Delete a notification
  deleteNotification: (id: number) => Promise<boolean>;

  // Delete all notifications for a user
  deleteAllNotifications: (userId: string) => Promise<boolean>;

  // Toggle public/private status
  togglePublicStatus: (id: number, isPublic: boolean) => Promise<boolean>;

  // Clear error state
  clearError: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  publicNotifications: [],
  unreadCount: 0,
  loading: false,
  error: null,

  fetchNotifications: async (userId, limit = 20) => {
    set({ loading: true, error: null });
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      set({
        notifications: data as Notification[],
        loading: false,
        error: null,
      });

      // Update unread count
      const unreadCount = (data as Notification[]).filter(
        (n) => !n.is_read
      ).length;
      set({ unreadCount });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      set({
        error: (error as Error).message,
        loading: false,
      });
    }
  },

  fetchUnreadNotifications: async (userId) => {
    set({ loading: true, error: null });
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .eq("is_read", false)
        .order("created_at", { ascending: false });

      if (error) throw error;

      set({
        notifications: data as Notification[],
        unreadCount: data.length,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error("Error fetching unread notifications:", error);
      set({
        error: (error as Error).message,
        loading: false,
      });
    }
  },

  fetchPublicNotifications: async (userId, limit = 20) => {
    set({ loading: true, error: null });
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      set({
        publicNotifications: data as Notification[],
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error("Error fetching public notifications:", error);
      set({
        error: (error as Error).message,
        loading: false,
      });
    }
  },

  fetchNotificationsByType: async (userId, type) => {
    set({ loading: true, error: null });
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .eq("notification_type", type)
        .order("created_at", { ascending: false });

      if (error) throw error;

      set({
        notifications: data as Notification[],
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error(`Error fetching ${type} notifications:`, error);
      set({
        error: (error as Error).message,
        loading: false,
      });
    }
  },

  getUnreadCount: async (userId) => {
    const supabase = createClient();

    try {
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_read", false);

      if (error) throw error;

      const unreadCount = count || 0;
      set({ unreadCount });
      return unreadCount;
    } catch (error) {
      console.error("Error getting unread count:", error);
      return 0;
    }
  },

  markAsRead: async (notificationIds) => {
    if (!notificationIds.length) return;

    set({ loading: true, error: null });
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .in("id", notificationIds);

      if (error) throw error;

      // Update local state
      set((state) => ({
        notifications: state.notifications.map((notification) =>
          notificationIds.includes(notification.id)
            ? { ...notification, is_read: true }
            : notification
        ),
        publicNotifications: state.publicNotifications.map((notification) =>
          notificationIds.includes(notification.id)
            ? { ...notification, is_read: true }
            : notification
        ),
        loading: false,
        error: null,
      }));

      // Recalculate unread count
      const { notifications } = get();
      const unreadCount = notifications.filter((n) => !n.is_read).length;
      set({ unreadCount });
    } catch (error) {
      console.error("Error marking notifications as read:", error);
      set({
        error: (error as Error).message,
        loading: false,
      });
    }
  },

  markAllAsRead: async (userId) => {
    set({ loading: true, error: null });
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false);

      if (error) throw error;

      // Update local state
      set((state) => ({
        notifications: state.notifications.map((notification) => ({
          ...notification,
          is_read: true,
        })),
        publicNotifications: state.publicNotifications.map((notification) => ({
          ...notification,
          is_read: true,
        })),
        unreadCount: 0,
        loading: false,
        error: null,
      }));
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      set({
        error: (error as Error).message,
        loading: false,
      });
    }
  },

  createNotification: async (params) => {
    set({ loading: true, error: null });
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from("notifications")
        .insert({
          user_id: params.user_id,
          content: params.content,
          is_read: false,
          is_public: params.is_public || false,
          notification_type: params.notification_type || null,
          related_id: params.related_id || null,
        })
        .select()
        .single();

      if (error) throw error;

      const newNotification = data as Notification;

      // Update local state
      set((state) => {
        // Add to notifications array
        const updatedNotifications = [newNotification, ...state.notifications];

        // If public, also add to publicNotifications array
        let updatedPublicNotifications = state.publicNotifications;
        if (newNotification.is_public) {
          updatedPublicNotifications = [
            newNotification,
            ...state.publicNotifications,
          ];
        }

        return {
          notifications: updatedNotifications,
          publicNotifications: updatedPublicNotifications,
          unreadCount: state.unreadCount + 1,
          loading: false,
          error: null,
        };
      });

      return newNotification;
    } catch (error) {
      console.error("Error creating notification:", error);
      set({
        error: (error as Error).message,
        loading: false,
      });
      return null;
    }
  },

  deleteNotification: async (id) => {
    set({ loading: true, error: null });
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Update local state
      set((state) => {
        const deletedNotification = state.notifications.find(
          (n) => n.id === id
        );
        const wasUnread = deletedNotification && !deletedNotification.is_read;
        const wasPublic = deletedNotification && deletedNotification.is_public;

        return {
          notifications: state.notifications.filter((n) => n.id !== id),
          publicNotifications: wasPublic
            ? state.publicNotifications.filter((n) => n.id !== id)
            : state.publicNotifications,
          unreadCount: wasUnread ? state.unreadCount - 1 : state.unreadCount,
          loading: false,
          error: null,
        };
      });

      return true;
    } catch (error) {
      console.error("Error deleting notification:", error);
      set({
        error: (error as Error).message,
        loading: false,
      });
      return false;
    }
  },

  deleteAllNotifications: async (userId) => {
    set({ loading: true, error: null });
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", userId);

      if (error) throw error;

      // Update local state
      set({
        notifications: [],
        publicNotifications: [],
        unreadCount: 0,
        loading: false,
        error: null,
      });

      return true;
    } catch (error) {
      console.error("Error deleting all notifications:", error);
      set({
        error: (error as Error).message,
        loading: false,
      });
      return false;
    }
  },

  togglePublicStatus: async (id, isPublic) => {
    set({ loading: true, error: null });
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_public: isPublic })
        .eq("id", id);

      if (error) throw error;

      // Update local state
      set((state) => {
        const updatedNotifications = state.notifications.map((notification) =>
          notification.id === id
            ? { ...notification, is_public: isPublic }
            : notification
        );

        let updatedPublicNotifications = state.publicNotifications;
        if (isPublic) {
          // Add to public notifications if not already there
          const notification = state.notifications.find((n) => n.id === id);
          if (
            notification &&
            !state.publicNotifications.some((n) => n.id === id)
          ) {
            updatedPublicNotifications = [
              ...state.publicNotifications,
              { ...notification, is_public: true },
            ];
          }
        } else {
          // Remove from public notifications
          updatedPublicNotifications = state.publicNotifications.filter(
            (n) => n.id !== id
          );
        }

        return {
          notifications: updatedNotifications,
          publicNotifications: updatedPublicNotifications,
          loading: false,
          error: null,
        };
      });

      return true;
    } catch (error) {
      console.error("Error toggling public status:", error);
      set({
        error: (error as Error).message,
        loading: false,
      });
      return false;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
