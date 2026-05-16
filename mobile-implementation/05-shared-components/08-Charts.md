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

