# 04 — Study

> **Web source:** `src/pages/Study.tsx`  
> **RN target:** `src/screens/StudyScreen.tsx`  
> **Route name:** `Study`  
> **Nav type:** Tab  
> **Auth required:** Yes

## 0. One-liner

Study hub — entry to notes, AI tutor, flashcards, quizzes, exams, AI tools.

## 1. Web imports → mobile equivalents

Copy the data layer **verbatim** where possible. Swap UI imports per the table.

| Web import | Type | Mobile equivalent |
|---|---|---|
| `MathSolver` from `@/components/ai-tools/MathSolver` | component | port to `src/components/ai-tools/MathSolver.tsx` (RN) |
| `OCRToLatex` from `@/components/ai-tools/OCRToLatex` | component | port to `src/components/ai-tools/OCRToLatex.tsx` (RN) |
| `DiagramInterpreter` from `@/components/ai-tools/DiagramInterpreter` | component | port to `src/components/ai-tools/DiagramInterpreter.tsx` (RN) |
| `CodeDebugger` from `@/components/ai-tools/CodeDebugger` | component | port to `src/components/ai-tools/CodeDebugger.tsx` (RN) |
| `LanguageTranslator` from `@/components/ai-tools/LanguageTranslator` | component | port to `src/components/ai-tools/LanguageTranslator.tsx` (RN) |
| `YouTubeSummarizer` from `@/components/ai-tools/YouTubeSummarizer` | component | port to `src/components/ai-tools/YouTubeSummarizer.tsx` (RN) |
| `BookScanner` from `@/components/ai-tools/BookScanner` | component | port to `src/components/ai-tools/BookScanner.tsx` (RN) |
| `LectureRecorder` from `@/components/ai-tools/LectureRecorder` | component | port to `src/components/ai-tools/LectureRecorder.tsx` (RN) |
| `FillBlanks` from `@/components/study/FillBlanks` | component | port to `src/components/study/FillBlanks.tsx` (RN) |
| `MockExam` from `@/components/study/MockExam` | component | port to `src/components/study/MockExam.tsx` (RN) |
| `CramMode` from `@/components/study/CramMode` | component | port to `src/components/study/CramMode.tsx` (RN) |
| `MnemonicGenerator` from `@/components/study/MnemonicGenerator` | component | port to `src/components/study/MnemonicGenerator.tsx` (RN) |
| `AudioNotes` from `@/components/study/AudioNotes` | component | port to `src/components/study/AudioNotes.tsx` (RN) |
| `VoiceMode` from `@/components/study/VoiceMode` | component | port to `src/components/study/VoiceMode.tsx` (RN) |
| `DebatePartner` from `@/components/study/DebatePartner` | component | port to `src/components/study/DebatePartner.tsx` (RN) |
| `CheatSheetCreator` from `@/components/study/CheatSheetCreator` | component | port to `src/components/study/CheatSheetCreator.tsx` (RN) |
| `ConceptLinking` from `@/components/study/ConceptLinking` | component | port to `src/components/study/ConceptLinking.tsx` (RN) |
| `EssayGrader` from `@/components/academic/EssayGrader` | component | port to `src/components/academic/EssayGrader.tsx` (RN) |
| `PlagiarismChecker` from `@/components/academic/PlagiarismChecker` | component | port to `src/components/academic/PlagiarismChecker.tsx` (RN) |
| `CitationMachine` from `@/components/academic/CitationMachine` | component | port to `src/components/academic/CitationMachine.tsx` (RN) |
| `BibliographyBuilder` from `@/components/academic/BibliographyBuilder` | component | port to `src/components/academic/BibliographyBuilder.tsx` (RN) |
| `ResearchAssistant` from `@/components/academic/ResearchAssistant` | component | port to `src/components/academic/ResearchAssistant.tsx` (RN) |
| `ThesisGenerator` from `@/components/academic/ThesisGenerator` | component | port to `src/components/academic/ThesisGenerator.tsx` (RN) |
| `DailyChallenges` from `@/components/gamification/DailyChallenges` | component | port to `src/components/gamification/DailyChallenges.tsx` (RN) |
| `BookOpen, Brain, FileText, Sparkles, Timer, Calculator, Sigma, Microscope, Bug, Languages, Youtube, Mic, Zap, ClipboardList, GraduationCap, Lightbulb, Volume2, MessageCircle, Swords, FileCheck, Network, Shield, Quote, Search, Target` (lucide) | icons | swap import to `lucide-react-native` |
| `motion` (framer-motion) | animation | rewrite with `moti` + `react-native-reanimated` |
| `Link` from `react-router-dom` | other | @react-navigation/native (useNavigation, useRoute) |

## 2. Connected sub-components (port these too)

This screen consumes components from the directories below. Every file listed must be ported to the mobile codebase under the same path (`src/components/<dir>/<Name>.tsx`) using RN primitives + NativeWind.

### `src/components/academic/`

- `BibliographyBuilder.tsx`
- `CitationMachine.tsx`
- `EssayGrader.tsx`
- `PlagiarismChecker.tsx`
- `ResearchAssistant.tsx`
- `ThesisGenerator.tsx`

### `src/components/ai-tools/`

- `AIToolLayout.tsx`
- `BookScanner.tsx`
- `CodeDebugger.tsx`
- `DiagramInterpreter.tsx`
- `ImageUpload.tsx`
- `LanguageTranslator.tsx`
- `LectureRecorder.tsx`
- `MathSolver.tsx`
- `OCRToLatex.tsx`
- `YouTubeSummarizer.tsx`

### `src/components/gamification/`

- `DailyChallenges.tsx`
- `DailyQuizChallenge.tsx`

### `src/components/study/`

- `AudioNotes.tsx`
- `CheatSheetCreator.tsx`
- `ConceptLinking.tsx`
- `CramMode.tsx`
- `DebatePartner.tsx`
- `FillBlanks.tsx`
- `MnemonicGenerator.tsx`
- `MockExam.tsx`
- `PomodoroTimer.tsx`
- `StreakCalendar.tsx`
- `StudyStatistics.tsx`
- `VoiceMode.tsx`

## 3. Tailwind classNames preserved from web

These exact class strings appear in the web page. **Re-use them verbatim** in the RN `className=` (NativeWind v4 understands the same Tailwind grammar). Anything Tailwind-only-for-web (see `_APPENDIX/C-css-to-style-map.md`) must be swapped, but everything below is portable as-is.

```text
grid grid-cols-2 gap-3
p-4 rounded-2xl bg-card border border-border text-left hover:border-primary/50 transition-all
w-10 h-10 rounded-xl flex items-center justify-center mb-2
font-semibold text-foreground text-sm
text-xs text-muted-foreground
p-6 space-y-6 pb-24
text-2xl font-display font-bold text-foreground
text-muted-foreground text-sm mt-1
mt-2
p-4 rounded-2xl border border-primary/30 gradient-primary text-primary-foreground flex items-center gap-4
text-3xl
flex-1
font-display font-bold text-base
text-xs opacity-90
opacity-80
p-4 rounded-2xl border border-border/50 bg-card
text-lg font-display font-semibold text-foreground pt-2
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

1. Create `src/screens/StudyScreen.tsx` — copy every hook call from the web page verbatim.
2. Render a stub `<View><Text>Study</Text></View>` and verify the route works in the navigator.
3. Port each connected sub-component listed in §2 — one commit per component.
4. Assemble the layout top-to-bottom following §4.
5. Add animations LAST (only once layout is pixel-correct).
6. Run the §10 acceptance checklist before marking done.
