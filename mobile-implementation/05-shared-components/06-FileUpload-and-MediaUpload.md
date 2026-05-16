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

