# 08 — Flashcards

> **Web source of truth:** `src/pages/Flashcards.tsx`
> **RN target:** `src/screens/FlashcardsScreen.tsx`
> **Route name:** `Flashcards`
> **Auth:** Required
> **Bottom nav visible:** Yes

---

## 1. Purpose

Decks list + study session with flip animation + spaced repetition (SM-2 algorithm) + AI-generated decks.

## 2. Data dependencies

Open the web file and copy **every hook call** into the RN screen unchanged. The data layer does not change.

- `supabase.from('flashcard_decks').select('*, flashcards(count)')`
- `supabase.from('flashcards').select().eq('deck_id', deckId)`
- `useSubscription()` for AI-generation quota

## 3. Layout (top → bottom)

**Deck list:** header + 'Create Deck' FAB + grid of deck cards.
**Study session:** card centered, swipe controls (left=Again, up=Hard, right=Good, double-up=Easy), progress bar, exit button top-left.

## 4. Component tree mapping

| Web element | RN replacement | Notes |
|---|---|---|
| deck card | gradient card with deck name + due count badge | |
| flashcard | Reanimated `interpolate` rotateY 0→180 for flip | front/back text |
| swipe controls | `PanGestureHandler` with rotate + translate | colored overlay tint based on direction |

## 5. Animations

- Flip: 600ms `withTiming` rotateY
- Swipe: card follows finger, rotates ±15°, snaps to dismiss at 30% screen width
- Next card slides in from below with spring
- Progress bar fills with each card

## 6. Interactions & navigation

- Tap card → flip
- Swipe directions = SM-2 ratings, persist via `supabase.from('flashcard_reviews').insert(...)` and update `next_review_at`
- 'Generate with AI' → modal: choose note/topic → calls `ai-study` mode='flashcards'

## 7. Edge cases (MUST handle)

- Empty deck → 'Add cards' CTA
- No cards due → 'You're caught up! Next review in {time}'
- Mid-session app kill → resume from last unrated card (MMKV)

## 8. Native enhancements (mobile-only wins)

- Haptic on every swipe (Light)
- Wake lock during study session (`expo-keep-awake`)

## 9. Performance

- Wrap large lists in `FlashList` (Shopify) instead of `FlatList` when item count > 50.
- Memoize cards with `React.memo` and stable keys.
- Hoist `renderItem` out of render; never inline arrow inside `FlatList`.
- Use `removeClippedSubviews` on long scroll views.
- Defer offscreen image loads with `expo-image` `priority="low"`.

## 10. Acceptance checklist

- [ ] Flip animation smooth at 60fps
- [ ] SM-2 spacing correctly schedules next review
- [ ] AI generation produces valid deck
- [ ] Resume mid-session works

## 11. Implementation order (for the agent)

1. Create the screen file with hooks copied verbatim from the web page.
2. Render a bare `<View>` with a `<Text>` of the title — verify route works.
3. Port the header / hero section.
4. Port each section top-to-bottom, one commit per section.
5. Wire animations LAST (only after layout is correct).
6. Test offline, slow 3G, and dark mode before marking done.

