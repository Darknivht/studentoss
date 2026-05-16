# usage-stats-tracking — Usage Stats Tracking

## Goal
Track time spent in other apps (for parental dashboard + weakness detection) without requiring constant foreground.

## Android
Use `UsageStatsManager.queryUsageStats(INTERVAL_DAILY, startTime, endTime)`.
Returns per-package foreground time. Requires `PACKAGE_USAGE_STATS` permission (system settings).

Wrap in native module method `getUsageStats(startMs, endMs)`.

Schedule a daily sync via `expo-background-fetch` task: query last 24h, upsert to `supabase.from('usage_stats')`.

## iOS
Cannot read other apps' usage. Use `DeviceActivityReport` (FamilyControls) to render a SwiftUI view INSIDE your app showing aggregate categories — but raw numbers per-app are not accessible to JS.

Alternative on iOS: rely on Screen Time API summaries (opaque) and only show 'focus minutes' tracked within StudentOS itself.

## Storage
```sql
create table usage_stats (
  user_id uuid references auth.users on delete cascade,
  date date,
  package_name text,
  total_ms bigint,
  category text,
  primary key (user_id, date, package_name)
);
```

## Privacy
- Show clear consent screen before requesting
- Allow user to delete all usage data anytime
- Never share with third parties

## Acceptance
- [ ] Daily background sync runs
- [ ] Parent dashboard renders charts from `usage_stats`
- [ ] Delete-all wipes records

