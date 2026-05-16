# app-blocking-android — Android App Blocking

## Goal
Block selected apps during a Focus session by drawing a system overlay over them.

## Mechanism
1. **`PACKAGE_USAGE_STATS`** permission (Settings → Apps with usage access) — needed to detect foreground app.
2. **`SYSTEM_ALERT_WINDOW`** — draw overlay.
3. **`BIND_ACCESSIBILITY_SERVICE`** — react to app launches in real-time (more reliable than polling UsageStats).
4. **Foreground service** — keep blocking active even when StudentOS is backgrounded.

## Implementation as Expo Config Plugin

Create `src/plugins/focus-mode-plugin/index.ts`:

```ts
import { withAndroidManifest, withDangerousMod } from 'expo/config-plugins';
import fs from 'fs'; import path from 'path';

export default function withFocusMode(config) {
  config = withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    // add permissions
    const perms = ['PACKAGE_USAGE_STATS', 'SYSTEM_ALERT_WINDOW',
                   'FOREGROUND_SERVICE', 'POST_NOTIFICATIONS'];
    manifest['uses-permission'] = perms.map(p => ({ $: { 'android:name': `android.permission.${p}` }}));
    // add service + accessibility service to <application>
    const app = manifest.application[0];
    app.service = [
      { $: { 'android:name': '.FocusForegroundService', 'android:foregroundServiceType':'specialUse' }},
      { $: { 'android:name': '.FocusAccessibilityService',
             'android:permission':'android.permission.BIND_ACCESSIBILITY_SERVICE'},
        'intent-filter': [{ action: [{ $:{'android:name':'android.accessibilityservice.AccessibilityService'}}]}],
        'meta-data': [{ $:{'android:name':'android.accessibilityservice','android:resource':'@xml/focus_accessibility'}}]},
    ];
    return cfg;
  });
  config = withDangerousMod(config, ['android', (cfg) => {
    // copy Java files into android/app/src/main/java/com/studentoss/app/
    const src = path.join(__dirname, 'android');
    const dest = path.join(cfg.modRequest.platformProjectRoot,
                           'app/src/main/java/com/studentoss/app');
    copyRecursive(src, dest);
    return cfg;
  }]);
  return config;
}
```

You already have the Java sources at `android/app/src/main/java/com/studentoss/app/` (web project). Reuse them.

## Native module bridge

Create `FocusModeModule.kt` exposing:
- `requestUsageStatsPermission(): Promise<boolean>`
- `requestOverlayPermission(): Promise<boolean>`
- `requestAccessibilityPermission(): Promise<boolean>`
- `startBlocking(packageNames: ReadableArray): Promise<void>`
- `stopBlocking(): Promise<void>`
- `getInstalledApps(): Promise<Array<{packageName, label, icon}>>`
- `getUsageStats(start: Double, end: Double): Promise<Array<{packageName, totalMs}>>`

Register via `ReactPackage` or autolinking through the Expo module API (`ExpoModulesCore` is easier).

## RN wrapper

`src/native/focusMode.ts`:
```ts
import { requireNativeModule } from 'expo-modules-core';
const Focus = requireNativeModule('FocusMode');
export const focusMode = {
  startBlocking: (apps: string[]) => Focus.startBlocking(apps),
  stopBlocking: () => Focus.stopBlocking(),
  getInstalledApps: () => Focus.getInstalledApps(),
  // ...
};
```

## Acceptance
- [ ] User can grant all 3 permissions through guided flow
- [ ] Selecting an app and starting focus blocks it within 500ms of launch attempt
- [ ] Foreground service notification reads 'Focus Mode active — {N} apps blocked'
- [ ] Stopping session removes overlay immediately

