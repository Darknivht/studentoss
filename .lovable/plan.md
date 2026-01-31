

# Focus Mode & App Blocking System Implementation Plan

## Overview

This plan implements a comprehensive app blocking system that combines React UI with native Capacitor functionality. The system consists of two parts:
- **Frontend (Lovable/React):** Handles UI, timer logic, blocked apps database, and gamification
- **Native (Capacitor Plugin):** Monitors usage, detects blocked apps, and forces them closed

---

## Phase 1: Database Schema

### New Tables

**Table: `focus_sessions`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| user_id | UUID | References auth.users |
| start_time | timestamp | Session start |
| end_time | timestamp | Session end (nullable) |
| target_duration_minutes | integer | Planned duration |
| actual_duration_minutes | integer | Actual time focused |
| status | text | 'active', 'completed', 'failed', 'paused' |
| blocked_apps | jsonb | Array of package names blocked |
| created_at | timestamp | Default now() |

**Table: `blocked_app_list`**
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| user_id | UUID | References auth.users |
| package_name | text | e.g., 'com.instagram.android' |
| app_name | text | e.g., 'Instagram' |
| app_icon | text | Emoji or base64 icon |
| is_active | boolean | Whether currently blocking |
| created_at | timestamp | Default now() |

**RLS Policies:**
- Users can only view/insert/update/delete their own records

---

## Phase 2: Capacitor Plugin Interface

### Create: `src/plugins/FocusModePlugin.ts`

TypeScript interface defining communication with native code:

```text
┌──────────────────────────────────────────┐
│         FocusModePlugin Interface        │
├──────────────────────────────────────────┤
│ checkPermissions()                       │
│ requestPermissions()                     │
│ getInstalledApps()                       │
│ startBlocking(packages, duration)        │
│ stopBlocking()                           │
│ isBlocking()                             │
│ addBlockingListener()                    │
│ enterKioskMode()                         │
│ exitKioskMode()                          │
└──────────────────────────────────────────┘
```

Methods:
- `checkPermissions()` - Check if required permissions granted
- `requestPermissions()` - Request USAGE_STATS, OVERLAY permissions
- `getInstalledApps()` - Returns installed apps with name, package, icon
- `startBlocking(options)` - Start blocking with package list & duration
- `stopBlocking()` - Stop blocking immediately
- `isBlocking()` - Returns current blocking status
- `addBlockingListener()` - Listen for blocked app detection events
- `enterKioskMode()` / `exitKioskMode()` - Android kiosk mode control

---

## Phase 3: React Hooks

### Create: `src/hooks/useFocusLock.ts`

Central hook for focus mode management:

```text
┌─────────────────────────────────────────────┐
│              useFocusLock Hook              │
├─────────────────────────────────────────────┤
│ State:                                      │
│  - isLocked: boolean                        │
│  - isBlocking: boolean                      │
│  - permissionsGranted: boolean              │
│  - platform: 'android' | 'ios' | 'web'      │
│  - blockedAppDetected: string | null        │
│                                             │
│ Methods:                                    │
│  - checkPermissions()                       │
│  - requestPermissions()                     │
│  - startFocusSession(apps, duration)        │
│  - endFocusSession()                        │
│  - emergencyExit(pin)                       │
│                                             │
│ Integration:                                │
│  - Links to useStudyTimeTracker             │
│  - Saves sessions to Supabase               │
│  - Auto-unlocks when goal met               │
└─────────────────────────────────────────────┘
```

### Modify: `src/hooks/useStudyTimeTracker.ts`

Add focus session integration:
- Track focus sessions alongside other activities
- Emit events when daily goal is met
- Provide callback for auto-unlock trigger

---

## Phase 4: UI Components

### Create: `src/components/focus/AppSelector.tsx`

App selection interface with two modes:
1. **Native mode (Android):** Fetches real installed apps via plugin
2. **Web fallback:** Shows popular apps from predefined list

Features:
- Grid display of apps with icons
- Search/filter functionality
- Toggle selection for each app
- Sync selected apps to database

### Create: `src/components/focus/BlockingOverlay.tsx`

Full-screen overlay shown when blocked app detected:
- Motivational message
- Current session timer
- Study goal progress bar
- "Return to Focus" button
- Emergency exit (hidden, requires PIN)

### Create: `src/components/focus/PermissionsSetup.tsx`

Step-by-step permissions wizard:
- Platform detection (Android/iOS/Web)
- Permission status indicators
- Deep links to system settings
- iOS Guided Access instructions

### Create: `src/pages/FocusSession.tsx`

Dedicated focus session page:
- Active session display
- Blocked apps list
- Real-time timer
- Session controls (pause/resume/end)
- Stats after completion

### Modify: `src/components/settings/AppBlockerSettings.tsx`

Enhance existing component:
- Add native app selection when available
- Add permissions setup section
- Add parent PIN configuration
- Show platform-specific features

---

## Phase 5: Safety Features

### Parent PIN System

Stored in profiles table or localStorage (encrypted):
- 4-6 digit PIN for emergency exit
- Required for:
  - Ending focus session early
  - Disabling app blocker
  - Exiting kiosk mode

### Emergency Exit Mechanisms

1. Triple-tap hidden area shows PIN prompt
2. Timeout auto-unlock (max 4 hours)
3. Parent PIN override
4. Force-stop detection (session marked as 'failed')

---

## Phase 6: Native Android Implementation

### Files to Create (Template/Instructions)

**`android/app/src/main/java/com/studentoss/app/FocusModePlugin.java`**
- Capacitor plugin registration
- Methods matching TypeScript interface
- Background service management

**`android/app/src/main/java/com/studentoss/app/FocusModeService.java`**
- Foreground service for continuous monitoring
- UsageStatsManager integration
- Overlay window management

### AndroidManifest.xml Updates

Required permissions:
```text
┌────────────────────────────────────────────┐
│           Android Permissions              │
├────────────────────────────────────────────┤
│ PACKAGE_USAGE_STATS - Monitor running apps │
│ SYSTEM_ALERT_WINDOW - Draw over other apps │
│ FOREGROUND_SERVICE  - Background running   │
│ RECEIVE_BOOT_COMPLETED - Auto-start        │
│ VIBRATE - Notification feedback            │
└────────────────────────────────────────────┘
```

### Blocking Logic Flow

```text
User starts focus → Service begins → Loop every 500ms:
     │
     ▼
┌─────────────────────────────────────┐
│ Get current foreground app          │
│ using UsageStatsManager             │
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│ Is app in blocked list?             │
└─────────────────────────────────────┘
     │ YES                    │ NO
     ▼                        ▼
┌─────────────────────┐   ┌─────────────────────┐
│ Launch StudentOss   │   │ Continue monitoring │
│ with blocking       │   └─────────────────────┘
│ overlay route       │
└─────────────────────┘
```

---

## Phase 7: iOS Implementation Notes

iOS is highly restrictive. The implementation will:

1. **Show Guided Access instructions**
   - Step-by-step guide in app
   - Deep link to Settings when possible

2. **Screen Time API (future)**
   - Requires Family Controls entitlement
   - Apple Developer account approval needed
   - DeviceActivityMonitor extension

For now, focus on Android + provide iOS instructions.

---

## Phase 8: Integration Points

### Pomodoro Timer Integration

Modify `src/components/study/PomodoroTimer.tsx`:
- Add "Enable App Blocking" toggle
- Start focus session when timer starts (if enabled)
- Stop blocking on break or completion

### Route Protection

Add `/blocking-overlay` route to App.tsx:
- Native code opens this route when blocked app detected
- Shows BlockingOverlay component
- No navigation back until session ends

### App Lifecycle

Handle app state changes:
- Resume monitoring when app foregrounded
- Continue blocking when app backgrounded
- Persist session state across restarts

---

## Files Summary

### New Files (9)
| File | Purpose |
|------|---------|
| `src/plugins/FocusModePlugin.ts` | Capacitor plugin interface |
| `src/hooks/useFocusLock.ts` | Focus mode state management |
| `src/components/focus/AppSelector.tsx` | App selection UI |
| `src/components/focus/BlockingOverlay.tsx` | Block screen overlay |
| `src/components/focus/PermissionsSetup.tsx` | Permission wizard |
| `src/pages/FocusSession.tsx` | Active session page |
| `android/app/.../FocusModePlugin.java` | Native plugin (template) |
| `android/app/.../FocusModeService.java` | Background service (template) |
| Database migration | focus_sessions + blocked_app_list tables |

### Modified Files (6)
| File | Changes |
|------|---------|
| `src/hooks/useStudyTimeTracker.ts` | Add focus session integration |
| `src/components/settings/AppBlockerSettings.tsx` | Add native features |
| `src/components/study/PomodoroTimer.tsx` | Add blocking toggle |
| `src/pages/Focus.tsx` | Add quick access to new features |
| `src/App.tsx` | Add /blocking-overlay route |
| `android/.../AndroidManifest.xml` | Add required permissions |

---

## Technical Considerations

### Web Fallback
When running in browser (not native):
- Show overlay reminders only
- Cannot actually block apps
- Track "intended" focus time

### Platform Detection
```text
Capacitor.isNativePlatform() → true = Android/iOS
Capacitor.getPlatform() → 'android' | 'ios' | 'web'
```

### Data Flow
```text
┌─────────────────────────────────────────────────────────────┐
│                      Data Flow                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  User selects apps → blocked_app_list (Supabase)            │
│                              │                              │
│                              ▼                              │
│  User starts focus → focus_sessions (Supabase)              │
│                              │                              │
│                              ▼                              │
│  Native plugin receives → startBlocking(packages)          │
│                              │                              │
│                              ▼                              │
│  Blocked app detected → BlockingOverlay route              │
│                              │                              │
│                              ▼                              │
│  Session ends → Update focus_sessions, award XP             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Post-Implementation Notes

After code export, the user must:
1. Run `npx cap sync android`
2. Open Android Studio: `npx cap open android`
3. Complete the Java code for FocusModePlugin
4. Grant permissions on first run
5. Test on physical device (emulator has limitations)

