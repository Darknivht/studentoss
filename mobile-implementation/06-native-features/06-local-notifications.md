# 06-local-notifications — Local Notifications

Notifications.scheduleNotificationAsync with calendar trigger. Streak reminder daily 7pm. Daily quiz teaser 7am. Pomodoro session-end. User can toggle each in Settings.

## Permissions to declare (app.config.ts)

See the relevant Android permissions in 00-foundation/02-project-init.md.

## Fallback

Always check `Platform.OS` and feature-detect. If unavailable, hide the UI or show a graceful "Available on Android" message. Never crash.

## Acceptance
- [ ] Permission flow runs first time
- [ ] Feature works on real device (not just emulator where applicable)
- [ ] Denial path is graceful
