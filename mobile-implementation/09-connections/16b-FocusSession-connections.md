# Connections — `FocusSession`

> Web source: `src/pages/FocusSession.tsx`  
> Mobile spec: `mobile-implementation/04-screens/16b-FocusSession.md`

This file is a complete build sheet: every file the page touches, what to do with it on React Native (Expo), and the exact build order.

## 1. Backend touchpoints

- **DB tables**: _none_
- **Edge functions**: _none_
- **Storage buckets**: _none_

All three are reused **as-is** — the RN app talks to the same Supabase project via the AsyncStorage-backed client (`02-infrastructure/01-supabase-client.md`).

## 2. Every import in the web page → RN action

| Import | Action | What to do |
|---|---|---|
| `react` | **KEEP** | Third-party package — install RN-compatible version if available. |
| `framer-motion` | **REWRITE** | Swap to `moti`: motion.div→MotiView, animate→animate prop, AnimatePresence→AnimatePresence from moti. |
| `lucide-react` | **REWRITE** | Swap to `lucide-react-native` — identical API. |
| `@/components/ui/button` | **REWRITE** | shadcn → custom RN primitive in `src/components/ui/` using NativeWind + class-variance-authority. See 05-shared-components/01-ui-primitives.md. |
| `@/components/ui/progress` | **REWRITE** | shadcn → custom RN primitive in `src/components/ui/` using NativeWind + class-variance-authority. See 05-shared-components/01-ui-primitives.md. |
| `@/components/ui/card` | **REWRITE** | shadcn → custom RN primitive in `src/components/ui/` using NativeWind + class-variance-authority. See 05-shared-components/01-ui-primitives.md. |
| `@/components/ui/slider` | **REWRITE** | shadcn → custom RN primitive in `src/components/ui/` using NativeWind + class-variance-authority. See 05-shared-components/01-ui-primitives.md. |
| `@/components/ui/badge` | **REWRITE** | shadcn → custom RN primitive in `src/components/ui/` using NativeWind + class-variance-authority. See 05-shared-components/01-ui-primitives.md. |
| `@/components/ui/dialog` | **REWRITE** | shadcn → custom RN primitive in `src/components/ui/` using NativeWind + class-variance-authority. See 05-shared-components/01-ui-primitives.md. |
| `@/hooks/useFocusLock` | **COPY** | Most hooks copy verbatim (they call supabase + react state). Drop `use-mobile.tsx` (web-only). `useMobileBackNavigation` → replace with React Navigation's useFocusEffect + BackHandler. |
| `@/components/focus/AppSelector` | **REWRITE+NATIVE** | Focus blocking requires Android UsageStatsManager + AccessibilityService (06-native-features/01,03). |
| `@/components/focus/PermissionsSetup` | **REWRITE+NATIVE** | Focus blocking requires Android UsageStatsManager + AccessibilityService (06-native-features/01,03). |
| `@/hooks/use-toast` | **COPY** | Most hooks copy verbatim (they call supabase + react state). Drop `use-mobile.tsx` (web-only). `useMobileBackNavigation` → replace with React Navigation's useFocusEffect + BackHandler. |

Legend: **COPY** = paste verbatim · **PORT** = same logic, swap UI primitives · **REWRITE** = different RN library · **DROP** = not needed on mobile · **KEEP** = npm package, install RN-friendly variant.

## 3. Sub-components to (re)create for this screen

- `src/components/focus/AppSelector.tsx` ✅ exists in web → create `mobile/src/components/focus/AppSelector.tsx`
- `src/components/focus/PermissionsSetup.tsx` ✅ exists in web → create `mobile/src/components/focus/PermissionsSetup.tsx`

## 4. Hooks needed (mostly copy verbatim)

- `src/hooks/useFocusLock.ts` — copy to `mobile/src/hooks/useFocusLock.ts`. If it imports `localStorage` or `window`, replace with `AsyncStorage` / `Platform`.
- `src/hooks/use-toast.ts` — copy to `mobile/src/hooks/use-toast.ts`. If it imports `localStorage` or `window`, replace with `AsyncStorage` / `Platform`.

## 5. UI primitives required (build once, reuse)

- `button` — implement in `mobile/src/components/ui/button.tsx` per `05-shared-components/01-ui-primitives.md`.
- `progress` — implement in `mobile/src/components/ui/progress.tsx` per `05-shared-components/01-ui-primitives.md`.
- `card` — implement in `mobile/src/components/ui/card.tsx` per `05-shared-components/01-ui-primitives.md`.
- `slider` — implement in `mobile/src/components/ui/slider.tsx` per `05-shared-components/01-ui-primitives.md`.
- `badge` — implement in `mobile/src/components/ui/badge.tsx` per `05-shared-components/01-ui-primitives.md`.
- `dialog` — implement in `mobile/src/components/ui/dialog.tsx` per `05-shared-components/01-ui-primitives.md`.

## 6. Step-by-step build order (do these in sequence)

1. **Prereqs** — ensure the foundations are done: `00-foundation`, design tokens (`01-design-system`), Supabase client (`02-infrastructure/01`), navigation shell (`03-navigation`).
2. **Create the screen file** — `mobile/src/screens/FocusSessionScreen.tsx`. Start from the matching `04-screens/16b-FocusSession.md` layout tree.
3. **Copy hooks & lib** listed in §4 into `mobile/src/hooks/` and `mobile/src/lib/`. Do not modify Supabase calls.
4. **Build any missing UI primitives** from §5 first — they are reused by other screens.
5. **Port each sub-component in §3** one at a time. Test each in isolation (Storybook-style — render it on a blank screen).
6. **Wire imports** — for every row in §2 with action REWRITE, replace the import line using the rule in the right column.
7. **Replace JSX primitives**: `div→View`, `span/p→Text`, `button→Pressable`, `input→TextInput`, `img→Image (expo-image)`, `a→Pressable` + `navigation.navigate`.
8. **Replace Tailwind classes** — keep the className string verbatim; NativeWind v4 understands the same tokens. Anything unsupported (hover:, focus-visible:, group-*) is dropped (see `_APPENDIX/C-css-to-style-map.md`).
9. **Replace navigation** — `useNavigate()` → `useNavigation()`, `useParams()` → `useRoute().params`, `<Link to>` → `<Pressable onPress={() => navigation.navigate(...)}>`.
10. **Replace animations** — `motion.div` → `MotiView` with `from/animate/transition`. `AnimatePresence` is imported from `moti`.
11. **Wire to navigator** — register `FocusSessionScreen` in the appropriate stack/tab in `mobile/src/navigation/`.
12. **Test on device** — `npx expo start`, run on Android emulator + physical. Verify: load, scroll, every button, hardware back, dark mode, offline.

## 7. Common pitfalls for this page

- **Lists**: any web `.map()` rendering >10 items must become a `FlatList` (or `SectionList`) for performance.
- **Forms**: wrap in `KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'}` and `ScrollView keyboardShouldPersistTaps="handled"`.
- **Gradients**: `bg-gradient-to-r` is not supported by NativeWind — use `expo-linear-gradient` (`04-gradients-shadows.md`).
- **Shadows**: `shadow-lg` → `elevation` (Android) + `shadowOpacity/shadowRadius` (iOS). Use the helper in `01-design-system/04`.
- **Modals/Dialogs**: shadcn `Dialog` → RN `Modal` (`05-shared-components/09-Toasts-and-Modals.md`).
- **Toasts**: `toast()` calls keep working — re-export from a `burnt`-backed wrapper.

## 8. Acceptance checklist (don't ship without)

- [ ] Pixel-parity vs web on a 390×844 device (compare side-by-side screenshots).
- [ ] Cold-start to first paint < 2 s.
- [ ] Hardware back button does the right thing (close modal / pop / exit-confirm on root).
- [ ] All buttons trigger `Haptics.selectionAsync()` (or heavier per intent).
- [ ] Works in airplane mode for cached data (offline copy from MMKV).
- [ ] Light + dark mode both verified.
- [ ] No `console.error` / no red box on the screen.
