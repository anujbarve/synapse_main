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
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint notifications_pkey primary key (id),
  constraint notifications_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_notifications_user_id on public.notifications using btree (user_id) TABLESPACE pg_default;

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