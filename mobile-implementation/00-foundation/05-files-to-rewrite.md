# 05 — Files to Rewrite (Full Port)

Anything that touches DOM, CSS classes that don't map cleanly, framer-motion, or HTML elements gets rewritten. The **logic** comes from the web file; the **rendering** is new.

## Pages (`src/pages/*.tsx` → `src/screens/*.tsx`)

ALL of them. Each gets its own dedicated doc in [`04-screens/`](../04-screens/). The pattern is:

1. Open the web page file
2. Identify the data hooks (often unchanged)
3. Identify the component tree
4. For each `<div>`, decide RN equivalent: `<View>`, `<ScrollView>`, `<FlatList>`, `<Pressable>`
5. Convert `className=` strings to Nativewind (most work — see [`_APPENDIX/C-css-to-style-map.md`](../_APPENDIX/C-css-to-style-map.md))
6. Replace `framer-motion` with `moti` or Reanimated
7. Replace HTML form elements with our RN primitives

## Components (`src/components/**`)

ALL of them. See [`05-shared-components/`](../05-shared-components/) for per-folder porting notes.

## Special-case rewrites

| Web file | RN approach |
|---|---|
| `App.tsx` | Becomes `App.tsx` + `src/navigation/RootNavigator.tsx`. React Router → React Navigation. |
| `main.tsx` | Becomes Expo's auto-registered `App.tsx`. Delete `index.html`. |
| `components/layout/AppLayout.tsx` | RN version uses `SafeAreaProvider` + custom header bar. |
| `components/layout/BottomNav.tsx` | Bottom Tab Navigator (see [`03-navigation/02-bottom-nav-port.md`](../03-navigation/02-bottom-nav-port.md)). |
| `components/ui/*.tsx` (shadcn) | Each rewritten — see [`05-shared-components/01-ui-primitives.md`](../05-shared-components/01-ui-primitives.md). |
| `components/documents/PDFViewer.tsx` | `react-native-pdf` (much simpler than web). |
| `components/documents/DOCXViewer.tsx` | Use edge function to convert DOCX→HTML, render via `react-native-render-html`. |
| `components/export/ExportUtils.tsx` | Use `react-native-html-to-pdf` for HD mode + `expo-print` for fast mode. |
| `components/ads/GoogleAdBanner.tsx` | `react-native-google-mobile-ads`. |
| `components/pwa/*` | Delete. PWA concepts don't exist in RN. |
| `components/safety/OfflineMode.tsx` | Native: simply gate features by `useOfflineStatus`. |
| `index.css` | Becomes `src/global.css` (only Tailwind directives) + `src/theme/tokens.ts` (the HSL values as TS constants). |

## Things to delete entirely

- `vite.config.ts`, `index.html`, `public/` (except icons → `assets/`)
- `src/components/pwa/`
- Any `<Helmet>` or `react-helmet-async` usage — RN has no `<head>`
- `next-themes` storage layer — keep the API but back it with MMKV

## Acceptance

- [ ] No file in the mobile project imports from `react-dom`, `react-router-dom`, `framer-motion`, or `next-themes`
- [ ] No `.css` files except `src/global.css`
- [ ] No `<div>`, `<span>`, `<button>` elements anywhere
