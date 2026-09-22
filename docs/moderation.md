# Event reports & moderation (Phase 4 / task 4.2)

Attendees can report a published listing from event detail. The app calls the
`report_event` RPC, which stores a row in `event_reports` and sets
`events.is_hidden = true` so the listing leaves Discover / Map until reviewed.

## Apply migration

Run [`supabase/migrations/20260811000000_event_reports.sql`](../supabase/migrations/20260811000000_event_reports.sql) in the SQL Editor (or `supabase db push`) after the init migration.

## What the app does

1. Event detail → **Report event** (signed-in users; hidden for the organizer).
2. Pick a reason → `report_event(event_id, reason)`.
3. On success, the event is hidden from public discovery; detail navigates back.

## Review / unhide (dashboard)

There is no admin web app in v1. Use the Supabase dashboard:

```sql
-- Recent reports
select r.created_at, r.reason, r.details, e.title, e.id as event_id, r.reporter_id
from public.event_reports r
join public.events e on e.id = r.event_id
order by r.created_at desc
limit 50;

-- Restore a false positive
update public.events
set is_hidden = false
where id = '<event-uuid>';
```

Owners can still see and edit their own hidden events via My Events (owner select RLS).

## Notes

- One report per user per event (`unique (event_id, reporter_id)`).
- First report hides the listing (simple v1; raise the threshold later if abused).
- Direct client updates to `is_hidden` remain owner-only; hiding for reports goes through the security-definer RPC.
