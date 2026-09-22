# Dev preview on this MacBook

This product is an **iOS** app. On a Mac, the native way to preview it is **Apple’s iOS Simulator** (Simulator.app via Xcode)—not a separate macOS desktop app, and not required to use Expo Go on a physical phone.

## Preferred: iOS Simulator

```sh
cd /Users/ayeshadadabhoy/Desktop/local-events
npm run ios
```

That starts Metro and opens the app in Simulator. For early phases, Expo Go **inside** Simulator is fine.

### One-time setup

1. **Xcode** installed (Mac App Store).
2. **iOS Simulator runtime** installed:
   - Xcode → **Settings…** → **Platforms** → download **iOS**, or
   - Terminal: `xcodebuild -downloadPlatform iOS` (large download).
3. Confirm devices: `xcrun simctl list devices available`
4. If the list is empty after download, open Simulator once: `open -a Simulator`

### Optional: native binary in Simulator (no Expo Go)

Closer to a production iOS binary; needs CocoaPods and a generated `ios/` folder:

```sh
brew install cocoapods   # if `pod` is missing
npm run ios:native       # expo run:ios
```

## Fallbacks

| Command | Use |
| --- | --- |
| `npm run web` | Quick layout in a browser — **not** for location/maps fidelity |
| Expo Go on iPhone | Optional real-device check |

## Location in Simulator

Simulator can use a **simulated** location: Simulator menu → **Features** → **Location**. Real GPS behavior still needs a phone later.

## Deep links

Event detail: `localevents://event/<id>` (scheme in `app.json`). How to test in Simulator / Expo Go: [`docs/deep-links.md`](./deep-links.md).
