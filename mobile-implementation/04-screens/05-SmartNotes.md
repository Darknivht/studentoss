# 05 — SmartNotes

> **Web source of truth:** `src/pages/SmartNotes.tsx`
> **RN target:** `src/screens/SmartNotesScreen.tsx`
> **Route name:** `SmartNotes`
> **Auth:** Required
> **Bottom nav visible:** Yes

---

## 1. Purpose

List, create, view, and AI-summarize notes. Supports text, PDF, DOCX, PPTX, XLSX, MD, image (OCR), audio uploads.

## 2. Data dependencies

Open the web file and copy **every hook call** into the RN screen unchanged. The data layer does not change.

- `supabase.from('notes').select('*').eq('user_id', user.id).order('created_at',{ascending:false})`
- `useSubscription()` for AI summary quota
- `useOfflineData('notes')` for cached list
- `useFileUpload()` (custom hook)

## 3. Layout (top → bottom)

1. Header + 'New Note' FAB (bottom-right, primary gradient)
2. Search bar + filter chips (All / Text / PDF / Audio)
3. Sort menu (Newest / Oldest / Alphabetical)
4. Note cards list (FlashList)
5. Pull-to-refresh
6. Bottom sheet for 'New Note' choice: Type / Upload File / Record Audio / Scan with Camera

## 4. Component tree mapping

| Web element | RN replacement | Notes |
|---|---|---|
| FAB | `<Pressable>` absolute positioned, with Moti scale on mount | |
| NoteCard | port `src/components/notes/NoteCard.tsx` | |
| Bottom sheet | `@gorhom/bottom-sheet` | |
| Camera scan | `expo-camera` + `extract-pdf-text-ocr` edge function | |

## 5. Animations

- FAB rotates 45° to ✕ when bottom sheet open
- Cards swipe-left reveals Delete (Reanimated `Swipeable`)
- New note added: card slides in from top

## 6. Interactions & navigation

- Tap card → NoteViewerDialog (port to full-screen modal screen `NoteViewer`)
- 'Summarize with AI' → calls `ai-study` edge function, shows AISummaryDialog
- Long-press → multi-select (delete many)

## 7. Edge cases (MUST handle)

- File >20MB → reject with toast
- OCR timeout (>30s) → fallback to text-only, banner 'OCR unavailable'
- Offline upload → queue via offlineSync, show pending badge
- Quota exhausted (free=5/day) → FeatureGateDialog

## 8. Native enhancements (mobile-only wins)

- `expo-document-picker` for file uploads
- `expo-camera` for scan
- `expo-av` for audio recording
- Background upload via `expo-background-fetch`

## 9. Performance

- Wrap large lists in `FlashList` (Shopify) instead of `FlatList` when item count > 50.
- Memoize cards with `React.memo` and stable keys.
- Hoist `renderItem` out of render; never inline arrow inside `FlatList`.
- Use `removeClippedSubviews` on long scroll views.
- Defer offscreen image loads with `expo-image` `priority="low"`.

## 10. Acceptance checklist

- [ ] All 6 input types create a note successfully
- [ ] AI summary works and respects quota
- [ ] Offline list visible without network
- [ ] Swipe-delete works

## 11. Implementation order (for the agent)

1. Create the screen file with hooks copied verbatim from the web page.
2. Render a bare `<View>` with a `<Text>` of the title — verify route works.
3. Port the header / hero section.
4. Port each section top-to-bottom, one commit per section.
5. Wire animations LAST (only after layout is correct).
6. Test offline, slow 3G, and dark mode before marking done.

