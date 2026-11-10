import type { Tables } from "@/types/supabase";

// Connection status values stored in user_connections.status (see db.sql).
export type ConnectionStatus = "pending" | "accepted" | "blocked";

// Narrow an arbitrary DB string to a known status. Returns null for unknown values.
export function parseConnectionStatus(value: string): ConnectionStatus | null {
  switch (value) {
    case "pending":
    case "accepted":
    case "blocked":
      return value;
    default:
      return null;
  }
}

// user_connections row with status narrowed to the known union.
export type ConnectionRow = Omit<Tables<"user_connections">, "status"> & {
  status: ConnectionStatus;
};

// Public-facing user fields used when rendering connections.
export type UserSummary = Pick<
  Tables<"users">,
  "id" | "username" | "email" | "bio" | "profile_picture" | "reputation" | "created_at" | "updated_at"
>;

export type EnrichedConnection = ConnectionRow & {
  user_details: UserSummary | null;
  connected_user_details: UserSummary | null;
};

// The viewer's connection with a target user, as computed on the server.
// `outgoing` is true when the viewer is the requester (user_id).
export type ViewerConnection = {
  id: number;
  status: ConnectionStatus;
  outgoing: boolean;
};

// Map a raw row to a typed row. Unknown status values fall back to "pending",
// matching the behaviour of the previous client-side normalisation.
export function normalizeConnectionRow(row: Tables<"user_connections">): ConnectionRow {
  return {
    ...row,
    status: parseConnectionStatus(row.status) ?? "pending",
  };
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return String(error);
}
