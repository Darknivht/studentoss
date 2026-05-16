# 14 — Store

> **Web source of truth:** `src/pages/Store.tsx`
> **RN target:** `src/screens/StoreScreen.tsx`
> **Route name:** `Store`
> **Auth:** Required
> **Bottom nav visible:** Yes

---

## 1. Purpose

Resource store: textbooks, past papers, summaries, YouTube playlists. Filtered by grade level.

## 2. Data dependencies

Open the web file and copy **every hook call** into the RN screen unchanged. The data layer does not change.

- `supabase.from('resources').select().eq('active', true)`
- Filter by user's `education_level` and `grade`
- `supabase.storage.from('resources').download(...)` for purchased items

## 3. Layout (top → bottom)

1. Header + search
2. Filter row: subject / type / grade chips
3. Featured banner carousel
4. 'YouTube Picks' horizontal scroll
5. Resource grid (2 cols)

## 4. Component tree mapping

| Web element | RN replacement | Notes |
|---|---|---|
| ResourceCard | port; thumbnail + title + price/Free badge | |
| YouTubeSection | thumbnail + title; tap → in-app browser via `expo-web-browser` | |
| filter chip row | scrollable horizontal | |

## 5. Animations

- Carousel auto-advances every 5s with fade
- Cards stagger on filter change
- 'Added to library' check animation

## 6. Interactions & navigation

- Tap card → detail modal (preview + buy/download)
- Download progress bar in card
- 'My Library' tab to see downloaded

## 7. Edge cases (MUST handle)

- Locked by grade level → show 'Available for {grade}'
- Large file download → background download via `expo-file-system` with progress
- Storage full → toast 'Free up space'

## 8. Native enhancements (mobile-only wins)

- Background downloads
- 'Open with' for downloaded PDFs (`expo-sharing`)

## 9. Performance

- Wrap large lists in `FlashList` (Shopify) instead of `FlatList` when item count > 50.
- Memoize cards with `React.memo` and stable keys.
- Hoist `renderItem` out of render; never inline arrow inside `FlatList`.
- Use `removeClippedSubviews` on long scroll views.
- Defer offscreen image loads with `expo-image` `priority="low"`.

## 10. Acceptance checklist

- [ ] Grade filter works
- [ ] Downloads complete in background
- [ ] Lightbox PDF preview works

## 11. Implementation order (for the agent)

1. Create the screen file with hooks copied verbatim from the web page.
2. Render a bare `<View>` with a `<Text>` of the title — verify route works.
3. Port the header / hero section.
4. Port each section top-to-bottom, one commit per section.
5. Wire animations LAST (only after layout is correct).
6. Test offline, slow 3G, and dark mode before marking done.

