# 05-push-notifications — Push Notifications

expo-notifications. Request permission. Get Expo push token. Save to profiles.expo_push_token (add column via migration in web repo). Edge function admin-broadcast can send via Expo Push API. Channels (Android): default, streaks, daily-quiz, focus.

## Permissions to declare (app.config.ts)

See the relevant Android permissions in 00-foundation/02-project-init.md.

## Fallback

Always check `Platform.OS` and feature-detect. If unavailable, hide the UI or show a graceful "Available on Android" message. Never crash.

## Acceptance
- [ ] Permission flow runs first time
- [ ] Feature works on real device (not just emulator where applicable)
- [ ] Denial path is graceful
