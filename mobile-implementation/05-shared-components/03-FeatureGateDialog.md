# FeatureGateDialog — FeatureGateDialog

> **Web source:** `src/components/subscription/FeatureGateDialog.tsx`
> **RN target:** same path

## Purpose

Modal shown when a free/plus user attempts a Pro-only or quota-exceeded action.

## API

```ts
showFeatureGate({
  feature: 'AI Tutor',
  reason: 'quota' | 'tier',
  requiredTier: 'plus' | 'pro',
  currentTier: 'free' | 'plus',
  onUpgrade?: () => void,   // defaults to navigate('Upgrade')
});
```

Exposed via a global `FeatureGateProvider` at the root, with `useFeatureGate()` hook.

## Animations

- Backdrop fades in (200ms)
- Sheet slides up with spring (damping=18)
- Sparkle particles around the locked feature icon (Moti loop)
- Lock icon rotates 360° once on mount

## Layout

1. Sparkle-surrounded icon (large)
2. Title: "Unlock {Feature}"
3. Description (tier-specific copy)
4. Bullet list: 3 highlights of the target tier
5. CTA: "Upgrade to {Tier}" (gradient)
6. Secondary: "Maybe later"

## Tier-specific copy

| Reason | Free → Plus | Free → Pro | Plus → Pro |
|---|---|---|---|
| quota | "You've used your daily AI quota. Plus gives you 30/day." | "...Pro gives you 100/day." | "...Pro gives you 100/day." |
| tier | "{Feature} is a Plus feature." | "{Feature} is a Pro feature." | "{Feature} is a Pro feature." |

## Acceptance
- [ ] Dialog reachable from any quota check
- [ ] Upgrade button navigates to Upgrade screen with selected tier
- [ ] Animations smooth, no jank

