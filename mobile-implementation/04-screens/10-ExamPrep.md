# 10 — ExamPrep

> **Web source:** `src/pages/ExamPrep.tsx`  
> **RN target:** `src/screens/ExamPrepScreen.tsx`  
> **Route name:** `ExamPrep`  
> **Nav type:** Nested stack (Selector→Subject→Topic→Practice→Review)  
> **Auth required:** Yes

## 0. One-liner

JAMB/WAEC/NECO/Post-UTME practice + mock CBT.

## 1. Web imports → mobile equivalents

Copy the data layer **verbatim** where possible. Swap UI imports per the table.

| Web import | Type | Mobile equivalent |
|---|---|---|
| `useSubscription` from `@/hooks/useSubscription` | hook | **keep as-is** (data hooks are platform-agnostic) |
| `ExamSelector` from `@/components/exam-prep/ExamSelector` | component | port to `src/components/exam-prep/ExamSelector.tsx` (RN) |
| `SubjectSelector` from `@/components/exam-prep/SubjectSelector` | component | port to `src/components/exam-prep/SubjectSelector.tsx` (RN) |
| `PracticeSession` from `@/components/exam-prep/PracticeSession` | component | port to `src/components/exam-prep/PracticeSession.tsx` (RN) |
| `MockExamMode` from `@/components/exam-prep/MockExamMode` | component | port to `src/components/exam-prep/MockExamMode.tsx` (RN) |
| `ExamPerformance` from `@/components/exam-prep/ExamPerformance` | component | port to `src/components/exam-prep/ExamPerformance.tsx` (RN) |
| `WeaknessReport` from `@/components/exam-prep/WeaknessReport` | component | port to `src/components/exam-prep/WeaknessReport.tsx` (RN) |
| `TopicSelector` from `@/components/exam-prep/TopicSelector` | component | port to `src/components/exam-prep/TopicSelector.tsx` (RN) |
| `MultiSubjectCBT` from `@/components/exam-prep/MultiSubjectCBT` | component | port to `src/components/exam-prep/MultiSubjectCBT.tsx` (RN) |
| `YearSelector` from `@/components/exam-prep/YearSelector` | component | port to `src/components/exam-prep/YearSelector.tsx` (RN) |
| `BookmarkedQuestions` from `@/components/exam-prep/BookmarkedQuestions` | component | port to `src/components/exam-prep/BookmarkedQuestions.tsx` (RN) |
| `StudyPlanView` from `@/components/exam-prep/StudyPlanView` | component | port to `src/components/exam-prep/StudyPlanView.tsx` (RN) |
| `GuidedLearning` from `@/components/exam-prep/GuidedLearning` | component | port to `src/components/exam-prep/GuidedLearning.tsx` (RN) |
| `FeatureGateDialog` from `@/components/subscription/FeatureGateDialog` | component | port to `src/components/subscription/FeatureGateDialog.tsx` (RN) |
| `ArrowLeft` (lucide) | icons | swap import to `lucide-react-native` |
| `motion` (framer-motion) | animation | rewrite with `moti` + `react-native-reanimated` |
| `useNavigate` from `react-router-dom` | other | @react-navigation/native (useNavigation, useRoute) |

## 2. Connected sub-components (port these too)

This screen consumes components from the directories below. Every file listed must be ported to the mobile codebase under the same path (`src/components/<dir>/<Name>.tsx`) using RN primitives + NativeWind.

### `src/components/exam-prep/`

- `BookmarkedQuestions.tsx`
- `ExamPerformance.tsx`
- `ExamSelector.tsx`
- `GuidedLearning.tsx`
- `MockExamMode.tsx`
- `MultiSubjectCBT.tsx`
- `PracticeSession.tsx`
- `SessionReview.tsx`
- `StudyPlanView.tsx`
- `SubjectSelector.tsx`
- `TopicSelector.tsx`
- `WeaknessReport.tsx`
- `YearSelector.tsx`

### `src/components/subscription/`

- `FeatureGateDialog.tsx`
- `UpgradePrompt.tsx`

## 3. Tailwind classNames preserved from web

These exact class strings appear in the web page. **Re-use them verbatim** in the RN `className=` (NativeWind v4 understands the same Tailwind grammar). Anything Tailwind-only-for-web (see `_APPENDIX/C-css-to-style-map.md`) must be swapped, but everything below is portable as-is.

```text
p-6 space-y-5 pb-24
flex items-center gap-3
text-primary
text-2xl font-display font-bold text-foreground
text-muted-foreground text-sm mt-0.5
```

## 4. Layout (top → bottom)

> Re-read the web JSX in the source file — the structure below is the canonical mobile order.

1. `SafeAreaView` root (`flex-1 bg-background`)
2. `StatusBar` themed to current colour scheme
3. Screen header (title + back / settings icons)
4. Scrollable body — port each section of the web JSX in source order
5. Floating action buttons / bottom-anchored CTA (if any)
6. Keyboard-aware wrapper (`KeyboardAvoidingView`) when the screen has inputs

## 5. Animations

Every `motion.div`/`AnimatePresence` in the web file maps to `<MotiView>` / `<AnimatePresence>` from `moti`. See `01-design-system/05-animations.md`.

- Mount fade-up: `from={{ opacity: 0, translateY: 8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 220 }}`
- Stagger lists: add `delay: index * 60` per item
- Press feedback: wrap `Pressable` in `Animated.View` with `useAnimatedStyle` scaling 1 → 0.97
- Page transitions: handled by React Navigation `slide_from_right` (iOS) / `slide_from_bottom` (Android modals)

## 6. Interactions & navigation

- Replace every `navigate('/x')` with `navigation.navigate('XScreen', params)`
- Replace every `<Link to>` with `<Pressable onPress={() => navigation.navigate(...)}>` (or `<TouchableOpacity>`)
- Hardware back button: handled globally in `useMobileBackNavigation` port — see `03-navigation/03-back-button-handling.md`
- Add haptic feedback (`expo-haptics`) on every primary tap

## 7. Edge cases (MUST handle)

- **Loading**: show skeleton matching final layout (use `moti-skeleton`)
- **Empty**: friendly illustration + primary CTA
- **Error / no network**: render cached data from MMKV, banner reads *Showing offline data*
- **Unauthorised**: redirect to `Auth` screen
- **Subscription-gated action**: wrap in `<FeatureGate tier="plus">` — see `05-shared-components/03-FeatureGateDialog.md`
- **Dark mode**: every colour must come from the design tokens, never hard-coded

## 8. Native enhancements (mobile-only wins)

- Pull-to-refresh on lists (`RefreshControl`)
- Swipe-back gesture (`gestureEnabled: true`)
- Share extensions where the web uses `navigator.share`
- Long-press → context menu via `@react-native-menu/menu`
- Tab-press scroll-to-top using `navigation.addListener('tabPress')`

## 9. Performance

- `FlashList` for any list > 50 rows
- `React.memo` every row component; stable keys
- Hoist `renderItem` out of the parent render
- `expo-image` with `cachePolicy='memory-disk'` for all images
- Defer animations until after first paint with `InteractionManager.runAfterInteractions`

## 10. Acceptance checklist

- [ ] Side-by-side screenshot vs web is visually indistinguishable
- [ ] All hooks fetch real data from Supabase
- [ ] Pull-to-refresh re-fetches
- [ ] Hardware-back behaves correctly
- [ ] Dark mode passes
- [ ] No console warnings (key prop, deprecated APIs)
- [ ] Subscription gates fire for the right tiers

## 11. Implementation order (for the agent)

1. Create `src/screens/ExamPrepScreen.tsx` — copy every hook call from the web page verbatim.
2. Render a stub `<View><Text>ExamPrep</Text></View>` and verify the route works in the navigator.
3. Port each connected sub-component listed in §2 — one commit per component.
4. Assemble the layout top-to-bottom following §4.
5. Add animations LAST (only once layout is pixel-correct).
6. Run the §10 acceptance checklist before marking done.
