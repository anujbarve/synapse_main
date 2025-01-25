create table
  public.users (
    id uuid not null default auth.uid (),
    username character varying(50) not null,
    email character varying(255) not null,
    bio text null,
    profile_picture character varying(255) null,
    reputation integer null default 0,
    created_at timestamp with time zone null default current_timestamp,
    updated_at timestamp with time zone null default current_timestamp,
    constraint users_pkey primary key (id),
    constraint users_email_key unique (email),
    constraint users_username_key unique (username)
  ) tablespace pg_default;

create index if not exists idx_users_email on public.users using btree (email) tablespace pg_default;

create trigger set_updated_at before
update on users for each row
execute function update_updated_at_column ();

create table
  public.resources (
    id serial not null,
    room_id integer not null,
    user_id uuid not null,
    file_name character varying(255) not null,
    file_url character varying(255) not null,
    uploaded_at timestamp with time zone null default current_timestamp,
    constraint resources_pkey primary key (id),
    constraint resources_room_id_fkey foreign key (room_id) references community (id) on delete cascade,
    constraint resources_user_id_fkey foreign key (user_id) references users (id) on delete cascade
  ) tablespace pg_default;

create table
  public.reputation_history (
    id serial not null,
    user_id uuid not null,
    changed_by uuid null,
    change_value integer not null,
    reason text null,
    changed_at timestamp with time zone null default current_timestamp,
    constraint reputation_history_pkey primary key (id),
    constraint reputation_history_changed_by_fkey foreign key (changed_by) references users (id) on delete set null,
    constraint reputation_history_user_id_fkey foreign key (user_id) references users (id) on delete cascade
  ) tablespace pg_default;


  create table
  public.posts (
    id serial not null,
    community_id integer not null,
    user_id uuid not null,
    title character varying(255) not null,
    content text null,
    type character varying(20) null,
    upvotes integer null default 0,
    downvotes integer null default 0,
    created_at timestamp with time zone null default current_timestamp,
    updated_at timestamp with time zone null default current_timestamp,
    constraint posts_pkey primary key (id),
    constraint posts_community_id_fkey foreign key (community_id) references community (id) on delete cascade,
    constraint posts_user_id_fkey foreign key (user_id) references users (id) on delete cascade,
    constraint posts_type_check check (
      (
        (
          type
        )::text = any (
          (
            array[
              'Text'::character varying,
              'Link'::character varying,
              'Image'::character varying
            ]
          )::text[]
        )
      )
    )
  ) tablespace pg_default;

create index if not exists idx_posts_room_id on public.posts using btree (community_id) tablespace pg_default;

create trigger set_updated_at before
update on posts for each row
execute function update_updated_at_column ();

create table
  public.notifications (
    id serial not null,
    user_id uuid not null,
    content text not null,
    is_read boolean null default false,
    created_at timestamp with time zone null default current_timestamp,
    constraint notifications_pkey primary key (id),
    constraint notifications_user_id_fkey foreign key (user_id) references users (id) on delete cascade
  ) tablespace pg_default;

create index if not exists idx_notifications_user_id on public.notifications using btree (user_id) tablespace pg_default;

create table
  public.moderation_logs (
    id serial not null,
    community_id integer not null,
    user_id uuid not null,
    action character varying(50) null,
    details text null,
    actioned_at timestamp with time zone null default current_timestamp,
    constraint moderation_logs_pkey primary key (id),
    constraint moderation_logs_community_id_fkey foreign key (community_id) references community (id) on delete cascade,
    constraint moderation_logs_user_id_fkey foreign key (user_id) references users (id) on delete cascade,
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
  ) tablespace pg_default;

  create table
  public.messages (
    id serial not null,
    sender_id uuid not null,
    community_id integer null,
    receiver_id uuid null,
    content text not null,
    message_type character varying(20) null,
    file_url character varying(255) null,
    sent_at timestamp with time zone null default current_timestamp,
    is_read boolean null default false,
    constraint messages_pkey primary key (id),
    constraint messages_community_id_fkey foreign key (community_id) references community (id) on delete cascade,
    constraint messages_receiver_id_fkey foreign key (receiver_id) references users (id) on delete cascade,
    constraint messages_sender_id_fkey foreign key (sender_id) references users (id) on delete cascade,
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
  ) tablespace pg_default;

create index if not exists idx_messages_room_id on public.messages using btree (community_id) tablespace pg_default;

create index if not exists idx_messages_receiver_id on public.messages using btree (receiver_id) tablespace pg_default;

create index if not exists idx_messages_sender_id on public.messages using btree (sender_id) tablespace pg_default;

create index if not exists idx_messages_sent_at on public.messages using btree (sent_at) tablespace pg_default;

create table
  public.community_members (
    id serial not null,
    community_id integer not null,
    user_id uuid not null,
    role character varying(50) null default '''member''::character varying'::character varying,
    joined_at timestamp with time zone null default current_timestamp,
    constraint room_members_pkey primary key (id),
    constraint room_members_room_id_fkey foreign key (community_id) references community (id) on delete cascade,
    constraint room_members_user_id_fkey foreign key (user_id) references users (id) on delete cascade
  ) tablespace pg_default;

  create table
  public.community (
    id serial not null,
    name character varying(100) not null,
    description text null,
    created_by uuid not null,
    is_private boolean null default false,
    created_at timestamp with time zone null default current_timestamp,
    updated_at timestamp with time zone null default current_timestamp,
    banner_picture character varying null,
    constraint rooms_pkey primary key (id),
    constraint rooms_name_key unique (name),
    constraint rooms_created_by_fkey foreign key (created_by) references users (id) on delete cascade
  ) tablespace pg_default;

create trigger set_updated_at before
update on community for each row
execute function update_updated_at_column ();

create trigger create_default_channels
after insert on community for each row
execute function auto_create_default_channels ();

create table
  public.comments (
    id serial not null,
    post_id integer not null,
    user_id uuid not null,
    parent_id integer null,
    content text not null,
    upvotes integer null default 0,
    downvotes integer null default 0,
    created_at timestamp with time zone null default current_timestamp,
    updated_at timestamp with time zone null default current_timestamp,
    constraint comments_pkey primary key (id),
    constraint comments_parent_id_fkey foreign key (parent_id) references comments (id) on delete cascade,
    constraint comments_post_id_fkey foreign key (post_id) references posts (id) on delete cascade,
    constraint comments_user_id_fkey foreign key (user_id) references users (id) on delete cascade
  ) tablespace pg_default;

create index if not exists idx_comments_post_id on public.comments using btree (post_id) tablespace pg_default;

create trigger set_updated_at before
update on comments for each row
execute function update_updated_at_column ();

create table
  public.channels (
    id serial not null,
    community_id integer not null,
    name character varying(100) not null,
    description text null,
    type character varying(20) not null, -- "Text" or "Voice"
    created_at timestamp with time zone null default current_timestamp,
    updated_at timestamp with time zone null default current_timestamp,
    constraint channels_pkey primary key (id),
    constraint channels_community_id_fkey foreign key (community_id) references community (id) on delete cascade,
    constraint channels_type_check check (
      (
        (type)::text = any (
          (
            array[
              'Text'::character varying,
              'Voice'::character varying
            ]
          )::text[]
        )
      )
    )
  ) tablespace pg_default;

create index if not exists idx_channels_community_id on public.channels using btree (community_id) tablespace pg_default;

create trigger set_updated_at before
update on channels for each row
execute function update_updated_at_column ();
