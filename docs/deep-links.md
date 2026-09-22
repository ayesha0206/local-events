# Deep links (Phase 4 / task 4.3)

Event detail opens from custom-scheme URLs. Scheme is set in `app.json`:

```json
"scheme": "localevents"
```

Canonical share links look like:

```text
localevents://event/<event-id>
```

Built via `eventShareUrl` in `lib/deep-links.ts` (`expo-linking` `createURL` with the `localevents` scheme). Incoming URLs are normalized in `app/+native-intent.ts` so both `localevents://event/<id>` and `localevents:///event/<id>` land on `app/event/[id].tsx`.

Universal Links / App Links (https) are out of scope for v1 (see Phase 5).

## Test on iOS Simulator

### Expo Go (day-to-day)

With Metro running (`npm run ios`), open a path inside Expo Go:

```sh
# Replace host/port if Metro printed a different URL
npx uri-scheme open "exp://127.0.0.1:8081/--/event/1" --ios
```

Mock fixture id `1` works without Supabase. Live UUIDs work when the event is published and not hidden.

### Custom scheme (development / production build)

After a native binary that embeds `localevents` (`npm run ios:native` or EAS):

```sh
npx uri-scheme open "localevents://event/1" --ios
# or
xcrun simctl openurl booted "localevents://event/1"
```

## Share sheet

Event detail → **Share** includes the canonical `localevents://event/…` URL in the message.
