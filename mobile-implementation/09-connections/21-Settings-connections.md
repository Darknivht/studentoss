# Settings — Connections

**Web source**: settings live inside `src/pages/Profile.tsx` (Settings tab) and `src/components/settings/*`.
**Mobile target**: `mobile/src/screens/SettingsScreen.tsx`

## Imports in web (action per import)

| Web import | Action |
|---|---|
| `@/integrations/supabase/client` | COPY (via mobile adapter) |
| `@/hooks/useAuth` | ADAPT (mobile version) |
| `@/hooks/useSubscription` | COPY verbatim |
| `@/components/settings/AccountSection` | PORT UI |
| `@/components/settings/NotificationSettings` | REWRITE (expo-notifications) |
| `@/components/settings/ThemeToggle` | REWRITE (Appearance API + AsyncStorage) |
| `@/components/settings/DataExport` | PORT UI + rewrite download (expo-file-system) |
| `next-themes` | REWRITE (custom ThemeContext) |
| `@/components/ui/*` | PORT via NativeWind primitives |

## Sub-components to build

- `SettingsSection` (grouped list card)
- `SettingsRow` (label + control)
- `ThemeSwitcher` (system/light/dark)
- `NotificationToggleGroup`
- `LanguagePicker`
- `DangerZone` (sign out, delete account)

## Data / services

- `supabase.auth.signOut()`
- `supabase.from('profiles').update(...)`
- `supabase.from('user_settings').upsert(...)` (if used)
- expo-notifications permission + schedule cancel
- AsyncStorage for theme + prefs

## Verbatim Tailwind classes to preserve (mine from `Profile.tsx`)

- Section header: `text-sm font-semibold text-muted-foreground uppercase tracking-wider`
- Row: `flex items-center justify-between p-4 rounded-2xl bg-card border border-border`
- Danger row: `text-destructive`
- Container: `space-y-6 px-4 pb-24`

NativeWind mapping: identical class strings — verify tokens exist in `mobile/tailwind.config.js`.

## 12-step build order

1. Create `SettingsScreen.tsx` scaffold with SafeAreaView + ScrollView.
2. Add route to `RootNavigator` (stack push from Profile).
3. Wire `useAuth` + `useSubscription`.
4. Build `SettingsSection` + `SettingsRow` primitives.
5. Account section: email, full name (read-only from profiles).
6. Subscription section: tier + Manage button → Upgrade screen.
7. Theme switcher: system/light/dark, persist to AsyncStorage.
8. Notification settings: request permissions, toggle daily reminder, streak reminder.
9. Privacy links: Privacy / Terms screens.
10. Data export: fetch user data as JSON, save via `expo-sharing`.
11. Danger zone: sign out (with confirm), delete account (edge function call).
12. Test on device: theme persistence, notifications fire, sign out returns to Auth.

## Related files

- Screen doc: `../04-screens/21-Settings.md`
- Native notif module: `../06-native-features/06-local-notifications.md`
