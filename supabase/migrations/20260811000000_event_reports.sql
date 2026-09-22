-- Event reports + hide-from-discovery RPC (Phase 4 / task 4.2)
-- Apply after init migration. See docs/moderation.md.

-- ---------------------------------------------------------------------------
-- Reports table
-- ---------------------------------------------------------------------------
create table if not exists public.event_reports (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null,
  details text,
  created_at timestamptz not null default now(),
  constraint event_reports_reason_nonempty check (length(trim(reason)) > 0),
  constraint event_reports_one_per_user unique (event_id, reporter_id)
);

create index if not exists event_reports_event_id_idx
  on public.event_reports (event_id, created_at desc);

alter table public.event_reports enable row level security;

-- Reporters can read their own rows (optional UX); writes go through RPC.
drop policy if exists "event_reports_select_own" on public.event_reports;
create policy "event_reports_select_own"
on public.event_reports
for select
to authenticated
using (auth.uid() = reporter_id);

-- ---------------------------------------------------------------------------
-- report_event: insert report + set is_hidden (pending review)
-- ---------------------------------------------------------------------------
create or replace function public.report_event(
  p_event_id uuid,
  p_reason text,
  p_details text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_organizer uuid;
  v_status public.event_status;
  v_row_count integer := 0;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'Reason required';
  end if;

  select e.organizer_id, e.status
  into v_organizer, v_status
  from public.events e
  where e.id = p_event_id;

  if v_organizer is null then
    raise exception 'Event not found';
  end if;

  if v_organizer = v_uid then
    raise exception 'Cannot report your own event';
  end if;

  if v_status is distinct from 'published' then
    raise exception 'Event is not publicly listed';
  end if;

  insert into public.event_reports (event_id, reporter_id, reason, details)
  values (
    p_event_id,
    v_uid,
    trim(p_reason),
    nullif(trim(coalesce(p_details, '')), '')
  )
  on conflict (event_id, reporter_id) do nothing;

  get diagnostics v_row_count = row_count;

  update public.events
  set is_hidden = true
  where id = p_event_id
    and is_hidden = false;

  return jsonb_build_object(
    'ok', true,
    'hidden', true,
    'already_reported', (v_row_count = 0)
  );
end;
$$;

revoke all on function public.report_event(uuid, text, text) from public;
grant execute on function public.report_event(uuid, text, text) to authenticated;
