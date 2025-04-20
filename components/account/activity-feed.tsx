// components/social/activity-feed.tsx
"use client";

import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, ThumbsUp, UserPlus, Heart, Bell, Globe, Users, RefreshCw } from "lucide-react";
import { NotificationType, useNotificationStore,Notification } from "@/stores/notification_store";
import { useUserStore } from "@/stores/user_store";

// Map notification types to activity icons
const getActivityIcon = (type: NotificationType | null) => {
  switch (type) {
    case 'connection_request':
    case 'connection_accept':
    case 'connection_removed':
      return <UserPlus className="h-4 w-4 text-blue-500" />;
    
    case 'post_upvote':
      return <ThumbsUp className="h-4 w-4 text-red-500" />;
    
    case 'comment_upvote':
      return <Heart className="h-4 w-4 text-pink-500" />;
    
    case 'post_comment':
    case 'comment_reply':
      return <MessageSquare className="h-4 w-4 text-green-500" />;
    
    case 'community_created':
    case 'community_joined':
    case 'community_member_joined':
    case 'community_member_left':
    case 'community_left':
      return <Users className="h-4 w-4 text-indigo-500" />;
    
    case 'channel_created':
    case 'channel_updated':
    case 'channel_deleted':
      return <MessageSquare className="h-4 w-4 text-cyan-500" />;
    
    case 'post_updated':
    case 'community_updated':
      return <RefreshCw className="h-4 w-4 text-amber-500" />;
    
    case 'system':
    case 'custom':
    default:
      return <Bell className="h-4 w-4 text-gray-500" />;
  }
};

// Extract entity IDs from related_id field
const extractIds = (relatedId: string | null) => {
  if (!relatedId) return { postId: null, commentId: null, userId: null, communityId: null, channelId: null };
  
  const ids: { 
    postId: string | null, 
    commentId: string | null, 
    userId: string | null, 
    communityId: string | null,
    channelId: string | null
  } = {
    postId: null,
    commentId: null,
    userId: null,
    communityId: null,
    channelId: null
  };
  
  const parts = relatedId.split('|');
  
  parts.forEach(part => {
    if (part.startsWith('post:')) {
      ids.postId = part.replace('post:', '');
    } else if (part.startsWith('comment:')) {
      ids.commentId = part.replace('comment:', '');
    } else if (part.startsWith('user:')) {
      ids.userId = part.replace('user:', '');
    } else if (part.startsWith('community:')) {
      ids.communityId = part.replace('community:', '');
    } else if (part.startsWith('channel:')) {
      ids.channelId = part.replace('channel:', '');
    }
  });
  
  return ids;
};

export function ActivityFeed() {
  const { user } = useUserStore();
  const { publicNotifications, loading, error, fetchPublicNotifications } = useNotificationStore();
  
  useEffect(() => {
    if (user?.id) {
      fetchPublicNotifications(user.id, 10); // Fetch 10 most recent public activities
    }
  }, [user?.id, fetchPublicNotifications]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffDay > 0) {
      return `${diffDay}d ago`;
    } else if (diffHour > 0) {
      return `${diffHour}h ago`;
    } else if (diffMin > 0) {
      return `${diffMin}m ago`;
    } else {
      return 'Just now';
    }
  };

  // Parse notification content to create activity text with links
  const parseActivityLinks = (notification: Notification) => {
    let content = notification.content;
    
    // Extract IDs from related_id
    const { postId, communityId, channelId } = extractIds(notification.related_id);
    
    // Replace usernames with links
    // This regex looks for usernames that appear before certain phrases
    content = content.replace(
      /(\w+)(?= sent you a| accepted your| liked your| commented on your| joined your community| created a new community| promoted to| banned| muted)/g, 
      (match: string) => {
        return `<a href="/profile/${match}" class="font-medium hover:underline">${match}</a>`;
      }
    );
    
    // Replace post titles with links
    if (postId) {
      content = content.replace(/"([^"]+)"(?= in | on )/, (match: string, title: string) => {
        return `"<a href="/post/${postId}" class="font-medium hover:underline">${title}</a>"`;
      });
    }
    
    // Replace community names with links
    if (communityId) {
      content = content.replace(/(?:in|from|to) ([^"]+)(?=$| by)/, (match: string, communityName: string) => {
        return match.replace(communityName, `<a href="/community/${communityId}" class="font-medium hover:underline">${communityName}</a>`);
      });
    }
    
    // Replace channel names with links
    if (channelId) {
      content = content.replace(/#(\w+)/, (match: string, channelName: string) => {
        return `<a href="/channel/${channelId}" class="font-medium hover:underline">#${channelName}</a>`;
      });
    }
    
    return content;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-sm text-red-500 py-4">
            Error loading activities: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {publicNotifications.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-4">
            No recent activity
          </div>
        ) : (
          publicNotifications.map(notification => (
            <div key={notification.id} className="flex gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                {getActivityIcon(notification.notification_type)}
              </div>
              <div className="space-y-1">
                <p className="text-sm" dangerouslySetInnerHTML={{ __html: parseActivityLinks(notification) }} />
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">{formatTimeAgo(notification.created_at)}</p>
                  <Globe className="h-3 w-3 text-muted-foreground" />
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}