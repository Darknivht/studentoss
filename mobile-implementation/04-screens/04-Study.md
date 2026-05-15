# 04 — Study (Hub)

**Web reference:** `src/pages/Study.tsx`

Hub screen listing all study tools as tappable cards.

## Layout

`ScrollView` with 2-column grid of feature cards. Each card: gradient background, icon top-left, title `font-display text-lg`, subtitle `text-sm text-muted-foreground`, `rounded-3xl p-4`.

## Cards (match web order)

| Card | Push to | Subscription |
|---|---|---|
| Smart Notes | `SmartNotes` | Free |
| AI Tutor | `AITutor` | Free (5/day Free, 30/day Plus, 100/day Pro) |
| Flashcards | `Flashcards` | Free |
| Quizzes | `Quizzes` | Free |
| Mock Exam | inside `Quizzes` | Plus |
| Cheat Sheet | (inside Course) | Plus |
| Audio Notes | (inside Course) | Plus |
| Mind Map | (inside Course) | Plus |
| Voice Mode | (inside Course) | Pro |
| Debate Partner | (inside Course) | Pro |
| Mnemonic Generator | (inside Course) | Plus |
| Fill Blanks | (inside Course) | Free |

Locked cards show a small lock icon + tier badge (e.g., "Plus"). Tapping locked card opens `Upgrade` modal with the right `requiredTier` prop (uses `FeatureGateDialog` semantics — see [`05-shared-components/03-FeatureGateDialog.md`](../05-shared-components/03-FeatureGateDialog.md)).

## Hooks

- `useSubscription()` — gate logic

## Animations

Cards stagger-in on mount.

## Acceptance

- [ ] All 12 tools appear
- [ ] Locked cards show correct gating
- [ ] Tapping each unlocked card navigates correctly
