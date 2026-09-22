# Handoff — start Phase 2 (Cursor CLI)

Use this after clearing chat context. Workspace / cwd:

**`/Users/ayeshadadabhoy/Desktop/local-events`**

Do **not** modify `/Users/ayeshadadabhoy/Desktop/playdates` (read-only reference only).

---

## Current status (as of 2026-08-09)

| Field | Value |
| --- | --- |
| Phase 0 | **complete** |
| Phase 1 | **complete** (1.1–1.3) |
| Next | **Phase 2** — start with **task 2.1** only |
| Discover data | Still **mock events** (`data/mock-events.ts`) |
| Auth / organizer | Working against Supabase when `.env` is set |

---

## Paste into a new Cursor CLI session

```
You are building the iOS app in /Users/ayeshadadabhoy/Desktop/local-events (Expo SDK 54).
Reference prior UI/ideas in /Users/ayeshadadabhoy/Desktop/playdates but do not modify playdates.

Rules:
- Read AGENTS.md and https://docs.expo.dev/versions/v54.0.0/ before native/Expo APIs.
- Read PROGRESS.md and docs/handoff-phase-2.md first. Implement ONLY the single task ID given. Do not start other tasks.
- When the task is done: update PROGRESS.md and docs/session-log.md, then STOP.
- If the phase’s tasks are all complete: ask the user whether to proceed to the next phase. Do not start it.
- Prefer small, production-shaped changes. No tickets/RSVP/push/Android store in v1.
- Locked product: GPS any-city discovery; users must set is_organizer to publish.
- Mac preview: prefer iOS Simulator (`npm run ios`). See docs/dev-preview.md.
- Source of truth for task IDs: PROGRESS.md. Plan/architecture: local_events_app_fecfcbe0.plan.md.

User has approved starting Phase 2.

Execute task 2.1 only.
Success criteria: location permission + nearby query for the Discover list (live Supabase published events near the user when possible; graceful fallback if no location / no env / empty results). No map tab yet (that is 2.2). No event detail wizard beyond what’s needed for the list.

When done: mark 2.1 complete in PROGRESS.md, set next task to 2.2, append docs/session-log.md, and STOP.
```

For later Phase 2 sessions, reuse the Rules block and change only:

```
Execute task 2.2 only.
Success criteria: <from PROGRESS.md Phase 2 table>
```

---

## Phase 2 queue (official)

| ID | Goal | Done when |
| --- | --- | --- |
| **2.1** | Location + nearby list query | Discover list uses user coords (or denial UX) and fetches nearby **published** events from Supabase when configured; mock/empty fallback OK |
| **2.2** | Map tab + pins → detail | Map tab shows pins; tap navigates to event detail |
| **2.3** | Event detail + share; light filters | Detail screen + share; simple filters on Discover |

**Phase 2 gate:** ask user before Phase 3 (organizer create wizard).

---

## Already built (do not re-scaffold)

- Expo Router tabs: Discover (`index`), Create (organizer-gated), Profile
- Design tokens: `constants/theme.ts`
- Types: `types/event.ts`, `types/profile.ts` (match DB shape)
- Supabase client + session: `lib/supabase.ts` (AsyncStorage)
- Auth: `contexts/auth-context.tsx` — sign in/up/out, `deleteAccount`
- Profile / organizer: `contexts/profile-context.tsx`, `lib/profiles.ts`
- Location helpers (permission stub): `lib/location.ts`
- EventCard: `components/events/EventCard.tsx`
- Schema/RLS SQL: `supabase/migrations/`
- Account deletion Edge Function (must be **deployed** to work): `supabase/functions/delete-account`
- Docs: `docs/supabase-setup.md`, `docs/account-deletion.md`, `docs/dev-preview.md`

---

## Key paths

```
local-events/
  AGENTS.md
  PROGRESS.md
  local_events_app_fecfcbe0.plan.md
  docs/
    handoff-phase-2.md      ← this file
    session-log.md
    supabase-setup.md
    account-deletion.md
    dev-preview.md
  app/(tabs)/index.tsx      ← Discover (mock list today)
  lib/location.ts
  lib/supabase.ts
  data/mock-events.ts
  supabase/migrations/
```

---

## Env / backend checklist (before live nearby queries)

1. `.env` from `.env.example`:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
2. Apply SQL migrations in Supabase (see `docs/supabase-setup.md`).
3. Seed at least one **published** event with real `lat`/`lng` near your test location (or Simulator → Features → Location).
4. Optional: deploy `delete-account` function (`docs/account-deletion.md`).

---

## Mac Simulator notes

- Prefer **iPhone 17 Pro** (iOS 26.5). Old iOS 15 simulators are dead — do not boot them.
- If Expo boots a bad UDID: `open -a Simulator`, pick iPhone 17 Pro, or `Shift+i` in Expo CLI.
- Port 8081 may be taken by `playdates` — accept another port (e.g. 8083).
- Run: `cd /Users/ayeshadadabhoy/Desktop/local-events && npm run ios`

---

## Out of scope until later phases

- Phase 3: create/edit wizard, image upload, My Events
- Tickets, RSVP, push, Android store, macOS desktop app
- Re-scaffolding Expo or rewriting auth
