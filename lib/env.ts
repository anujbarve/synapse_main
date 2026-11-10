// Server-side env access. Throws with the variable name when it is missing.
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Client-safe env access. Next.js only inlines NEXT_PUBLIC_* values when they
// are read as literal property accesses, so each one is listed here by name.
// Import this in client components and browser-side helpers.
export const publicEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_LIVEKIT_URL: process.env.NEXT_PUBLIC_LIVEKIT_URL,
} as const;

export type PublicEnvName = keyof typeof publicEnv;

// Returns the value or throws, naming the variable.
export function requirePublicEnv(name: PublicEnvName): string {
  const value = publicEnv[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
