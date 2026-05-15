# 01 — Stack Decisions

Every package and version is locked here. Do not deviate without updating this doc.

## Core

| Package | Version | Why |
|---|---|---|
| `expo` | `~52.0.0` | Managed workflow + EAS Build + config plugins. Custom dev client needed for native focus module. |
| `react-native` | `0.76.x` | New Architecture (Fabric + TurboModules) on. Required for modern reanimated perf. |
| `react` | `18.3.x` | Matches web app. |
| `typescript` | `~5.3.x` | Matches `tsconfig.app.json` from web. |

## Styling

| Package | Why |
|---|---|
| `nativewind` `^4` | Tailwind class names in RN. Mirrors `tailwind.config.ts` so 90% of web class strings work unchanged. |
| `tailwindcss` `^3.4` | Required by Nativewind. |
| `expo-linear-gradient` | Replaces `bg-gradient-to-br` from Tailwind. |

## Animation

| Package | Why |
|---|---|
| `react-native-reanimated` `^3.16` | Worklet animations on UI thread. |
| `react-native-gesture-handler` | Required peer of reanimated. |
| `moti` `^0.29` | Framer-motion-style API on top of reanimated. Drop-in for `<motion.div>`. |

## Navigation

| Package | Why |
|---|---|
| `@react-navigation/native` `^7` | Standard. |
| `@react-navigation/native-stack` | Native push/pop transitions. |
| `@react-navigation/bottom-tabs` | Bottom tab bar. |
| `react-native-screens`, `react-native-safe-area-context` | Required peers. |

## State / Data

| Package | Why |
|---|---|
| `@tanstack/react-query` `^5` | Same as web. Hooks port verbatim. |
| `@supabase/supabase-js` `^2` | Same client. |
| `@react-native-async-storage/async-storage` | Storage adapter for Supabase auth. |
| `react-native-mmkv` `^3` | Fast sync KV for caches, draft autosave, theme. |
| `expo-secure-store` | Sensitive tokens (OAuth refresh, parental PIN). |

## UI primitives

We do **not** use a UI kit (no Tamagui / Paper / NativeBase). Instead we hand-port each shadcn primitive into a thin RN component using Nativewind. This keeps the API identical to web and avoids design drift.

Exception: complex pickers — `@react-native-community/datetimepicker`, `react-native-bottom-sheet`.

## Icons

`lucide-react-native` — same icon names as web.

## Math / Markdown

| Package | Why |
|---|---|
| `react-native-math-view` | KaTeX rendering for AI Tutor / quiz explanations. |
| `react-native-markdown-display` | Renders markdown with custom rule for `$$ ... $$` math. |

## Files / Media

| Package | Why |
|---|---|
| `expo-document-picker` | Note file uploads. |
| `expo-image-picker` | Avatar + chat media. |
| `expo-camera` | Book scanner, OCR. |
| `expo-file-system` | Local file IO. |
| `react-native-pdf` | PDF viewer. |
| `expo-av` | Lofi radio audio playback. |

## Native-only

| Package | Why |
|---|---|
| `expo-notifications` | Push + scheduled local. |
| `expo-task-manager` + `expo-background-fetch` | Background streak checks. |
| `expo-haptics` | Tap feedback. |
| `expo-linking` | Deep links + OAuth. |
| `expo-updates` | OTA JS pushes. |
| Custom Expo Config Plugin | App blocking, usage stats (see `06-native-features/`). |

## Payments

`react-native-paystack-webview` — wraps Paystack popup as a webview. Same `useSubscription` hook works.

## Why not Capacitor / Tauri / Ionic?

Capacitor wraps the web app in a webview. App blocking via AccessibilityService and `UsageStatsManager` requires direct Android Java/Kotlin access — possible from a Capacitor plugin, but performance is bad (the webview blocks the UI thread). RN gives us a true native UI thread plus easier path to platform widgets, foreground services, and lock-screen surfaces.
