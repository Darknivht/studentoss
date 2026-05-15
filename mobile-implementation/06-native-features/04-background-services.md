# 04-background-services — Background Tasks

expo-task-manager + expo-background-fetch. Tasks: streakReminderTask (checks if user studied today, fires local notif at 7pm if not), syncOfflineNotesTask (every 15min when online). Define tasks at module top-level.

## Permissions to declare (app.config.ts)

See the relevant Android permissions in 00-foundation/02-project-init.md.

## Fallback

Always check `Platform.OS` and feature-detect. If unavailable, hide the UI or show a graceful "Available on Android" message. Never crash.

## Acceptance
- [ ] Permission flow runs first time
- [ ] Feature works on real device (not just emulator where applicable)
- [ ] Denial path is graceful
