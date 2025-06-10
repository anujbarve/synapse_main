"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip } from "@/components/ui/tooltip";
import { MessageSquare, ThumbsUp, UserPlus, Heart, Bell, Globe, Users, RefreshCw } from "lucide-react";
import { NotificationType, useNotificationStore, Notification } from "@/stores/notification_store";
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
      // Handle the full user ID format
      ids.userId = part.replace('user:', '');
    } else if (part.startsWith('community:')) {
      ids.communityId = part.replace('community:', '');
    } else if (part.startsWith('channel:')) {
      ids.channelId = part.replace('channel:', '');
    }
  });

  // If the entire relatedId matches a user ID pattern without prefix, treat it as userId
  if (relatedId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)) {
    ids.userId = relatedId;
  }
  
  return ids;
};

interface NotificationContentProps {
  notification: Notification;
}

const NotificationContent: React.FC<NotificationContentProps> = ({ notification }) => {
  const { postId, commentId, userId } = extractIds(notification.related_id);

  const getNotificationContext = () => {
    switch (notification.notification_type) {
      case 'post_comment':
        return (
          <div className="space-y-2">
            <div className="text-sm">
              <span dangerouslySetInnerHTML={{ __html: parseActivityLinks(notification) }} />
            </div>
            {postId && commentId && (
              <Link 
                href={`/post/${postId}#comment-${commentId}`}
                className="text-xs text-muted-foreground hover:text-primary block mt-1"
              >
                View comment
              </Link>
            )}
          </div>
        );

      case 'comment_upvote':
        return (
          <div className="space-y-2">
            <div className="text-sm">
              <span dangerouslySetInnerHTML={{ __html: parseActivityLinks(notification) }} />
            </div>
            {postId && commentId && (
              <Link 
                href={`/post/${postId}#comment-${commentId}`}
                className="text-xs text-muted-foreground hover:text-primary block mt-1"
              >
                View upvoted comment
              </Link>
            )}
          </div>
        );

      case 'connection_request':
      case 'connection_accept':
        return (
          <div className="space-y-2">
            <div className="text-sm">
              <span dangerouslySetInnerHTML={{ __html: parseActivityLinks(notification) }} />
            </div>
            {userId && (
              <Link 
                href={`/account/${userId}`}
                className="text-xs text-muted-foreground hover:text-primary block mt-1"
              >
                View profile
              </Link>
            )}
          </div>
        );

      case 'comment_reply':
        return (
          <div className="space-y-2">
            <div className="text-sm">
              <span dangerouslySetInnerHTML={{ __html: parseActivityLinks(notification) }} />
            </div>
            {postId && commentId && (
              <Link 
                href={`/post/${postId}#comment-${commentId}`}
                className="text-xs text-muted-foreground hover:text-primary block mt-1"
              >
                View reply
              </Link>
            )}
          </div>
        );

      default:
        return (
          <div className="text-sm">
            <span dangerouslySetInnerHTML={{ __html: parseActivityLinks(notification) }} />
          </div>
        );
    }
  };

  return (
    <div className="flex items-start gap-3 p-4 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
        {getActivityIcon(notification.notification_type)}
      </div>
      <div className="flex-1">
        {getNotificationContext()}
        <div className="flex items-center gap-2 mt-2">
          <time className="text-xs text-muted-foreground">
            {formatTimeAgo(notification.created_at)}
          </time>
          {notification.is_public && (
            <Tooltip>
              <Globe className="h-3 w-3 text-muted-foreground" />
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function to format time ago
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
  const { postId, communityId, channelId, userId } = extractIds(notification.related_id);
  
  // Helper function to extract username and ID from content
  const extractUserInfo = (content: string) => {
    const matches = content.match(/^(\w+)(?= (?:sent you a|accepted your|liked your|commented on your|joined your|created a new|promoted to|banned|muted))/);
    if (matches) {
      return {
        username: matches[1],
        restOfContent: content.slice(matches[1].length)
      };
    }
    return null;
  };

  // Handle user links based on notification type
  if (notification.notification_type === 'post_comment' || 
      notification.notification_type === 'comment_reply' || 
      notification.notification_type === 'comment_upvote' ||
      notification.notification_type === 'post_upvote') {
    const userInfo = extractUserInfo(content);
    if (userInfo && userId) {
      content = `<a href="/account/${userId}" class="font-medium hover:underline">${userInfo.username}</a>${userInfo.restOfContent}`;
    }
  } else {
    // For other notification types, use the existing username-based replacement
    content = content.replace(
      /(\w+)(?= sent you a| accepted your| liked your| commented on your| joined your community| created a new community| promoted to| banned| muted)/g, 
      (match: string) => {
        const linkTarget = userId || match;
        return `<a href="/account/${linkTarget}" class="font-medium hover:underline">${match}</a>`;
      }
    );
  }
  
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
    content = content.replace(/#(\w+)/, (channelName: string) => {
      return `<a href="/channel/${channelId}" class="font-medium hover:underline">#${channelName}</a>`;
    });
  }
  
  return content;
};

export function ActivityFeed() {
  const { user } = useUserStore();
  const { notifications, loading, error, fetchNotifications } = useNotificationStore();
  
  useEffect(() => {
    if (user?.id) {
      fetchNotifications(user.id, 10);
    }
  }, [user?.id, fetchNotifications]);

  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    return notifications.reduce((groups, notification) => {
      const date = new Date(notification.created_at).toLocaleDateString();
      if (!groups[date]) groups[date] = [];
      groups[date].push(notification);
      return groups;
    }, {} as Record<string, Notification[]>);
  }, [notifications]);

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
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-4">
            No recent activity
          </div>
        ) : (
          Object.entries(groupedNotifications).map(([date, notifications]) => (
            <div key={date} className="mb-6 last:mb-0">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">{date}</h3>
              <div className="space-y-1">
                {notifications.map(notification => (
                  <NotificationContent 
                    key={notification.id} 
                    notification={notification} 
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}