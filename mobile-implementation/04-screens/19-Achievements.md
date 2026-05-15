# 19-Achievements — Achievements

**Web reference:** `src/pages/Achievements.tsx`

## Summary
Grid of 50+ badges with locked/unlocked states. Use useAchievements hook. Tap badge to see requirement. Confetti on new unlock.

## Build steps

1. Read the web reference file end-to-end. Identify all hooks, state, JSX structure.
2. Replicate the JSX as RN: `<div>`→`<View>`, `<button>`→`<Pressable>`, scrollable→`<ScrollView>` or `<FlatList>`, lists→`<FlatList>`.
3. Convert all framer-motion to Moti (see [`01-design-system/05-animations.md`](../01-design-system/05-animations.md)).
4. Keep className strings — Nativewind handles them. Replace `hover:`, `backdrop-blur`, etc per [`_APPENDIX/C-css-to-style-map.md`](../_APPENDIX/C-css-to-style-map.md).
5. Reuse all hooks verbatim (they're in [`00-foundation/03-files-to-copy.md`](../00-foundation/03-files-to-copy.md)).
6. Wrap subscription-gated actions in `<FeatureGate tier="...">`.
7. Add haptic feedback on every primary tap.
8. Test in both light and dark mode.

## Visual parity checklist

- [ ] Header / title typography matches web
- [ ] All cards use same radius (`rounded-3xl` = 24px)
- [ ] Spacing matches web grid (`gap-3`, `p-4`)
- [ ] Empty states have same illustration + copy
- [ ] Loading states use same skeleton pattern
- [ ] Error toasts identical (use `sonner-native` or our `<Toast>`)

## Acceptance

- [ ] Side-by-side screenshot of mobile vs web is visually indistinguishable
- [ ] All hooks fetch real data from Supabase
- [ ] Navigation in/out works including hardware back
