# Connections — `Study`

> Web source: `src/pages/Study.tsx`  
> Mobile spec: `mobile-implementation/04-screens/04-Study.md`

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
| `react-router-dom` | **REWRITE** | Swap to @react-navigation/native: useNavigate→navigation.navigate, useParams→route.params, Link→Pressable+navigate, Navigate→navigation.reset. |
| `lucide-react` | **REWRITE** | Swap to `lucide-react-native` — identical API. |
| `@/components/ai-tools/MathSolver` | **PORT** | Port to RN: keep AI streaming logic, swap UI primitives, use FlatList for chat. |
| `@/components/ai-tools/OCRToLatex` | **PORT** | Port to RN: keep AI streaming logic, swap UI primitives, use FlatList for chat. |
| `@/components/ai-tools/DiagramInterpreter` | **PORT** | Port to RN: keep AI streaming logic, swap UI primitives, use FlatList for chat. |
| `@/components/ai-tools/CodeDebugger` | **PORT** | Port to RN: keep AI streaming logic, swap UI primitives, use FlatList for chat. |
| `@/components/ai-tools/LanguageTranslator` | **PORT** | Port to RN: keep AI streaming logic, swap UI primitives, use FlatList for chat. |
| `@/components/ai-tools/YouTubeSummarizer` | **PORT** | Port to RN: keep AI streaming logic, swap UI primitives, use FlatList for chat. |
| `@/components/ai-tools/BookScanner` | **PORT** | Port to RN: keep AI streaming logic, swap UI primitives, use FlatList for chat. |
| `@/components/ai-tools/LectureRecorder` | **PORT** | Port to RN: keep AI streaming logic, swap UI primitives, use FlatList for chat. |
| `@/components/study/FillBlanks` | **PORT** | Port to RN: course cards/grids → FlatList numColumns. |
| `@/components/study/MockExam` | **PORT** | Port to RN: course cards/grids → FlatList numColumns. |
| `@/components/study/CramMode` | **PORT** | Port to RN: course cards/grids → FlatList numColumns. |
| `@/components/study/MnemonicGenerator` | **PORT** | Port to RN: course cards/grids → FlatList numColumns. |
| `@/components/study/AudioNotes` | **PORT** | Port to RN: course cards/grids → FlatList numColumns. |
| `@/components/study/VoiceMode` | **PORT** | Port to RN: course cards/grids → FlatList numColumns. |
| `@/components/study/DebatePartner` | **PORT** | Port to RN: course cards/grids → FlatList numColumns. |
| `@/components/study/CheatSheetCreator` | **PORT** | Port to RN: course cards/grids → FlatList numColumns. |
| `@/components/study/ConceptLinking` | **PORT** | Port to RN: course cards/grids → FlatList numColumns. |
| `@/components/academic/EssayGrader` | **PORT** | Port to RN: keep AI hooks, swap UI. |
| `@/components/academic/PlagiarismChecker` | **PORT** | Port to RN: keep AI hooks, swap UI. |
| `@/components/academic/CitationMachine` | **PORT** | Port to RN: keep AI hooks, swap UI. |
| `@/components/academic/BibliographyBuilder` | **PORT** | Port to RN: keep AI hooks, swap UI. |
| `@/components/academic/ResearchAssistant` | **PORT** | Port to RN: keep AI hooks, swap UI. |
| `@/components/academic/ThesisGenerator` | **PORT** | Port to RN: keep AI hooks, swap UI. |
| `@/components/gamification/DailyChallenges` | **PORT** | Port to RN: daily challenges → cards in ScrollView. |

Legend: **COPY** = paste verbatim · **PORT** = same logic, swap UI primitives · **REWRITE** = different RN library · **DROP** = not needed on mobile · **KEEP** = npm package, install RN-friendly variant.

## 3. Sub-components to (re)create for this screen

- `src/components/ai-tools/MathSolver.tsx` ✅ exists in web → create `mobile/src/components/ai-tools/MathSolver.tsx`
- `src/components/ai-tools/OCRToLatex.tsx` ✅ exists in web → create `mobile/src/components/ai-tools/OCRToLatex.tsx`
- `src/components/ai-tools/DiagramInterpreter.tsx` ✅ exists in web → create `mobile/src/components/ai-tools/DiagramInterpreter.tsx`
- `src/components/ai-tools/CodeDebugger.tsx` ✅ exists in web → create `mobile/src/components/ai-tools/CodeDebugger.tsx`
- `src/components/ai-tools/LanguageTranslator.tsx` ✅ exists in web → create `mobile/src/components/ai-tools/LanguageTranslator.tsx`
- `src/components/ai-tools/YouTubeSummarizer.tsx` ✅ exists in web → create `mobile/src/components/ai-tools/YouTubeSummarizer.tsx`
- `src/components/ai-tools/BookScanner.tsx` ✅ exists in web → create `mobile/src/components/ai-tools/BookScanner.tsx`
- `src/components/ai-tools/LectureRecorder.tsx` ✅ exists in web → create `mobile/src/components/ai-tools/LectureRecorder.tsx`
- `src/components/study/FillBlanks.tsx` ✅ exists in web → create `mobile/src/components/study/FillBlanks.tsx`
- `src/components/study/MockExam.tsx` ✅ exists in web → create `mobile/src/components/study/MockExam.tsx`
- `src/components/study/CramMode.tsx` ✅ exists in web → create `mobile/src/components/study/CramMode.tsx`
- `src/components/study/MnemonicGenerator.tsx` ✅ exists in web → create `mobile/src/components/study/MnemonicGenerator.tsx`
- `src/components/study/AudioNotes.tsx` ✅ exists in web → create `mobile/src/components/study/AudioNotes.tsx`
- `src/components/study/VoiceMode.tsx` ✅ exists in web → create `mobile/src/components/study/VoiceMode.tsx`
- `src/components/study/DebatePartner.tsx` ✅ exists in web → create `mobile/src/components/study/DebatePartner.tsx`
- `src/components/study/CheatSheetCreator.tsx` ✅ exists in web → create `mobile/src/components/study/CheatSheetCreator.tsx`
- `src/components/study/ConceptLinking.tsx` ✅ exists in web → create `mobile/src/components/study/ConceptLinking.tsx`
- `src/components/academic/EssayGrader.tsx` ✅ exists in web → create `mobile/src/components/academic/EssayGrader.tsx`
- `src/components/academic/PlagiarismChecker.tsx` ✅ exists in web → create `mobile/src/components/academic/PlagiarismChecker.tsx`
- `src/components/academic/CitationMachine.tsx` ✅ exists in web → create `mobile/src/components/academic/CitationMachine.tsx`
- `src/components/academic/BibliographyBuilder.tsx` ✅ exists in web → create `mobile/src/components/academic/BibliographyBuilder.tsx`
- `src/components/academic/ResearchAssistant.tsx` ✅ exists in web → create `mobile/src/components/academic/ResearchAssistant.tsx`
- `src/components/academic/ThesisGenerator.tsx` ✅ exists in web → create `mobile/src/components/academic/ThesisGenerator.tsx`
- `src/components/gamification/DailyChallenges.tsx` ✅ exists in web → create `mobile/src/components/gamification/DailyChallenges.tsx`

## 4. Hooks needed (mostly copy verbatim)

_No project hooks imported._

## 5. UI primitives required (build once, reuse)

_Uses only React Native built-ins._

## 6. Step-by-step build order (do these in sequence)

1. **Prereqs** — ensure the foundations are done: `00-foundation`, design tokens (`01-design-system`), Supabase client (`02-infrastructure/01`), navigation shell (`03-navigation`).
2. **Create the screen file** — `mobile/src/screens/StudyScreen.tsx`. Start from the matching `04-screens/04-Study.md` layout tree.
3. **Copy hooks & lib** listed in §4 into `mobile/src/hooks/` and `mobile/src/lib/`. Do not modify Supabase calls.
4. **Build any missing UI primitives** from §5 first — they are reused by other screens.
5. **Port each sub-component in §3** one at a time. Test each in isolation (Storybook-style — render it on a blank screen).
6. **Wire imports** — for every row in §2 with action REWRITE, replace the import line using the rule in the right column.
7. **Replace JSX primitives**: `div→View`, `span/p→Text`, `button→Pressable`, `input→TextInput`, `img→Image (expo-image)`, `a→Pressable` + `navigation.navigate`.
8. **Replace Tailwind classes** — keep the className string verbatim; NativeWind v4 understands the same tokens. Anything unsupported (hover:, focus-visible:, group-*) is dropped (see `_APPENDIX/C-css-to-style-map.md`).
9. **Replace navigation** — `useNavigate()` → `useNavigation()`, `useParams()` → `useRoute().params`, `<Link to>` → `<Pressable onPress={() => navigation.navigate(...)}>`.
10. **Replace animations** — `motion.div` → `MotiView` with `from/animate/transition`. `AnimatePresence` is imported from `moti`.
11. **Wire to navigator** — register `StudyScreen` in the appropriate stack/tab in `mobile/src/navigation/`.
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
