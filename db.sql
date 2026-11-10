-- Synapse database setup: schema, trigger functions, helpers, RLS and storage.
-- Run once in the Supabase SQL Editor on an empty database.

-- =========================================================================
-- 1. Trigger functions (must exist before the tables that use them)
-- =========================================================================

create or replace function public.update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Creates the default channels when a community is created.
create or replace function public.auto_create_default_channels()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.channels (community_id, name, description, type) values
    (new.id, 'general', 'General discussion', 'Text'),
    (new.id, 'voice', 'Voice chat', 'Voice');
  return new;
end;
$$;

-- Keeps posts.upvotes / posts.downvotes in sync with post_votes.
create or replace function public.update_post_vote_counts()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if new.vote_type = 'upvote' then
      update public.posts set upvotes = upvotes + 1 where id = new.post_id;
    else
      update public.posts set downvotes = downvotes + 1 where id = new.post_id;
    end if;
    return new;
  elsif tg_op = 'DELETE' then
    if old.vote_type = 'upvote' then
      update public.posts set upvotes = greatest(upvotes - 1, 0) where id = old.post_id;
    else
      update public.posts set downvotes = greatest(downvotes - 1, 0) where id = old.post_id;
    end if;
    return old;
  end if;
  return null;
end;
$$;

-- Applies reputation_history entries to users.reputation.
create or replace function public.update_user_reputation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.users
     set reputation = coalesce(reputation, 0) + new.change_value
   where id = new.user_id;
  return new;
end;
$$;

-- =========================================================================
-- 2. Tables (reordered so every foreign key target exists first)
-- =========================================================================

create table public.users (
  id uuid not null default auth.uid (),
  username character varying(50) not null,
  email character varying(255) not null,
  bio text null,
  profile_picture character varying(255) null,
  reputation integer null default 0,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint users_pkey primary key (id),
  constraint users_email_key unique (email),
  constraint users_username_key unique (username)
) TABLESPACE pg_default;

create index IF not exists idx_users_email on public.users using btree (email) TABLESPACE pg_default;

create trigger set_updated_at BEFORE
update on users for EACH row
execute FUNCTION update_updated_at_column ();

create table public.community (
  id serial not null,
  name character varying(100) not null,
  description text null,
  created_by uuid not null,
  is_private boolean null default false,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  banner_picture character varying null,
  constraint rooms_pkey primary key (id),
  constraint rooms_name_key unique (name),
  constraint rooms_created_by_fkey foreign KEY (created_by) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create trigger set_updated_at BEFORE
update on community for EACH row
execute FUNCTION update_updated_at_column ();

create trigger create_default_channels
after INSERT on community for EACH row
execute FUNCTION auto_create_default_channels ();

create table public.channels (
  id serial not null,
  community_id integer not null,
  name character varying(100) not null,
  description text null,
  type character varying(20) not null,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint channels_pkey primary key (id),
  constraint channels_community_id_fkey foreign KEY (community_id) references community (id) on delete CASCADE,
  constraint channels_type_check check (
    (
      (type)::text = any (
        array[
          ('Text'::character varying)::text,
          ('Voice'::character varying)::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_channels_community_id on public.channels using btree (community_id) TABLESPACE pg_default;

create trigger set_updated_at BEFORE
update on channels for EACH row
execute FUNCTION update_updated_at_column ();

create table public.community_members (
  id serial not null,
  community_id integer not null,
  user_id uuid not null,
  role character varying(50) null default '''member''::character varying'::character varying,
  joined_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint room_members_pkey primary key (id),
  constraint room_members_room_id_fkey foreign KEY (community_id) references community (id) on delete CASCADE,
  constraint room_members_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.posts (
  id serial not null,
  community_id integer not null,
  user_id uuid not null,
  title character varying(255) not null,
  content text not null,
  type character varying(20) not null,
  upvotes integer not null default 0,
  downvotes integer not null default 0,
  created_at timestamp with time zone not null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone not null default CURRENT_TIMESTAMP,
  description text null,
  constraint posts_pkey primary key (id),
  constraint posts_community_id_fkey foreign KEY (community_id) references community (id) on delete CASCADE,
  constraint posts_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint posts_type_check check (
    (
      (type)::text = any (
        (
          array[
            'Text'::character varying,
            'Link'::character varying,
            'Image'::character varying,
            'Video'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_posts_room_id on public.posts using btree (community_id) TABLESPACE pg_default;

create trigger set_updated_at BEFORE
update on posts for EACH row
execute FUNCTION update_updated_at_column ();

create table public.comments (
  id serial not null,
  post_id integer not null,
  user_id uuid not null,
  parent_id integer null,
  content text not null,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint comments_pkey primary key (id),
  constraint comments_parent_id_fkey foreign KEY (parent_id) references comments (id) on delete CASCADE,
  constraint comments_post_id_fkey foreign KEY (post_id) references posts (id) on delete CASCADE,
  constraint comments_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_comments_post_id on public.comments using btree (post_id) TABLESPACE pg_default;

create trigger set_updated_at BEFORE
update on comments for EACH row
execute FUNCTION update_updated_at_column ();

create table public.post_votes (
  id serial not null,
  user_id uuid not null,
  post_id integer not null,
  vote_type text not null,
  created_at timestamp with time zone not null default CURRENT_TIMESTAMP,
  constraint post_votes_pkey primary key (id),
  constraint unique_user_post_vote unique (user_id, post_id),
  constraint post_votes_post_id_fkey foreign KEY (post_id) references posts (id) on delete CASCADE,
  constraint post_votes_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint post_votes_vote_type_check check (
    (
      vote_type = any (array['upvote'::text, 'downvote'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_post_votes_user_id on public.post_votes using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_post_votes_post_id on public.post_votes using btree (post_id) TABLESPACE pg_default;

create trigger trigger_update_post_vote_counts
after INSERT
or DELETE on post_votes for EACH row
execute FUNCTION update_post_vote_counts ();

create table public.comment_votes (
  id serial not null,
  comment_id integer not null,
  user_id uuid not null,
  vote_type text not null,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint comment_votes_pkey primary key (id),
  constraint comment_votes_user_comment_unique unique (user_id, comment_id),
  constraint comment_votes_comment_id_fkey foreign KEY (comment_id) references comments (id) on delete CASCADE,
  constraint comment_votes_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint comment_votes_vote_type_check check (
    (
      vote_type = any (array['upvote'::text, 'downvote'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_comment_votes_comment_id on public.comment_votes using btree (comment_id) TABLESPACE pg_default;

create index IF not exists idx_comment_votes_user_id on public.comment_votes using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_comment_votes_vote_type on public.comment_votes using btree (vote_type) TABLESPACE pg_default;

create trigger set_updated_at BEFORE
update on comment_votes for EACH row
execute FUNCTION update_updated_at_column ();

create table public.messages (
  id serial not null,
  sender_id uuid not null,
  community_id integer null,
  channel_id integer null,
  receiver_id uuid null,
  content text not null,
  message_type character varying(20) null,
  file_url character varying(255) null,
  sent_at timestamp with time zone null default CURRENT_TIMESTAMP,
  is_read boolean null default false,
  constraint messages_pkey primary key (id),
  constraint messages_channel_id_fkey foreign KEY (channel_id) references channels (id) on delete CASCADE,
  constraint messages_community_id_fkey foreign KEY (community_id) references community (id) on delete CASCADE,
  constraint messages_receiver_id_fkey foreign KEY (receiver_id) references users (id) on delete CASCADE,
  constraint messages_sender_id_fkey foreign KEY (sender_id) references users (id) on delete CASCADE,
  constraint messages_message_type_check check (
    (
      (message_type)::text = any (
        (
          array[
            'Text'::character varying,
            'Image'::character varying,
            'File'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_messages_community_id on public.messages using btree (community_id) TABLESPACE pg_default;

create index IF not exists idx_messages_receiver_id on public.messages using btree (receiver_id) TABLESPACE pg_default;

create index IF not exists idx_messages_sender_id on public.messages using btree (sender_id) TABLESPACE pg_default;

create index IF not exists idx_messages_sent_at on public.messages using btree (sent_at) TABLESPACE pg_default;

create index IF not exists idx_messages_channel_id on public.messages using btree (channel_id) TABLESPACE pg_default;

create table public.moderation_logs (
  id serial not null,
  community_id integer not null,
  user_id uuid not null,
  action character varying(50) null,
  details text null,
  actioned_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint moderation_logs_pkey primary key (id),
  constraint moderation_logs_community_id_fkey foreign KEY (community_id) references community (id) on delete CASCADE,
  constraint moderation_logs_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint moderation_logs_action_check check (
    (
      (action)::text = any (
        (
          array[
            'Ban'::character varying,
            'Mute'::character varying,
            'Delete Post'::character varying,
            'Delete Comment'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create table public.notifications (
  id serial not null,
  user_id uuid not null,
  content text not null,
  is_read boolean null default false,
  is_public boolean not null default false,
  notification_type text null,
  related_id text null,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint notifications_pkey primary key (id),
  constraint notifications_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_notifications_user_id on public.notifications using btree (user_id) TABLESPACE pg_default;

create table public.reputation_history (
  id serial not null,
  user_id uuid not null,
  changed_by uuid null,
  change_value integer not null,
  reason text null,
  changed_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint reputation_history_pkey primary key (id),
  constraint reputation_history_changed_by_fkey foreign KEY (changed_by) references users (id) on delete set null,
  constraint reputation_history_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create trigger update_user_reputation_trigger
after INSERT on reputation_history for EACH row
execute FUNCTION update_user_reputation ();

create table public.resources (
  id serial not null,
  room_id integer not null,
  user_id uuid not null,
  file_name character varying(255) not null,
  file_url character varying(255) not null,
  uploaded_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint resources_pkey primary key (id),
  constraint resources_room_id_fkey foreign KEY (room_id) references community (id) on delete CASCADE,
  constraint resources_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.user_connections (
  id serial not null,
  user_id uuid not null,
  connected_user_id uuid not null,
  status character varying(20) not null,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint user_connections_pkey primary key (id),
  constraint user_connections_unique unique (user_id, connected_user_id),
  constraint user_connections_user_id_fkey foreign key (user_id) references users (id) on delete cascade,
  constraint user_connections_connected_user_id_fkey foreign key (connected_user_id) references users (id) on delete cascade,
  constraint user_connections_status_check check (
    (
      (status)::text = any (
        array[
          ('pending'::character varying)::text,
          ('accepted'::character varying)::text,
          ('blocked'::character varying)::text
        ]
      )
    )
  ),
  constraint user_connections_different_users check (user_id <> connected_user_id)
) TABLESPACE pg_default;

create index IF not exists idx_user_connections_user_id on public.user_connections using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_user_connections_connected_user_id on public.user_connections using btree (connected_user_id) TABLESPACE pg_default;

create index IF not exists idx_user_connections_status on public.user_connections using btree (status) TABLESPACE pg_default;

create trigger set_updated_at BEFORE
update on user_connections for EACH row
execute FUNCTION update_updated_at_column();

-- =========================================================================
-- 3. Access helpers (SECURITY DEFINER so policies do not recurse into RLS)
-- =========================================================================

create or replace function public.is_community_member(p_community_id integer, p_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.community_members m
    where m.community_id = p_community_id and m.user_id = p_user_id
  );
$$;

-- Creator, admin or moderator of a community.
create or replace function public.is_community_staff(p_community_id integer, p_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.community c
    where c.id = p_community_id and c.created_by = p_user_id
  )
  or exists (
    select 1 from public.community_members m
    where m.community_id = p_community_id
      and m.user_id = p_user_id
      and m.role in ('admin', 'moderator')
  );
$$;

-- Creator or admin only (settings, channels).
create or replace function public.is_community_admin(p_community_id integer, p_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.community c
    where c.id = p_community_id and c.created_by = p_user_id
  )
  or exists (
    select 1 from public.community_members m
    where m.community_id = p_community_id
      and m.user_id = p_user_id
      and m.role = 'admin'
  );
$$;

-- Public communities are visible to everyone signed in; private ones to members/creator.
create or replace function public.community_is_visible(p_community_id integer, p_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.community c
    where c.id = p_community_id
      and (
        not coalesce(c.is_private, false)
        or c.created_by = p_user_id
        or public.is_community_member(c.id, p_user_id)
      )
  );
$$;

create or replace function public.post_is_visible(p_post_id integer, p_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.posts p
    where p.id = p_post_id and public.community_is_visible(p.community_id, p_user_id)
  );
$$;

-- Notifications are created only through this function (clients have no insert policy).
--
-- Enforced for every call:
--   * caller is authenticated (auth.uid() is not null)
--   * p_type is one of the notification types the app sends (system/custom are rejected)
--   * p_content, trimmed, is 1-500 characters
--   * p_user_id (recipient) exists in public.users
--   * the row is written with the caller's p_is_public / p_type / p_related_id (null or '' related_id -> null)
--
-- Relationship checks by type (the app sends most notifications right after the mutation):
--   * connection_request, connection_accept: a user_connections row links caller and recipient (either direction).
--   * new_post, post_updated, post_upvote, post_downvote, post_comment, comment_reply, comment_upvote,
--     comment_downvote: related_id must carry a post id (plain "42" or "post:42|...") and the post must be
--     visible to the caller.
--   * post_deleted: sent after the post row is gone; the check is skipped when the post no longer exists.
--   * channel_created/updated/deleted, community_created/updated/joined/member_joined/member_left/left:
--     related_id must carry a community id ("community:N", or "channel:N" resolved via channels).
--     If the community exists, the recipient must be a member or staff of it, and the caller must be a
--     member or staff, except for community_left / community_member_left (the caller's row is already gone).
--   * community_deleted: sent after the community row is gone; community membership checks are skipped.
--   * connection_removed: sent after the connection row may be gone; only the generic checks apply.
--
-- Known residual gaps (documented, not enforced): for the "already deleted/left" cases above the caller's
-- own relationship cannot be verified, and self-notification is allowed (the app relies on it).
create or replace function public.create_notification(
  p_user_id uuid,
  p_content text,
  p_related_id text,
  p_type text,
  p_is_public boolean default false
)
returns public.notifications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller    uuid := auth.uid();
  v_content   text := btrim(coalesce(p_content, ''));
  v_related   text := nullif(p_related_id, '');
  v_post_id   integer;
  v_community integer;
  v_channel   integer;
  v_row       public.notifications;
begin
  if v_caller is null then
    raise exception 'create_notification: authentication required' using errcode = '42501';
  end if;

  if p_type is null or p_type not in (
    'connection_request', 'connection_accept', 'connection_removed',
    'channel_created', 'channel_updated', 'channel_deleted',
    'post_upvote', 'post_downvote', 'post_comment', 'post_deleted', 'post_updated', 'new_post',
    'comment_upvote', 'comment_downvote', 'comment_reply',
    'community_created', 'community_updated', 'community_deleted', 'community_joined',
    'community_left', 'community_member_joined', 'community_member_left'
  ) then
    raise exception 'create_notification: unsupported notification type' using errcode = '22023';
  end if;

  if char_length(v_content) < 1 or char_length(v_content) > 500 then
    raise exception 'create_notification: content must be 1-500 characters' using errcode = '22023';
  end if;

  if p_user_id is null or not exists (select 1 from public.users u where u.id = p_user_id) then
    raise exception 'create_notification: recipient not found' using errcode = '22023';
  end if;

  if p_type in ('connection_request', 'connection_accept') then
    if not exists (
      select 1 from public.user_connections c
      where (c.user_id = v_caller and c.connected_user_id = p_user_id)
         or (c.user_id = p_user_id and c.connected_user_id = v_caller)
    ) then
      raise exception 'create_notification: no connection between sender and recipient' using errcode = '42501';
    end if;

  elsif p_type in ('new_post', 'post_updated', 'post_deleted', 'post_upvote', 'post_downvote',
                   'post_comment', 'comment_reply', 'comment_upvote', 'comment_downvote') then
    v_post_id := substring(coalesce(v_related, '') from '(?:^|post:)(\d+)')::integer;
    if v_post_id is null then
      raise exception 'create_notification: related_id must reference a post' using errcode = '22023';
    end if;
    if exists (select 1 from public.posts p where p.id = v_post_id) then
      if not public.post_is_visible(v_post_id, v_caller) then
        raise exception 'create_notification: sender cannot see this post' using errcode = '42501';
      end if;
    elsif p_type <> 'post_deleted' then
      raise exception 'create_notification: post not found' using errcode = '22023';
    end if;

  elsif left(p_type, 10) = 'community_' or left(p_type, 8) = 'channel_' then
    v_community := substring(coalesce(v_related, '') from 'community:(\d+)')::integer;
    if v_community is null then
      v_channel := substring(coalesce(v_related, '') from 'channel:(\d+)')::integer;
      select ch.community_id into v_community from public.channels ch where ch.id = v_channel;
    end if;
    if v_community is null then
      raise exception 'create_notification: related_id must reference a community or channel' using errcode = '22023';
    end if;

    if exists (select 1 from public.community c where c.id = v_community) then
      if p_type = 'community_left' then
        -- the leaver's own row is already gone; only a self-notification is valid
        if p_user_id <> v_caller then
          raise exception 'create_notification: community_left must notify the sender' using errcode = '42501';
        end if;
      elsif not (public.is_community_member(v_community, p_user_id) or public.is_community_staff(v_community, p_user_id)) then
        raise exception 'create_notification: recipient is not in this community' using errcode = '42501';
      end if;
      if p_type not in ('community_left', 'community_member_left')
         and not (public.is_community_member(v_community, v_caller) or public.is_community_staff(v_community, v_caller)) then
        raise exception 'create_notification: sender is not in this community' using errcode = '42501';
      end if;
    elsif p_type <> 'community_deleted' then
      raise exception 'create_notification: community not found' using errcode = '22023';
    end if;
  end if;

  insert into public.notifications (user_id, content, is_read, is_public, notification_type, related_id)
  values (p_user_id, v_content, false, coalesce(p_is_public, false), p_type, v_related)
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.create_notification(uuid, text, text, text, boolean) from public, anon;
grant execute on function public.create_notification(uuid, text, text, text, boolean) to authenticated;

-- =========================================================================
-- 4. Row Level Security
-- =========================================================================

alter table public.users              enable row level security;
alter table public.community          enable row level security;
alter table public.channels           enable row level security;
alter table public.community_members  enable row level security;
alter table public.posts              enable row level security;
alter table public.comments           enable row level security;
alter table public.post_votes         enable row level security;
alter table public.comment_votes      enable row level security;
alter table public.messages           enable row level security;
alter table public.moderation_logs    enable row level security;
alter table public.notifications      enable row level security;
alter table public.reputation_history enable row level security;
alter table public.resources          enable row level security;
alter table public.user_connections   enable row level security;

-- users: profiles readable by signed-in users; only the owner writes their row
create policy "users_select" on public.users for select to authenticated using (true);
create policy "users_insert" on public.users for insert to authenticated with check (id = auth.uid());
create policy "users_update" on public.users for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- community
create policy "community_select" on public.community for select to authenticated
  using (public.community_is_visible(id, auth.uid()));
create policy "community_insert" on public.community for insert to authenticated
  with check (created_by = auth.uid());
create policy "community_update" on public.community for update to authenticated
  using (public.is_community_admin(id, auth.uid()))
  with check (public.is_community_admin(id, auth.uid()));
create policy "community_delete" on public.community for delete to authenticated
  using (created_by = auth.uid());

-- channels
create policy "channels_select" on public.channels for select to authenticated
  using (public.community_is_visible(community_id, auth.uid()));
create policy "channels_insert" on public.channels for insert to authenticated
  with check (public.is_community_admin(community_id, auth.uid()));
create policy "channels_update" on public.channels for update to authenticated
  using (public.is_community_admin(community_id, auth.uid()))
  with check (public.is_community_admin(community_id, auth.uid()));
create policy "channels_delete" on public.channels for delete to authenticated
  using (public.is_community_admin(community_id, auth.uid()));

-- community_members
create policy "community_members_select" on public.community_members for select to authenticated
  using (public.community_is_visible(community_id, auth.uid()));
create policy "community_members_insert" on public.community_members for insert to authenticated
  with check (
    (
      user_id = auth.uid()
      and exists (
        select 1 from public.community c
        where c.id = community_id and not coalesce(c.is_private, false)
      )
    )
    or public.is_community_staff(community_id, auth.uid())
  );
create policy "community_members_update" on public.community_members for update to authenticated
  using (public.is_community_staff(community_id, auth.uid()))
  with check (public.is_community_staff(community_id, auth.uid()));
create policy "community_members_delete" on public.community_members for delete to authenticated
  using (user_id = auth.uid() or public.is_community_staff(community_id, auth.uid()));

-- posts
create policy "posts_select" on public.posts for select to authenticated
  using (public.community_is_visible(community_id, auth.uid()));
create policy "posts_insert" on public.posts for insert to authenticated
  with check (user_id = auth.uid() and public.is_community_member(community_id, auth.uid()));
create policy "posts_update" on public.posts for update to authenticated
  using (user_id = auth.uid() or public.is_community_staff(community_id, auth.uid()))
  with check (user_id = auth.uid() or public.is_community_staff(community_id, auth.uid()));
create policy "posts_delete" on public.posts for delete to authenticated
  using (user_id = auth.uid() or public.is_community_staff(community_id, auth.uid()));

-- comments
create policy "comments_select" on public.comments for select to authenticated
  using (public.post_is_visible(post_id, auth.uid()));
create policy "comments_insert" on public.comments for insert to authenticated
  with check (user_id = auth.uid() and public.post_is_visible(post_id, auth.uid()));
create policy "comments_update" on public.comments for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "comments_delete" on public.comments for delete to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.posts p
      where p.id = comments.post_id
        and public.is_community_staff(p.community_id, auth.uid())
    )
  );

-- post_votes (counts are maintained by trigger; users manage only their own vote)
create policy "post_votes_select" on public.post_votes for select to authenticated
  using (public.post_is_visible(post_id, auth.uid()));
create policy "post_votes_insert" on public.post_votes for insert to authenticated
  with check (user_id = auth.uid() and public.post_is_visible(post_id, auth.uid()));
create policy "post_votes_update" on public.post_votes for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "post_votes_delete" on public.post_votes for delete to authenticated
  using (user_id = auth.uid());

-- comment_votes
create policy "comment_votes_select" on public.comment_votes for select to authenticated
  using (exists (
    select 1 from public.comments c
    where c.id = comment_votes.comment_id and public.post_is_visible(c.post_id, auth.uid())
  ));
create policy "comment_votes_insert" on public.comment_votes for insert to authenticated
  with check (
    user_id = auth.uid() and exists (
      select 1 from public.comments c
      where c.id = comment_votes.comment_id and public.post_is_visible(c.post_id, auth.uid())
    )
  );
create policy "comment_votes_update" on public.comment_votes for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "comment_votes_delete" on public.comment_votes for delete to authenticated
  using (user_id = auth.uid());

-- messages: direct messages (receiver_id) or community/channel messages (community_id)
create policy "messages_select" on public.messages for select to authenticated
  using (
    sender_id = auth.uid()
    or receiver_id = auth.uid()
    or (community_id is not null and public.community_is_visible(community_id, auth.uid()))
  );
create policy "messages_insert" on public.messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and (
      receiver_id is not null
      or (community_id is not null and public.is_community_member(community_id, auth.uid()))
    )
  );
create policy "messages_update" on public.messages for update to authenticated
  using (sender_id = auth.uid() or receiver_id = auth.uid())
  with check (sender_id = auth.uid() or receiver_id = auth.uid());
create policy "messages_delete" on public.messages for delete to authenticated
  using (
    sender_id = auth.uid()
    or (community_id is not null and public.is_community_staff(community_id, auth.uid()))
  );

-- moderation_logs: staff read and write
create policy "moderation_logs_select" on public.moderation_logs for select to authenticated
  using (public.is_community_staff(community_id, auth.uid()));
create policy "moderation_logs_insert" on public.moderation_logs for insert to authenticated
  with check (user_id = auth.uid() and public.is_community_staff(community_id, auth.uid()));

-- notifications: owner reads/updates/deletes. There is NO insert policy: clients create
-- notifications only through public.create_notification() (SECURITY DEFINER, defined below).
drop policy if exists "notifications_insert" on public.notifications;  -- removed (existing databases)
create policy "notifications_select" on public.notifications for select to authenticated
  using (user_id = auth.uid());
create policy "notifications_update" on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notifications_delete" on public.notifications for delete to authenticated
  using (user_id = auth.uid());

-- reputation_history
create policy "reputation_history_select" on public.reputation_history for select to authenticated
  using (user_id = auth.uid() or changed_by = auth.uid());
create policy "reputation_history_insert" on public.reputation_history for insert to authenticated
  with check (changed_by = auth.uid());
create policy "reputation_history_update" on public.reputation_history for update to authenticated
  using (changed_by = auth.uid()) with check (changed_by = auth.uid());
create policy "reputation_history_delete" on public.reputation_history for delete to authenticated
  using (changed_by = auth.uid());

-- resources (community file uploads)
create policy "resources_select" on public.resources for select to authenticated
  using (public.community_is_visible(room_id, auth.uid()));
create policy "resources_insert" on public.resources for insert to authenticated
  with check (user_id = auth.uid() and public.is_community_member(room_id, auth.uid()));
create policy "resources_update" on public.resources for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "resources_delete" on public.resources for delete to authenticated
  using (user_id = auth.uid() or public.is_community_staff(room_id, auth.uid()));

-- user_connections: both parties see the row; requester creates; either side can update/remove
create policy "user_connections_select" on public.user_connections for select to authenticated
  using (user_id = auth.uid() or connected_user_id = auth.uid());
create policy "user_connections_insert" on public.user_connections for insert to authenticated
  with check (user_id = auth.uid());
create policy "user_connections_update" on public.user_connections for update to authenticated
  using (user_id = auth.uid() or connected_user_id = auth.uid())
  with check (user_id = auth.uid() or connected_user_id = auth.uid());
create policy "user_connections_delete" on public.user_connections for delete to authenticated
  using (user_id = auth.uid() or connected_user_id = auth.uid());

-- =========================================================================
-- 5. Storage buckets and policies (media, profile-pictures, community)
-- =========================================================================

insert into storage.buckets (id, name, public) values
  ('media', 'media', true),
  ('profile-pictures', 'profile-pictures', true),
  ('community', 'community', true)
on conflict (id) do nothing;

-- Anyone can read files in these public buckets
create policy "storage_public_read" on storage.objects for select
  using (bucket_id in ('media', 'profile-pictures', 'community'));

-- media: path is <folder>/<user-id>/..., so the owner id is the second segment
create policy "storage_media_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[2] = auth.uid()::text);
create policy "storage_media_update" on storage.objects for update to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[2] = auth.uid()::text);
create policy "storage_media_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[2] = auth.uid()::text);

drop policy if exists "storage_profile_insert" on storage.objects;  -- replaced below (existing databases)

-- profile-pictures and community: path is <user-id>/..., so the owner id is the first segment.
-- Only that user may insert, update or delete objects under their own folder.
create policy "storage_owner_insert" on storage.objects for insert to authenticated
  with check (bucket_id in ('profile-pictures', 'community') and (storage.foldername(name))[1] = auth.uid()::text);
create policy "storage_owner_update" on storage.objects for update to authenticated
  using (bucket_id in ('profile-pictures', 'community') and (storage.foldername(name))[1] = auth.uid()::text);
create policy "storage_owner_delete" on storage.objects for delete to authenticated
  using (bucket_id in ('profile-pictures', 'community') and (storage.foldername(name))[1] = auth.uid()::text);
