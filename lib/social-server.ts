import type { Tables } from "@/types/supabase";
import { createClient } from "@/utils/supabase/server";
import {
  EnrichedConnection,
  UserSummary,
  ViewerConnection,
  normalizeConnectionRow,
  parseConnectionStatus,
} from "@/lib/social";

// Server-side loaders for the social pages. These run with the cookie-based
// Supabase client, so RLS applies to the logged-in viewer.

export type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Route params are interpolated into PostgREST `.or()` filters, so only UUIDs are queried.
export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

// Attach user profiles to connection rows (one query for all users involved).
async function attachUsers(
  supabase: ServerSupabase,
  rows: Tables<"user_connections">[]
): Promise<EnrichedConnection[]> {
  const normalized = rows.map(normalizeConnectionRow);
  const userIds = [...new Set(normalized.flatMap((c) => [c.user_id, c.connected_user_id]))];

  const profiles = new Map<string, UserSummary>();
  if (userIds.length > 0) {
    const { data, error } = await supabase
      .from("users")
      .select("id, username, email, bio, profile_picture, reputation, created_at, updated_at")
      .in("id", userIds);
    if (error) throw error;
    for (const profile of data) {
      profiles.set(profile.id, profile);
    }
  }

  return normalized.map((conn) => ({
    ...conn,
    user_details: profiles.get(conn.user_id) ?? null,
    connected_user_details: profiles.get(conn.connected_user_id) ?? null,
  }));
}

export async function fetchFriends(supabase: ServerSupabase, userId: string): Promise<EnrichedConnection[]> {
  const { data, error } = await supabase
    .from("user_connections")
    .select("*")
    .or(`user_id.eq.${userId},connected_user_id.eq.${userId}`)
    .eq("status", "accepted");
  if (error) throw error;
  return attachUsers(supabase, data);
}

export async function countFriends(supabase: ServerSupabase, userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("user_connections")
    .select("*", { count: "exact", head: true })
    .or(`user_id.eq.${userId},connected_user_id.eq.${userId}`)
    .eq("status", "accepted");
  if (error) throw error;
  return count ?? 0;
}

// Pending requests received by the user.
export async function fetchReceivedPending(supabase: ServerSupabase, userId: string): Promise<EnrichedConnection[]> {
  const { data, error } = await supabase
    .from("user_connections")
    .select("*")
    .eq("connected_user_id", userId)
    .eq("status", "pending");
  if (error) throw error;
  return attachUsers(supabase, data);
}

export async function countReceivedPending(supabase: ServerSupabase, userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("user_connections")
    .select("*", { count: "exact", head: true })
    .eq("connected_user_id", userId)
    .eq("status", "pending");
  if (error) throw error;
  return count ?? 0;
}

// Pending requests sent by the user.
export async function fetchSentPending(supabase: ServerSupabase, userId: string): Promise<EnrichedConnection[]> {
  const { data, error } = await supabase
    .from("user_connections")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "pending");
  if (error) throw error;
  return attachUsers(supabase, data);
}

// Users blocked by the user.
export async function fetchBlocked(supabase: ServerSupabase, userId: string): Promise<EnrichedConnection[]> {
  const { data, error } = await supabase
    .from("user_connections")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "blocked");
  if (error) throw error;
  return attachUsers(supabase, data);
}

// The viewer's connection with a target user, in either direction.
export async function fetchViewerConnection(
  supabase: ServerSupabase,
  viewerId: string,
  targetId: string
): Promise<ViewerConnection | null> {
  const { data, error } = await supabase
    .from("user_connections")
    .select("*")
    .or(
      `and(user_id.eq.${viewerId},connected_user_id.eq.${targetId}),` +
        `and(user_id.eq.${targetId},connected_user_id.eq.${viewerId})`
    )
    .limit(1);
  if (error) throw error;

  const row = data[0];
  if (!row) return null;
  const status = parseConnectionStatus(row.status);
  if (!status) return null;
  return { id: row.id, status, outgoing: row.user_id === viewerId };
}

export type ProfileData = Tables<"users"> & {
  post_count: number;
  comment_count: number;
};

export async function fetchProfile(supabase: ServerSupabase, userId: string): Promise<ProfileData | null> {
  if (!isUuid(userId)) return null;

  const { data: user, error } = await supabase.from("users").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  if (!user) return null;

  const [posts, comments] = await Promise.all([
    supabase.from("posts").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("comments").select("*", { count: "exact", head: true }).eq("user_id", user.id),
  ]);
  if (posts.error) throw posts.error;
  if (comments.error) throw comments.error;

  return {
    ...user,
    post_count: posts.count ?? 0,
    comment_count: comments.count ?? 0,
  };
}
