-- Phase 5 / task 5.2 — schema foundation (kind, category docs, price, moderation, profile)
-- Non-destructive: keeps price_label + free-text category readable until 5.3 backfill.
-- Apply after init + profiles_insert_own + event_reports. See docs/supabase-setup.md.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'event_kind') then
    create type public.event_kind as enum ('permanent', 'pop_up');
  end if;
end$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'trust_level') then
    create type public.trust_level as enum ('new', 'trusted', 'restricted');
  end if;
end$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'moderation_outcome') then
    create type public.moderation_outcome as enum ('allow', 'flag', 'block');
  end if;
end$$;

-- ---------------------------------------------------------------------------
-- events: classification, organizer link, structured price, moderation
-- ---------------------------------------------------------------------------
alter table public.events
  add column if not exists event_kind public.event_kind not null default 'pop_up';

alter table public.events
  add column if not exists organizer_url text;

alter table public.events
  add column if not exists is_free boolean not null default true;

alter table public.events
  add column if not exists price_amount numeric(12, 2);

alter table public.events
  add column if not exists price_currency text not null default 'USD';

alter table public.events
  add column if not exists pending_review boolean not null default false;

alter table public.events
  add column if not exists moderation_outcome public.moderation_outcome;

alter table public.events
  add column if not exists moderation_reason text;

alter table public.events
  add column if not exists auto_approve_at timestamptz;

comment on column public.events.event_kind is
  'Classification only: permanent vs pop_up. No recurrence rules or generated instances.';

comment on column public.events.category is
  'Fixed set (UI from 9.2): Fashion, Crafts, Music, Wellness, Outdoors, Games, Food, History, Other. Free-text still allowed until 5.3 backfill — no CHECK yet.';

comment on column public.events.organizer_url is
  'Optional external link (tickets/RSVP/info). https-only validation is app-side in 9.2.';

comment on column public.events.price_label is
  'Display string kept for read-path compatibility until 5.3 parses into is_free / price_amount.';

comment on column public.events.is_free is
  'Structured free flag; default true until 5.3 backfill from price_label.';

comment on column public.events.pending_review is
  'True while awaiting human/auto review (Phase 6). Screening logic not in this migration.';

comment on column public.events.auto_approve_at is
  'When set, flagged-not-prohibited listings may auto-publish after this instant (Phase 6.3).';

-- No CHECK on category yet (existing free-text rows must remain readable until 5.3).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'events_price_amount_nonnegative'
  ) then
    alter table public.events
      add constraint events_price_amount_nonnegative
      check (price_amount is null or price_amount >= 0);
  end if;
end$$;

create index if not exists events_pending_review_idx
  on public.events (pending_review, created_at desc)
  where pending_review = true;

create index if not exists events_event_kind_idx
  on public.events (event_kind)
  where status = 'published' and is_hidden = false;

-- ---------------------------------------------------------------------------
-- profiles: username + trust_level
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists username text;

alter table public.profiles
  add column if not exists trust_level public.trust_level not null default 'new';

comment on column public.profiles.username is
  'Nullable unique handle; selection UX + reserved/profanity checks in 7.2.';

comment on column public.profiles.trust_level is
  'new | trusted | restricted. Used by Phase 6.3 auto-approve / review policy.';

create unique index if not exists profiles_username_unique
  on public.profiles (username)
  where username is not null;
