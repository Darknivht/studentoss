# 05 — SmartNotes

**Web reference:** `src/pages/SmartNotes.tsx`, components in `src/components/notes/*`

Notes list + create + open.

## Sections

- **Header**: search bar + filter (All / By course)
- **FAB (bottom-right)**: + button → bottom sheet with options (Type a note / Upload PDF / Upload DOCX / Photo of textbook)
- **List**: `FlatList` of `NoteCard` items grouped by course

## NoteCard

```tsx
<Pressable onPress={() => nav.navigate('NoteViewer', { id })}>
  <View className="bg-card rounded-2xl p-4 mb-3" style={shadow('elevated')}>
    <Text className="font-sans-semibold text-foreground">{title}</Text>
    <Text className="text-sm text-muted-foreground" numberOfLines={2}>{summary || content}</Text>
    <View className="flex-row gap-2 mt-2">
      <Badge>{course?.name ?? 'Uncategorized'}</Badge>
      <Badge variant="outline">{sourceType}</Badge>
    </View>
  </View>
</Pressable>
```

## File upload bottom sheet

```bash
npx expo install expo-document-picker
```

```ts
const res = await DocumentPicker.getDocumentAsync({ type: ['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','image/*','text/markdown','application/vnd.openxmlformats-officedocument.presentationml.presentation','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'] });
if (res.canceled) return;
const file = res.assets[0];
```

Upload via `supabase.storage.from('note-files').upload(path, fetch(file.uri).blob())` then call `extract-pdf-text` edge function with the URL.

## Note viewer dialog

Web has a dialog; on mobile push a full screen with content rendered as Markdown + math. Provide AI actions in a top bar: Summary, Quiz, Flashcards, Tutor about this note.

## Hooks

- React Query keyed `['notes', userId, courseId]`
- `useSubscription` for daily-notes quota gating

## Acceptance

- [ ] Upload PDF → text extracted → note created
- [ ] Upload PPTX/XLSX/MD also work via the existing `extract-pdf-text` (or add file branches matching web)
- [ ] Tapping a note opens viewer
