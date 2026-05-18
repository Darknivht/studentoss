# Charts — Charts

> **Web source:** Recharts-based charts in Dashboard, Profile, Performance screens
> **RN target:** `src/components/charts/*`

## Library choice

**Primary:** `victory-native` (XL version, uses Skia — buttery smooth, supports same chart types as Recharts).
**Alternative:** `react-native-gifted-charts` (simpler API, less customizable).

## Charts to port

| Web chart | RN equivalent | Used in |
|---|---|---|
| Weekly XP bar chart | `VictoryBar` | Profile, Dashboard |
| Study time line chart | `VictoryLine` + `VictoryArea` | StudyTimeWidget |
| Exam performance pie | `VictoryPie` | ExamPerformance |
| Streak heatmap (calendar) | custom Skia or `react-native-calendar-heatmap` | StreakCard |
| Progress ring | custom `react-native-svg` Circle with Reanimated `useAnimatedProps` | CoursePage |

## Theming

Use semantic tokens for colors. Wrap charts in `useTheme` to swap palette on dark mode.

## Animations

All `victory-native` charts support `animate={{ duration: 800, easing: 'cubicOut' }}`. Stagger bar entrances.

## Performance

For >100 datapoints: pre-aggregate before rendering. Avoid re-rendering on parent state changes — wrap in `React.memo`.

## Acceptance
- [ ] All 5 chart types render with real data
- [ ] Dark mode swaps colors
- [ ] Animations smooth

<!-- STYLES_APPENDIX -->

## Styles & className mapping (NativeWind v4)

These are the **exact Tailwind class strings** used by the web counterpart(s). NativeWind v4 understands the same grammar — copy them straight into your RN component's `className=` and only swap the web-only utilities listed in `_APPENDIX/C-css-to-style-map.md` (e.g. `hover:*`, `backdrop-blur-*`, `transition-*` for non-Reanimated transitions).


### From `src/components/dashboard/StudyTimeWidget.tsx`

```text
flex items-center justify-between mb-3
flex items-center gap-2
w-4 h-4 text-emerald-500
w-4 h-4 text-primary
font-semibold text-sm text-foreground
text-xs text-muted-foreground
text-right
text-lg font-bold text-foreground
mt-3 flex items-center gap-2 text-xs
w-3 h-3 text-emerald-500
text-emerald-600 dark:text-emerald-400
w-3 h-3 text-amber-500
text-amber-600 dark:text-amber-400

### From `src/components/dashboard/StudyProgressWidget.tsx`

```text
p-5 rounded-2xl bg-card border border-border animate-pulse h-40
p-5 rounded-2xl bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 border border-border
flex items-center justify-between mb-4
font-display font-semibold text-foreground
text-xs
w-3 h-3 ml-1
grid grid-cols-2 gap-3
p-3 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors cursor-pointer
flex items-center gap-2 mb-1
text-2xl font-bold text-foreground
text-[10px] text-emerald-500 font-medium
w-4 h-4 text-blue-500
text-[10px] text-muted-foreground
col-span-2
p-3 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors cursor-pointer flex items-center justify-between
flex items-center gap-3
w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center
w-5 h-5 text-amber-500
font-medium text-foreground
w-4 h-4 text-muted-foreground

### From `src/components/planning/ProgressTracker.tsx`

```text
space-y-4
h-20 rounded-xl bg-muted animate-pulse
space-y-6
grid grid-cols-3 gap-3
space-y-3
font-medium flex items-center gap-2
text-center py-6 text-muted-foreground
w-10 h-10 mx-auto mb-2 opacity-30
text-sm
p-4 rounded-xl bg-card border border-border
flex items-center justify-between mb-2
w-3 h-3 rounded-full
font-medium
text-sm font-bold text-primary
h-2 mb-3
grid grid-cols-4 gap-2 text-center text-xs
text-muted-foreground
font-bold
p-3 rounded-xl bg-card border border-border text-center
w-8 h-8 mx-auto rounded-lg flex items-center justify-center mb-1
w-4 h-4
```

### Conversion checklist

- Keep colour utilities (`bg-primary`, `text-foreground`, `border-border/50`) — defined in `01-design-system/01-colors-tokens.md`.
- Keep spacing, sizing, radius, flex, grid (when supported by NativeWind).
- Replace `hover:*` → use `Pressable`'s `pressed` state or Reanimated.
- Replace `backdrop-blur-*` → `expo-blur` `<BlurView>`.
- Replace `transition-*` / `animate-*` → Moti / Reanimated.
- Replace `cursor-*`, `select-*`, `pointer-events-*` → not needed on RN.
- Replace `grid grid-cols-N gap-X` → `<View className="flex-row flex-wrap gap-X">` or `FlashList numColumns={N}`.
