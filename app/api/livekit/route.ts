import { AccessToken } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { publicEnv } from "@/lib/env";

export async function GET(req: NextRequest) {
  // Only signed-in users may obtain a LiveKit join token.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // The room is a channel id (see components/app-sidebar.tsx: /community/:id/room/:channelId).
  const room = req.nextUrl.searchParams.get("room");
  const communityParam = req.nextUrl.searchParams.get("communityId");
  if (!room) {
    return NextResponse.json(
      { error: 'Missing "room" query parameter' },
      { status: 400 }
    );
  }
  if (!/^\d+$/.test(room)) {
    return NextResponse.json({ error: "Invalid room" }, { status: 403 });
  }

  // The room must be a channel of a community the caller is a member of.
  const { data: channel } = await supabase
    .from("channels")
    .select("community_id")
    .eq("id", Number(room))
    .maybeSingle();
  if (!channel) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (communityParam && communityParam !== String(channel.community_id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: membership } = await supabase
    .from("community_members")
    .select("user_id")
    .eq("community_id", channel.community_id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Display name comes from the users table, never from the query string.
  const { data: profile } = await supabase
    .from("users")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl = publicEnv.NEXT_PUBLIC_LIVEKIT_URL;

  if (!apiKey || !apiSecret || !wsUrl) {
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 500 }
    );
  }

  // Identity is the Supabase user id (unforgeable); name is the display name.
  const at = new AccessToken(apiKey, apiSecret, {
    identity: user.id,
    name: profile?.username || undefined,
  });
  at.addGrant({
    room,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    // Left unchanged: any member can join a room; roomRecord lets them request
    // server-side recording of that room.
    roomRecord: true,
  });

  return NextResponse.json({ token: await at.toJwt() });
}
