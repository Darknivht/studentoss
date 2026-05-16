# 13 — Chat & GroupChat

> **Web source of truth:** `src/pages/Chat.tsx`
> **RN target:** `src/screens/ChatScreen + GroupChatScreen.tsx`
> **Route name:** `Chat (params: { peerId }) and GroupChat (params: { groupId })`
> **Auth:** Required
> **Bottom nav visible:** No (full-screen chat)

---

## 1. Purpose

1:1 and group messaging with images, replies, realtime. Lightbox for media.

## 2. Data dependencies

Open the web file and copy **every hook call** into the RN screen unchanged. The data layer does not change.

- `supabase.from('messages').select().eq(...).order('created_at')`
- Realtime channel `supabase.channel('messages:'+threadId).on('postgres_changes', ...)`
- `supabase.storage.from('chat-media').upload(...)`

## 3. Layout (top → bottom)

Header: peer/group name + avatar + back. Messages list (inverted FlatList). Input bar: + (attach) | text input | send. Reply preview above input when replying.

## 4. Component tree mapping

| Web element | RN replacement | Notes |
|---|---|---|
| message bubble | own=right primary, other=left card; group shows sender name on first of consecutive | tap-and-hold = reply / copy / delete |
| media | inline thumbnail; tap → `react-native-image-viewing` lightbox | |
| reply preview | quoted bubble above input | tap X to cancel |
| typing indicator | broadcast on channel | |

## 5. Animations

- New message slide-up
- Long-press → bubble lifts + actions menu appears (Reanimated)
- Reply scroll-to-message: scroll then flash the quoted bubble (background tween)

## 6. Interactions & navigation

- ScrollIntoView for reply tap (use `scrollToIndex` on FlatList, with `getItemLayout`)
- Image picker via `expo-image-picker`
- Voice message: hold mic to record
- Read receipts update via realtime

## 7. Edge cases (MUST handle)

- Pending message (no network) → grey clock icon, retry on reconnect
- Group member limit by tier (see memory)
- Blocked user: messages hidden, send disabled
- Very long thread: paginate (`from-to` chunks of 50)

## 8. Native enhancements (mobile-only wins)

- Push notification on new message (deep link to thread)
- Image picker, camera, voice recording
- Background image upload

## 9. Performance

- Wrap large lists in `FlashList` (Shopify) instead of `FlatList` when item count > 50.
- Memoize cards with `React.memo` and stable keys.
- Hoist `renderItem` out of render; never inline arrow inside `FlatList`.
- Use `removeClippedSubviews` on long scroll views.
- Defer offscreen image loads with `expo-image` `priority="low"`.

## 10. Acceptance checklist

- [ ] Realtime updates within 500ms
- [ ] Image upload + lightbox works
- [ ] Reply scrolls + highlights
- [ ] Push notifs deep-link correctly

## 11. Implementation order (for the agent)

1. Create the screen file with hooks copied verbatim from the web page.
2. Render a bare `<View>` with a `<Text>` of the title — verify route works.
3. Port the header / hero section.
4. Port each section top-to-bottom, one commit per section.
5. Wire animations LAST (only after layout is correct).
6. Test offline, slow 3G, and dark mode before marking done.

