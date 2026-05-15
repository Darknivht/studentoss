# 03 — Dashboard

**Web reference:** `src/pages/Dashboard.tsx`

The home screen — the most important visual port. Every existing user sees this first.

## Sections (top→bottom, matches web)

1. **Header** — Avatar (top-left, push to Profile) + greeting "Hi, {name} 👋" + dark-mode toggle (top-right)
2. **Announcement banner** (if active) — `AnnouncementBanner` component
3. **Streak card** — flame icon, current streak number, longest streak subtitle, gradient background
4. **Stats grid** (2×2) — Notes, Quizzes, Flashcards, Focus minutes (today)
5. **Continue learning** — horizontal scroll of recent courses
6. **Quick actions** — 3-up grid: AI Tutor, Smart Notes, Flashcards
7. **Today's challenge** — DailyQuizChallenge card
8. **Weekly XP progress** — bar graph
9. **Achievements preview** — 3 most-recent unlocked

## Layout

```tsx
<ScrollView refreshControl={<RefreshControl ... />} className="flex-1 bg-background">
  <View className="p-4 gap-4">
    <Header />
    <AnnouncementBanner />
    <StreakCard streak={profile.current_streak} longest={profile.longest_streak} />
    <View className="flex-row flex-wrap gap-3">
      <StatsCard label="Notes today"      value={notesToday}      Icon={FileText} />
      <StatsCard label="Quizzes today"    value={quizzesToday}    Icon={Brain} />
      <StatsCard label="Cards reviewed"   value={cardsToday}      Icon={Layers} />
      <StatsCard label="Focus minutes"    value={focusToday}      Icon={Timer} />
    </View>
    <ContinueLearning courses={recentCourses} />
    <QuickActions />
    <DailyChallenges />
    <WeeklyXPWidget />
    <AchievementsPreview />
  </View>
</ScrollView>
```

`StatsCard` width: `w-[48%]` to fit 2 per row.

## StreakCard visual

Same as web: `<Gradient preset="warning">`, `rounded-3xl p-5`, big flame `🔥` 48px, streak number `font-display text-5xl text-white`.

## Hooks used (verbatim ports)

- `useAuth` — profile data
- `useStudyTimeTracker` — focus minutes today
- `useWeeklyXP` — graph data
- `useAchievements` — recent unlocks
- `useCourseProgress` — recent courses

## Pull-to-refresh

Refreshes profile, streaks, weekly XP via React Query `invalidateQueries`.

## Animations

- Each card fades+rises on first mount (Moti staggered, 60ms delay each)
- Streak number animates up with `Animated.spring` when it changes

## Acceptance

- [ ] Pixel-match with web Dashboard
- [ ] Pull-to-refresh works
- [ ] Tapping a course pushes CoursePage with correct id
