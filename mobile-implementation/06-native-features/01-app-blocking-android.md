# 01-app-blocking-android — App Blocking (Android)

Wrap the existing android/.../FocusModeService.java + FocusModePlugin.java + BootReceiver.java as an Expo Config Plugin. The plugin copies these Java files into the prebuild output, declares the AccessibilityService in AndroidManifest, requests USAGE_STATS + SYSTEM_ALERT_WINDOW + ACCESSIBILITY permissions. JS API: NativeModules.FocusMode.{requestPermissions, listInstalledApps, startBlocking(packageNames, durationMs), stopBlocking, isActive}. AccessibilityService listens for TYPE_WINDOW_STATE_CHANGED, checks current package against blocklist, if blocked launches BlockingOverlayActivity. Foreground service keeps the session alive.

## Permissions to declare (app.config.ts)

See the relevant Android permissions in 00-foundation/02-project-init.md.

## Fallback

Always check `Platform.OS` and feature-detect. If unavailable, hide the UI or show a graceful "Available on Android" message. Never crash.

## Acceptance
- [ ] Permission flow runs first time
- [ ] Feature works on real device (not just emulator where applicable)
- [ ] Denial path is graceful
