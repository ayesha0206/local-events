# Progress — local-events

## Status

| Field | Value |
| --- | --- |
| **Current phase** | 5 — Foundation (**complete**) |
| **Next task** | Phase 6 — ask before starting |
| **Last completed** | 5.3 (2026-08-14) |

## Product locks

- GPS any-city discovery
- Users must set `is_organizer` to publish
- v1 excludes: tickets, RSVP, push, Android store
- Recurring events are a classification flag only (`event_kind`); no recurrence rules or generated instances
- No Google Maps provider switch and no native dev build; preview stays `npm run ios`
- Social sign-in (Apple / Google) deferred out of v1; email auth stays

## Phase 0 — Foundation

| ID | Task | Status |
| --- | --- | --- |
| 0.1–0.6 | Foundation | **done** |

## Phase 1 — Auth + roles

| ID | Task | Status |
| --- | --- | --- |
| 1.1 | Email auth UI + session persistence | **done** |
| 1.2 | Profile load; Become Organizer flow; gate create routes | **done** |
| 1.3 | Account deletion (client + documented backend steps) | **done** |

## Phase 2 — Attendee discovery

| ID | Task | Status |
| --- | --- | --- |
| 2.1 | Location permission + nearby query for Discover list | **done** |
| 2.2 | Map tab with pins + navigate to detail | **done** |
| 2.3 | Event detail + share; light filters | **done** |

## Phase 3 — Organizer supply

| ID | Task | Status |
| --- | --- | --- |
| 3.1 | Create event form (draft) | **done** |
| 3.2 | Map/location picker → lat/lng + address | **done** |
| 3.3 | Image picker + Storage upload + cover required | **done** |
| 3.4 | My Events; edit; publish; cancel | **done** |

## Phase 4 — Polish

| ID | Task | Status |
| --- | --- | --- |
| 4.1 | Timezone display; hide past from discovery | **done** |
| 4.2 | Report / `is_hidden` moderation | **done** |
| 4.3 | Deep links | **done** |

## Phase 5 — Foundation

| ID | Task | Status |
| --- | --- | --- |
| 5.1 | Palette tokens (`#FDFD96`, `#9B96FD`, `#1805DB`) + contrast pass; replace hardcoded hex and hash-based `PillColors` | **done** |
| 5.2 | One migration: `event_kind`, fixed category set, `organizer_url`, structured price, moderation columns + `pending_review`, `profiles.username` + `trust_level`; update types | **done** |
| 5.3 | Backfill + read-path compatibility: map free-text categories, parse price labels, handle null venue/address | **done** |

## Phase 6 — Trust and safety

| ID | Task | Status |
| --- | --- | --- |
| 6.1 | Server-side text screening at publish (allow / flag / block) + `pending_review` + RLS | pending |
| 6.2 | Image moderation on cover upload via Edge Function; fail closed if vendor unavailable | pending |
| 6.3 | Trust tiers + auto-approve timer (flagged-not-prohibited publishes after N hours) | pending |
| 6.4 | Review queue views in Supabase Studio + flag notification webhook | pending |
| 6.5 | Report hardening: threshold before auto-hide, organizer notice + appeal, block organizer, support contact | pending |
| 6.6 | Organizer realness: email confirmation, profile completeness gate, rate limits, duplicate detection | pending |

## Phase 7 — Identity and profile

| ID | Task | Status |
| --- | --- | --- |
| 7.1 | Branded auth emails (custom SMTP on own domain, templates, sender name) | pending |
| 7.2 | Username selection: uniqueness, reserved list, profanity check, availability RPC, suggestion | pending |
| 7.3 | Profile redesign; explicit guest-browsing copy; organizer badge; empty/error states | pending |
| 7.4 | Auth UX: forgot/reset password (deep link), clearer duplicate-email handling, stronger password rules + copy | pending |

## Phase 8 — Maps and location

No native build; stays Expo Go compatible.

| ID | Task | Status |
| --- | --- | --- |
| 8.1 | "Open in Maps" out-link (`lib/open-in-maps.ts`): Google Maps scheme → HTTPS fallback; Google / Apple / copy-address sheet on event detail + map callout | pending |
| 8.2 | Location search in create via free `Location.geocodeAsync`; easier pin drop | pending |
| 8.3 | Map tab polish with new palette + kind filtering | pending |

## Phase 9 — Create and discover UX

| ID | Task | Status |
| --- | --- | --- |
| 9.1 | Create restructure: cover first, all fields required except end time, date picker in a modal | pending |
| 9.2 | Category dropdown, event kind dropdown, organizer link field (https-only), structured price input | pending |
| 9.3 | Discover: permanent vs pop-up tabs | pending |
| 9.4 | Discover: filter/sort sheet (price, date, distance); Free filter UX (not a category chip — price on cards; separate filter with category-style selected state); past-event logic excludes ongoing events | pending |

## Phase 10 — App Store

| ID | Task | Status |
| --- | --- | --- |
| 10.1 | EAS config + `ios.bundleIdentifier` + privacy usage strings | pending |
| 10.2 | Legal URL placeholders; App Review demo notes; privacy labels (incl. moderation vendor disclosure) | pending |
| 10.3 | TestFlight path; screenshot checklist | pending |

## Notes

- **Mac preview:** `npm run ios` — iPhone 17 Pro / iOS 26.5; if port 8081 is taken use `--port 8084`.
- Organizers manage drafts via Profile → My Events (edit / publish / cancel).
- Account deletion needs Edge Function deploy: `docs/account-deletion.md`.
- Discovery hides past events (`ends_at` else `starts_at`); My Events still lists past/cancelled.
- Reports: apply `20260811000000_event_reports.sql`; see `docs/moderation.md`.
- Deep links: `localevents://event/<id>` — see `docs/deep-links.md`.
- Schema foundation (5.2): apply `20260814000000_schema_foundation_5_2.sql` — see `docs/supabase-setup.md`.
- Backfill (5.3): apply `20260814010000_backfill_events_5_3.sql` after 5.2.

### Decisions behind phases 5–10

- Categories are a fixed set: Fashion, Crafts, Music, Wellness, Outdoors, Games, Food, History, Other (Other last in UI).
- Image moderation (6.2) uses a third-party moderation API, not manual review alone.
- Palette roles: `#1805DB` primary (white text safe, ~10:1); `#9B96FD` surfaces with dark ink only (fails on white, ~2.6:1); `#FDFD96` highlight with dark text only, never a full-screen background. Destructive red stays red.
- Google Maps is reached by redirecting to the user's own app (8.1), not by switching the in-app map provider.
- Privacy-label delta for Phase 10 is the moderation vendor disclosure only.
- Auth stays email/password in v1 (social deferred); Phase **7.4** covers forgot password, duplicate-email UX, and stronger passwords.
- Free events show price on cards like other prices; Free is **not** mixed into the category chip row — separate filter control in **9.4**.

### Known gaps to fix

- `report_event` hides an event on the **first** report with no unhide path — one user can permanently hide any event. Fixed in 6.5.
- Create form does not yet require description, price, venue, or address; the date picker renders below the map. Fixed in 9.1.
- No forgot-password flow; weak client password rule (≥6); duplicate-email errors are raw Supabase messages. Fixed in 7.4.
- Discover filter bar mixes Free with category chips. Fixed in 9.4.
