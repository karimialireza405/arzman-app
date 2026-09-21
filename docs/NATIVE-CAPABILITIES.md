# iPhone capabilities and delivery

The base project is React Native / Expo SDK 57; Windows runs Metro, typechecks, tests and Cloudflare local development. No local Swift or Xcode installation is required. EAS builds compile iOS remotely.

## Available code, device verification required

- `expo-glass-effect` uses native Liquid Glass when supported; other platforms use restrained blur. Readable content uses opaque cards.
- `expo-local-authentication` guards portfolio viewing and transaction entry, relocking on blur/background. Changing the setting requires device authentication. Face ID needs the permission configured in app.json and an EAS development build; Expo Go is not sufficient for testing that permission flow.
- `expo-secure-store` stores individual transactions in Keychain on iOS with `WHEN_UNLOCKED_THIS_DEVICE_ONLY`. This is not an end-to-end encrypted backup. Keychain persistence after uninstall can differ from app storage; no cloud sync is implemented.
- Expo SDK 57 release notes state App Store Expo Go approval was pending. Use a matching SDK 57 Expo Go only if available, or an EAS development build. Do not downgrade the app merely to match an older Expo Go.
- `expo-build-properties` opts into iOS scene support, required when SDK 57 is built with Xcode/iOS 27. The EAS native build is configured but has not been executed here.

## Widget adapter (planned, disabled)

`src/native-capabilities.ts` defines a versioned WidgetSnapshot. A future WidgetKit extension/config plugin must configure a shared App Group container, write only selected public quote data, and consume a timeline with explicit freshness. Small USD, medium four-currency, and Lock Screen USD layouts must respect WidgetKit refresh budgets. Never include portfolio data by default. App Group entitlements, extension bundle IDs, signing and device testing are required. Expo Go cannot host this extension.

## Live Activity adapter (planned, disabled)

The adapter supports start/update/end for one selected fiat currency. ActivityKit integration requires a native plugin/extension and device signing. It must display source/freshness and support ending the activity. Updates while suspended require the supported ActivityKit push mechanism and appropriate backend credentials; there is no permanent JavaScript polling service. Confirm current Apple lifecycle/budget constraints when implementing; do not hardcode a promise of unlimited updates.

## Siri / App Intents (planned, disabled)

The typed shortcut request supports a price request or conversion request. A future native App Intents bridge should use the same normalized cached snapshot, say when the price is stale and avoid portfolio exposure while locked. Target Persian phrases: «قیمت دلار چنده؟» and «۵۰۰ دلار چند تومن میشه؟». This needs native capability work and signing, isolated from the base app.

## Background alerts (planned, disabled)

Current alerts are persisted local rules evaluated only during foreground refresh on a fresh timestamped quote. Rules are one-shot until rearmed. Threshold, daily percentage and five-minute rapid movement are represented. No permission prompt promises background delivery.

For real push: add an explicit opt-in installation registration, push-token rotation/deletion, minimal rule upload (no portfolio), server-side scheduler, idempotent delivery records, cooldowns, receipt checks, abuse limits and APNs/Expo credentials stored as server secrets. Evaluate only authoritative fresh quotes. Add revocation and device tests before exposing an enabled background-alert setting.
