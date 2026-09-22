# Agent instructions — local-events

## Expo / docs

- This app targets **Expo SDK 54**. Before using native or Expo APIs, read the matching docs: https://docs.expo.dev/versions/v54.0.0/
- Prefer `npx expo install` for Expo-compatible dependency versions.

## Mac preview

- **Preferred day-to-day preview:** iOS Simulator on this Mac (`npm run ios`). See `docs/dev-preview.md`.
- Product is **iOS**, not a macOS desktop app. Do not add Catalyst/macOS App Store scope in v1.
- Physical Expo Go is optional; web is layout-only fallback.

## Multi-session handoff

- Read **PROGRESS.md** at the start of every session.
- Implement **only the single task ID** assigned for that session. Do not start other tasks.
- When the task is done: update **PROGRESS.md** and **docs/session-log.md**, then **STOP**.
- If the current phase’s tasks are all complete: **ask the user** whether to proceed to the next phase. Do not start it.

## Product locks (v1)

- GPS any-city discovery.
- Users must set `is_organizer` to publish events.
- Out of scope for v1: tickets, RSVP, push notifications, Android store submission, macOS desktop target.
