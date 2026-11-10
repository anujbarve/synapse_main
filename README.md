# Synapse

Collaborative learning platform: study groups, communities, channels, posts, real-time chat and video rooms.

Built with Next.js 15 (App Router), React 19, Supabase (auth, Postgres, Storage) and LiveKit (video).

## Requirements

- Node.js 20 or 22 (LTS)
- pnpm
- A Supabase project and a LiveKit project

## Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Create `.env.local` from the template and fill in your keys:

   ```bash
   cp .env.example .env.local
   ```

   Variables are documented in [`.env.example`](.env.example). `NEXT_PUBLIC_*` values are inlined at build time, so rebuild after changing them. Keys without that prefix are server-only and must never be exposed to the browser.

3. Create the database in your Supabase project by running [`db.sql`](db.sql) once in the SQL editor on an **empty** `public` schema. It creates all tables, trigger functions, row level security policies, the `create_notification` function, and the storage buckets (`media`, `profile-pictures`, `community`) with their policies. Do not run it twice.

4. Upload paths the app writes to: `media/posts/<uid>/...`, `media/messages/<uid>/...`, `profile-pictures/<uid>/...`, `community/<uid>/banners/...`. The policies in `db.sql` only allow writes under the signed-in user's own folder.

5. Add your app URL (for local development, `http://localhost:3000`) to the redirect URLs in Supabase Auth.

6. Start the dev server:

   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Dev server with Turbopack |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build (port 3000) |
| `pnpm lint` | ESLint via `next lint` |

## Deployment

The app runs as a standard Next.js server (`pnpm build && pnpm start`). On Coolify or any similar platform:

- Set all variables from `.env.example`. Mark the `NEXT_PUBLIC_*` variables as build-time.
- Pin the Node version to 20 or 22.
- Add the deployed URL to Supabase Auth redirect URLs.
- Make sure Row Level Security is enabled and policies are set on every table in Supabase.

## Migrating ImageKit media

Older uploads point at ImageKit (`ik.imagekit.io`). New uploads go to the public Supabase Storage bucket `media`. `scripts/migrate-imagekit-media.mjs` copies the existing files into `media` and rewrites the URLs in the database.

Columns handled: `users.profile_picture`, `community.banner_picture`, `messages.file_url` (nullable), `resources.file_url`, and `posts.content` for `Image` and `Video` posts only. Objects are stored at `migrated/<table>/<row-id>/<sanitized-filename>`.

Run a dry run first. It prints counts per column and writes nothing:

```bash
SUPABASE_SERVICE_ROLE_KEY=... NEXT_PUBLIC_SUPABASE_URL=... node scripts/migrate-imagekit-media.mjs
```

Then apply:

```bash
SUPABASE_SERVICE_ROLE_KEY=... NEXT_PUBLIC_SUPABASE_URL=... node scripts/migrate-imagekit-media.mjs --apply
```

- The service role key is read from the environment only. Do not commit it or put it in `.env.example`.
- Set `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT` if your ImageKit endpoint uses a different host. That host is matched in addition to `ik.imagekit.io`.
- The source files must be publicly fetchable. Sources that return 401 or 403 are logged as failed and not retried.
- Each processed row is appended to `scripts/.migration-log.jsonl` with the original URL, the new URL, and the status. This file is git-ignored because it holds the original URLs.
- Re-running is safe. Rows already on the Supabase prefix are skipped, so only rows that still hold an ImageKit URL are processed. Failed rows are retried. Transient network errors are retried up to 3 times.
- ImageKit is never modified or deleted. Old files stay in place until you remove them yourself.

## Project layout

- `app/` routes (`(auth)`, `(protected)`, `api/`, `auth/`)
- `components/` UI, grouped by feature; `components/ui/` holds shadcn primitives
- `stores/` Zustand state stores
- `utils/supabase/` Supabase clients for browser, server and middleware
- `lib/env.ts` server-side env helper
- `types/` generated Supabase types and app types
- `middleware.ts` session refresh and login redirect
