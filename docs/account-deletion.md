# Account deletion (Phase 1 / task 1.3)

App Store / privacy expectations require in-app account deletion. Clients cannot call `auth.admin.deleteUser` with the anon key, so deletion goes through a **Supabase Edge Function** that uses the service role after verifying the caller’s JWT.

## What the app does

1. Profile → **Delete account** → confirm dialog.
2. Calls `supabase.functions.invoke('delete-account')` with the user session.
3. On success, signs out locally (session is already invalid server-side).

`profiles` (and owned `events` / `event_images`) cascade when `auth.users` is deleted (see init migration `on delete cascade`).

## Deploy the Edge Function

### Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli) installed and logged in
- Project linked: `supabase link --project-ref <your-ref>`

### Deploy

```sh
cd /Users/ayeshadadabhoy/Desktop/local-events
supabase functions deploy delete-account
```

Hosted projects inject `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` for Edge Functions. Do **not** put the service role key in the Expo app or `.env` committed to git.

### Verify

```sh
# After signing in on device/simulator, or with a user JWT:
curl -i -X POST \
  "https://<PROJECT_REF>.supabase.co/functions/v1/delete-account" \
  -H "Authorization: Bearer <USER_ACCESS_TOKEN>" \
  -H "apikey: <EXPO_PUBLIC_SUPABASE_ANON_KEY>"
```

Expect `{ "ok": true }`. The user should no longer appear under **Authentication → Users**.

## Manual / dashboard fallback

If the function is not deployed yet:

1. Supabase Dashboard → **Authentication → Users** → delete the user.
2. Confirm `profiles` / events rows are gone (cascade).
3. In the app, **Sign out** (or reinstall) to clear the local session.

## Notes

- Deletion is irreversible.
- Nested storage folders under `event-images/{user_id}/...` may need a deeper cleanup later if you store multi-level paths; the function removes top-level objects in that folder as a best effort.
- Until the function is deployed, the in-app button will show an error from `functions.invoke` — that is expected.
