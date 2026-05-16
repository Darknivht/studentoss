# 12 — Social

> **Web source of truth:** `src/pages/Social.tsx`
> **RN target:** `src/screens/SocialScreen.tsx`
> **Route name:** `Social`
> **Auth:** Required
> **Bottom nav visible:** Yes

---

## 1. Purpose

Friends, leaderboard, study groups, peer finder, challenges.

## 2. Data dependencies

Open the web file and copy **every hook call** into the RN screen unchanged. The data layer does not change.

- `supabase.from('friendships').select()` / `friend_requests`
- `supabase.from('study_groups').select()`
- `supabase.from('leaderboard_view').select()` (RPC or view)
- Realtime subscription on friend requests

## 3. Layout (top → bottom)

Top tabs: Friends | Groups | Leaderboard | Challenges | Discover. FAB for 'Add friend' / 'Create group' depending on tab.

## 4. Component tree mapping

| Web element | RN replacement | Notes |
|---|---|---|
| friend card | avatar + name + XP + actions | swipe-left for remove |
| leaderboard row | rank + avatar + name + score; highlight current user | top 3 with crown badges |
| group card | banner + name + member count + 'Join' | |

## 5. Animations

- Tab indicator slide
- New friend request appears with toast + slide-in from top
- Leaderboard crown bounce

## 6. Interactions & navigation

- Tap friend → profile modal
- Tap group → GroupChat
- Challenge friend → modal to pick quiz + opponent
- Realtime: friend request arrives → toast

## 7. Edge cases (MUST handle)

- Blocked users hidden from all queries (RLS handles)
- Group full (max members per tier) → 'Group full' badge
- Offline → cached leaderboard + 'updated 2h ago' label

## 8. Native enhancements (mobile-only wins)

- Contacts import to suggest friends (with explicit consent)
- Push notification on friend request / challenge

## 9. Performance

- Wrap large lists in `FlashList` (Shopify) instead of `FlatList` when item count > 50.
- Memoize cards with `React.memo` and stable keys.
- Hoist `renderItem` out of render; never inline arrow inside `FlatList`.
- Use `removeClippedSubviews` on long scroll views.
- Defer offscreen image loads with `expo-image` `priority="low"`.

## 10. Acceptance checklist

- [ ] All 5 tabs functional
- [ ] Realtime updates work
- [ ] Push notifications fire

## 11. Implementation order (for the agent)

1. Create the screen file with hooks copied verbatim from the web page.
2. Render a bare `<View>` with a `<Text>` of the title — verify route works.
3. Port the header / hero section.
4. Port each section top-to-bottom, one commit per section.
5. Wire animations LAST (only after layout is correct).
6. Test offline, slow 3G, and dark mode before marking done.

