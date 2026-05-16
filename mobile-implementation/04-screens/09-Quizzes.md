# 09 — Quizzes

> **Web source of truth:** `src/pages/Quizzes.tsx`
> **RN target:** `src/screens/QuizzesScreen.tsx`
> **Route name:** `Quizzes`
> **Auth:** Required
> **Bottom nav visible:** Yes

---

## 1. Purpose

Generate quizzes from notes/topics, take MCQ/short-answer quizzes, review history, view explanations.

## 2. Data dependencies

Open the web file and copy **every hook call** into the RN screen unchanged. The data layer does not change.

- `supabase.from('quizzes').select()` & `quiz_attempts`
- `supabase.functions.invoke('ai-study', { body: { mode:'quiz', ... } })`
- `useSubscription()` for quota and max question limits

## 3. Layout (top → bottom)

**List:** tabs (My Quizzes / History) → cards with title, # questions, last score. FAB 'Generate Quiz'.
**Taking quiz:** question header (1/10) + question text + options (radio cards) + Next button. Timer top-right (optional).
**Results:** score circle + breakdown + per-question review with explanations.

## 4. Component tree mapping

| Web element | RN replacement | Notes |
|---|---|---|
| option card | `<Pressable>` with selected state ring | haptic on select |
| timer | circular SVG count-down | |
| results breakdown | list of question rows with ✓/✗ + tap to expand explanation | |

## 5. Animations

- Option selected → ring expands + check appears
- Wrong answer reveal → shake + red flash + reveal correct in green
- Score circle counts up from 0

## 6. Interactions & navigation

- Next button disabled until answer chosen (unless 'skip allowed')
- Submit triggers save attempt + navigate to results
- 'Retry quiz' / 'Explain again with AI' buttons on results

## 7. Edge cases (MUST handle)

- AI returns malformed JSON → use `parseAIResponse` from `lib/parseAIResponse.ts`
- User backs out mid-quiz → confirm 'Lose progress?'
- Question count > tier max → trim and warn

## 8. Native enhancements (mobile-only wins)

- Wake lock during quiz
- Hardware back = confirm exit
- Haptic on correct/wrong

## 9. Performance

- Wrap large lists in `FlashList` (Shopify) instead of `FlatList` when item count > 50.
- Memoize cards with `React.memo` and stable keys.
- Hoist `renderItem` out of render; never inline arrow inside `FlatList`.
- Use `removeClippedSubviews` on long scroll views.
- Defer offscreen image loads with `expo-image` `priority="low"`.

## 10. Acceptance checklist

- [ ] Generation works for note + topic
- [ ] Per-question explanations render
- [ ] History persists across sessions
- [ ] Tier limits enforced

## 11. Implementation order (for the agent)

1. Create the screen file with hooks copied verbatim from the web page.
2. Render a bare `<View>` with a `<Text>` of the title — verify route works.
3. Port the header / hero section.
4. Port each section top-to-bottom, one commit per section.
5. Wire animations LAST (only after layout is correct).
6. Test offline, slow 3G, and dark mode before marking done.

