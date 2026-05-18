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

<!-- STYLES_APPENDIX -->

## Styles & className mapping (NativeWind v4)

These are the **exact Tailwind class strings** used by the web counterpart(s). NativeWind v4 understands the same grammar — copy them straight into your RN component's `className=` and only swap the web-only utilities listed in `_APPENDIX/C-css-to-style-map.md` (e.g. `hover:*`, `backdrop-blur-*`, `transition-*` for non-Reanimated transitions).


### From `src/components/subscription/FeatureGateDialog.tsx`

```text
max-w-sm mx-auto
text-center
w-20 h-20 mx-auto relative mb-3
w-20 h-20 -rotate-90
transition-all duration-500
absolute inset-0 flex items-center justify-center
w-6 h-6 text-destructive
text-lg
text-sm
font-bold text-foreground
space-y-4 py-2
grid grid-cols-3 gap-2 text-center
text-muted-foreground flex items-center justify-center gap-1
w-3 h-3 text-primary
w-full gradient-primary text-primary-foreground
w-4 h-4 mr-2
w-full

### From `src/components/subscription/UpgradePrompt.tsx`

```text
p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between
flex items-center gap-2
w-4 h-4 text-amber-500
text-sm text-foreground
bg-amber-500 hover:bg-amber-600 text-white
w-3 h-3 mr-1
p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-orange-500/10 border border-amber-500/30 text-center
w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-4
w-8 h-8 text-white
text-lg font-semibold text-foreground mb-2
text-sm text-muted-foreground mb-4
gradient-primary text-primary-foreground
```

### Conversion checklist

- Keep colour utilities (`bg-primary`, `text-foreground`, `border-border/50`) — defined in `01-design-system/01-colors-tokens.md`.
- Keep spacing, sizing, radius, flex, grid (when supported by NativeWind).
- Replace `hover:*` → use `Pressable`'s `pressed` state or Reanimated.
- Replace `backdrop-blur-*` → `expo-blur` `<BlurView>`.
- Replace `transition-*` / `animate-*` → Moti / Reanimated.
- Replace `cursor-*`, `select-*`, `pointer-events-*` → not needed on RN.
- Replace `grid grid-cols-N gap-X` → `<View className="flex-row flex-wrap gap-X">` or `FlashList numColumns={N}`.
