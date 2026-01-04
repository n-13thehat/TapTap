create extension if not exists pgcrypto;
create extension if not exists uuid-ossp;

create table if not exists "SurfPlaylist" (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  created_at  timestamptz not null default now()
);
create index if not exists surfplaylist_user_idx on "SurfPlaylist"(user_id);

create table if not exists "SurfPlaylistItem" (
  playlist_id uuid not null references "SurfPlaylist"(id) on delete cascade,
  videoId     text not null,
  title       text not null,
  channelTitle text,
  thumbnail    text,
  publishedAt  timestamptz,
  position     integer not null default 0,
  created_at   timestamptz not null default now(),
  primary key (playlist_id, videoId)
);

alter table "SurfPlaylist" enable row level security;
alter table "SurfPlaylistItem" enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where policyname='surf_pl_owner_select') then
    create policy surf_pl_owner_select on "SurfPlaylist" for select to authenticated
      using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname='surf_pl_owner_crud') then
    create policy surf_pl_owner_crud on "SurfPlaylist" for all to authenticated
      using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where policyname='surf_item_owner_select') then
    create policy surf_item_owner_select on "SurfPlaylistItem" for select to authenticated
      using (exists (select 1 from "SurfPlaylist" p where p.id = playlist_id and p.user_id = auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where policyname='surf_item_owner_crud') then
    create policy surf_item_owner_crud on "SurfPlaylistItem" for all to authenticated
      using (exists (select 1 from "SurfPlaylist" p where p.id = playlist_id and p.user_id = auth.uid()))
      with check (exists (select 1 from "SurfPlaylist" p where p.id = playlist_id and p.user_id = auth.uid()));
  end if;
end $$;