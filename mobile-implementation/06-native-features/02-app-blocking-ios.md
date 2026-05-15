# 02-app-blocking-ios — App Blocking (iOS)

iOS doesn't allow blocking arbitrary apps. Use Screen Time / FamilyControls framework (iOS 16+, requires user authorization + Family Controls entitlement from Apple). Limited to managed profiles. Alternative: just show focus timer, rely on iOS built-in Screen Time API to set a Shield. Document the gap clearly to the user.

## Permissions to declare (app.config.ts)

See the relevant Android permissions in 00-foundation/02-project-init.md.

## Fallback

Always check `Platform.OS` and feature-detect. If unavailable, hide the UI or show a graceful "Available on Android" message. Never crash.

## Acceptance
- [ ] Permission flow runs first time
- [ ] Feature works on real device (not just emulator where applicable)
- [ ] Denial path is graceful
