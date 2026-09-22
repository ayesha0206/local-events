# Supabase setup (Phase 0 / task 0.5)

SQL lives in [`supabase/migrations/20260809120000_init.sql`](../supabase/migrations/20260809120000_init.sql).  
The Expo app still uses **mock data** — do not wire live queries until Phase 1+.

## What the migration creates

| Object | Purpose |
| --- | --- |
| `profiles` | 1:1 with `auth.users`; `is_organizer` defaults `false` |
| `events` | Listings with geo (`lat`/`lng`), status, cover URL |
| `event_images` | Extra gallery rows per event |
| `handle_new_user` | Trigger: new auth user → profile row |
| RLS | Public read published+visible; write requires organizer + ownership |
| Storage bucket `event-images` | Public read; writes under `{user_id}/...` and organizer-only |

## Apply steps (dashboard)

1. Create or open a Supabase project (reuse playdates project only if you intend to **migrate** that schema carefully; otherwise use a fresh project).
2. Copy `.env.example` → `.env` and set:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
3. Open **SQL Editor** → New query.
4. Paste the full contents of `supabase/migrations/20260809120000_init.sql`.
5. Run the script. Fix any errors (re-runs are mostly idempotent via `if not exists` / `drop policy if exists`).
6. Confirm in **Table Editor**: `profiles`, `events`, `event_images`.
7. Confirm in **Storage**: bucket `event-images` exists and is public.

### Optional CLI

If you use the Supabase CLI linked to the project:

```sh
supabase db push
```

## RLS checklist

After applying, verify in **Authentication → Policies** / SQL:

- [ ] Anon can `select` only `events` where `status = 'published'` and `is_hidden = false`
- [ ] Authenticated non-organizer **cannot** `insert` into `events`
- [ ] User with `profiles.is_organizer = true` can `insert` with `organizer_id = auth.uid()`
- [ ] Owner can `select` own drafts; others cannot
- [ ] Storage upload fails unless path starts with `{auth.uid()}/` and user is organizer
- [ ] New signup creates a `profiles` row (`is_organizer = false`)

Manual SQL smoke tests (run as appropriate roles in SQL editor or via client):

```sql
-- Should return only published, visible events for anon key usage
select id, title, status from public.events
where status = 'published' and is_hidden = false;
```

Toggle organizer (server/dashboard only for now — app UI comes later):

```sql
update public.profiles
set is_organizer = true
where id = '<user-uuid>';
```

## Product locks encoded in SQL

- **Publish gate:** `events` insert/update policies require `public.is_organizer(auth.uid())`.
- **No tickets/RSVP tables** in v1.
- **Nearby discovery:** `lat`/`lng` + indexes present; PostGIS optional later.

## Auth (Phase 1)

Email/password auth uses the Expo client with AsyncStorage session persistence.

1. In Supabase Dashboard → **Authentication → Providers**, enable **Email**.
2. For local/dev convenience you may disable **Confirm email** (or leave it on and use the in-app confirmation message).
3. Ensure the Phase 0 migration (auth → `profiles` trigger) is applied so new users get a profile row.
4. Also apply `supabase/migrations/20260809130000_profiles_insert_own.sql` so the app can create a profile if the trigger missed.
5. App `.env` must include `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

### Organizer flag

- Clients update `profiles.is_organizer` via Profile → **Become an organizer**.
- Create tab / create route stays gated until `is_organizer = true` (RLS also blocks event inserts).

### Account deletion

See [`docs/account-deletion.md`](./account-deletion.md): deploy Edge Function `delete-account`, then use Profile → **Delete account**.

### Reports / moderation

See [`docs/moderation.md`](./moderation.md): apply `supabase/migrations/20260811000000_event_reports.sql`, then use event detail → **Report event**. Reported listings set `is_hidden = true` until you unhide them in the dashboard.

### Schema foundation (Phase 5 / task 5.2)

Apply after the migrations above:

1. Open **SQL Editor** → New query.
2. Paste [`supabase/migrations/20260814000000_schema_foundation_5_2.sql`](../supabase/migrations/20260814000000_schema_foundation_5_2.sql).
3. Run. Re-runs are mostly idempotent (`if not exists` / `add column if not exists`).

Or with the CLI: `supabase db push`.

| Addition | Notes |
| --- | --- |
| `events.event_kind` | `permanent` \| `pop_up` (default `pop_up`); classification only |
| `events.category` | Documented fixed nine; **no CHECK** until 5.3 backfill |
| `events.organizer_url` | Nullable text |
| `events.is_free` / `price_amount` / `price_currency` | Structured price; keep `price_label` until 5.3 |
| `events.pending_review` + moderation companions | Columns only; screening logic is Phase 6 |
| `profiles.username` | Nullable unique |
| `profiles.trust_level` | `new` \| `trusted` \| `restricted` (default `new`) |

Task **5.3** remaps free-text categories and parses `price_label` into the structured price columns. Do not skip 5.2 when applying on an existing project — run this migration first.

### Backfill (Phase 5 / task 5.3)

Apply after 5.2:

1. Paste [`supabase/migrations/20260814010000_backfill_events_5_3.sql`](../supabase/migrations/20260814010000_backfill_events_5_3.sql) in SQL Editor (or `supabase db push`).
2. Confirm categories are only the fixed nine; empty venue/address are null; `is_free` / `price_amount` match `price_label`.

Client helpers in `lib/event-compat.ts` normalize legacy categories and prices on read, and create/update writes structured price + normalized category.
