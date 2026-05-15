# 03-usage-stats-tracking — Usage Stats

Android UsageStatsManager.queryUsageStats(INTERVAL_DAILY, start, end) returns per-app foreground time. Expose via native module getUsageStats(days). Used by Focus screen 'Last 7 days' chart and ParentDashboard. iOS: not available — show 'Available on Android only'.

## Permissions to declare (app.config.ts)

See the relevant Android permissions in 00-foundation/02-project-init.md.

## Fallback

Always check `Platform.OS` and feature-detect. If unavailable, hide the UI or show a graceful "Available on Android" message. Never crash.

## Acceptance
- [ ] Permission flow runs first time
- [ ] Feature works on real device (not just emulator where applicable)
- [ ] Denial path is graceful
