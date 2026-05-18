# FileUpload-and-MediaUpload — FileUpload + MediaUpload

> **Web source:** `src/components/notes/FileUpload.tsx`, `src/components/chat/MediaUpload.tsx`
> **RN target:** same paths

## File types supported

PDF, DOCX, PPTX, XLSX, MD, TXT, JPG, PNG, MP3, WAV, M4A.

## Pickers

- **Documents:** `expo-document-picker`
- **Images / video:** `expo-image-picker` (camera + library)
- **Audio recording:** `expo-av` `Recording`

## Flow

1. User taps attach → bottom sheet with options (Document / Image / Camera / Audio)
2. Pick file → validate size (<20MB) + type
3. Compress images (`expo-image-manipulator`, quality 0.8, maxWidth 2048)
4. Upload to Supabase Storage: `supabase.storage.from('notes' | 'chat-media').upload(path, file)`
5. Get public URL or signed URL
6. Insert DB row with reference

## Progress

Show progress bar overlay. Upload via `XMLHttpRequest` to access `onUploadProgress` (Supabase JS doesn't expose it natively in RN — use direct REST).

```ts
const xhr = new XMLHttpRequest();
xhr.upload.onprogress = (e) => setProgress(e.loaded / e.total);
xhr.open('POST', `${url}/storage/v1/object/${bucket}/${path}`);
xhr.setRequestHeader('Authorization', `Bearer ${token}`);
xhr.send(formData);
```

## Offline queueing

If offline, write file to local FS (`expo-file-system`) and enqueue via offlineSync. Drain on reconnect.

## Native enhancements

- Multi-select images (`allowsMultipleSelection: true`)
- HEIC → JPEG conversion (manipulator)
- Permissions UX: rationale dialog before requesting

## Acceptance
- [ ] All 10 file types work
- [ ] Progress visible
- [ ] Offline queue + sync works
- [ ] Large files chunk-upload without OOM

<!-- STYLES_APPENDIX -->

## Styles & className mapping (NativeWind v4)

These are the **exact Tailwind class strings** used by the web counterpart(s). NativeWind v4 understands the same grammar — copy them straight into your RN component's `className=` and only swap the web-only utilities listed in `_APPENDIX/C-css-to-style-map.md` (e.g. `hover:*`, `backdrop-blur-*`, `transition-*` for non-Reanimated transitions).


### From `src/components/notes/FileUpload.tsx`

```text
space-y-3
hidden
w-full p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground disabled:opacity-50
w-6 h-6
text-sm font-medium
text-xs
p-3 rounded-xl bg-muted flex items-center gap-3
w-5 h-5 animate-spin text-primary
w-5 h-5 text-primary
flex-1 min-w-0
text-sm font-medium text-foreground truncate
text-xs text-muted-foreground
h-8 w-8
w-4 h-4

### From `src/components/chat/MediaUpload.tsx`

```text
shrink-0
w-5 h-5 animate-spin
w-5 h-5
```

### Conversion checklist

- Keep colour utilities (`bg-primary`, `text-foreground`, `border-border/50`) — defined in `01-design-system/01-colors-tokens.md`.
- Keep spacing, sizing, radius, flex, grid (when supported by NativeWind).
- Replace `hover:*` → use `Pressable`'s `pressed` state or Reanimated.
- Replace `backdrop-blur-*` → `expo-blur` `<BlurView>`.
- Replace `transition-*` / `animate-*` → Moti / Reanimated.
- Replace `cursor-*`, `select-*`, `pointer-events-*` → not needed on RN.
- Replace `grid grid-cols-N gap-X` → `<View className="flex-row flex-wrap gap-X">` or `FlashList numColumns={N}`.
