-- local-events v1 schema
-- Apply via Supabase SQL Editor or `supabase db push` (see docs/supabase-setup.md).
-- Does not enable live queries in the Expo app by itself.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'event_status') then
    create type public.event_status as enum ('draft', 'published', 'cancelled');
  end if;
end$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  is_organizer boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text not null default '',
  category text not null default '',
  price_label text not null default 'Free',
  starts_at timestamptz not null,
  ends_at timestamptz,
  timezone text not null default 'UTC',
  venue_name text,
  address text,
  lat double precision not null,
  lng double precision not null,
  status public.event_status not null default 'draft',
  cover_image_url text not null,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_lat_range check (lat >= -90 and lat <= 90),
  constraint events_lng_range check (lng >= -180 and lng <= 180),
  constraint events_ends_after_starts check (ends_at is null or ends_at >= starts_at)
);

create table if not exists public.event_images (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  url text not null,
  sort_order integer not null default 0
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists events_organizer_id_idx on public.events (organizer_id);
create index if not exists events_status_starts_at_idx on public.events (status, starts_at);
create index if not exists events_geo_idx on public.events (lat, lng);
create index if not exists events_discovery_idx
  on public.events (starts_at)
  where status = 'published' and is_hidden = false;
create index if not exists event_images_event_id_idx on public.event_images (event_id, sort_order);

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at
before update on public.events
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auth → profile trigger
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url, is_organizer)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1), 'User'),
    new.raw_user_meta_data ->> 'avatar_url',
    false
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Helpers for RLS
-- ---------------------------------------------------------------------------
create or replace function public.is_organizer(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select p.is_organizer from public.profiles p where p.id = uid), false);
$$;

create or replace function public.is_event_owner(event_organizer_id uuid)
returns boolean
language sql
stable
as $$
  select auth.uid() = event_organizer_id;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.event_images enable row level security;

-- Profiles
drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
on public.profiles
for select
to authenticated
using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

-- Events: public discovery (anon + authenticated)
drop policy if exists "events_select_public_published" on public.events;
create policy "events_select_public_published"
on public.events
for select
to anon, authenticated
using (
  status = 'published'
  and is_hidden = false
);

-- Owners can read their own drafts / cancelled / hidden
drop policy if exists "events_select_owner_all" on public.events;
create policy "events_select_owner_all"
on public.events
for select
to authenticated
using (auth.uid() = organizer_id);

-- Insert only when profile.is_organizer
drop policy if exists "events_insert_organizers" on public.events;
create policy "events_insert_organizers"
on public.events
for insert
to authenticated
with check (
  auth.uid() = organizer_id
  and public.is_organizer(auth.uid())
);

-- Owner update / delete
drop policy if exists "events_update_owner" on public.events;
create policy "events_update_owner"
on public.events
for update
to authenticated
using (auth.uid() = organizer_id)
with check (
  auth.uid() = organizer_id
  and public.is_organizer(auth.uid())
);

drop policy if exists "events_delete_owner" on public.events;
create policy "events_delete_owner"
on public.events
for delete
to authenticated
using (auth.uid() = organizer_id);

-- Event images: readable when parent event is publicly visible or owned
drop policy if exists "event_images_select_visible" on public.event_images;
create policy "event_images_select_visible"
on public.event_images
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.events e
    where e.id = event_id
      and (
        (e.status = 'published' and e.is_hidden = false)
        or e.organizer_id = auth.uid()
      )
  )
);

drop policy if exists "event_images_insert_owner" on public.event_images;
create policy "event_images_insert_owner"
on public.event_images
for insert
to authenticated
with check (
  exists (
    select 1
    from public.events e
    where e.id = event_id
      and e.organizer_id = auth.uid()
      and public.is_organizer(auth.uid())
  )
);

drop policy if exists "event_images_update_owner" on public.event_images;
create policy "event_images_update_owner"
on public.event_images
for update
to authenticated
using (
  exists (
    select 1 from public.events e
    where e.id = event_id and e.organizer_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.events e
    where e.id = event_id and e.organizer_id = auth.uid()
  )
);

drop policy if exists "event_images_delete_owner" on public.event_images;
create policy "event_images_delete_owner"
on public.event_images
for delete
to authenticated
using (
  exists (
    select 1 from public.events e
    where e.id = event_id and e.organizer_id = auth.uid()
  )
);

-- ---------------------------------------------------------------------------
-- Storage: event-images bucket (path: {user_id}/{event_id}/{filename})
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('event-images', 'event-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "event_images_storage_select_public" on storage.objects;
create policy "event_images_storage_select_public"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'event-images');

drop policy if exists "event_images_storage_insert_own_folder" on storage.objects;
create policy "event_images_storage_insert_own_folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'event-images'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.is_organizer(auth.uid())
);

drop policy if exists "event_images_storage_update_own_folder" on storage.objects;
create policy "event_images_storage_update_own_folder"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'event-images'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'event-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "event_images_storage_delete_own_folder" on storage.objects;
create policy "event_images_storage_delete_own_folder"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'event-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
