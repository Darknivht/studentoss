# file-storage — File Storage

## Buckets
| Bucket | Purpose | Public? |
|---|---|---|
| `avatars` | User profile pictures | public |
| `notes` | Uploaded study materials | private (RLS) |
| `chat-media` | Chat attachments | private |
| `resources` | Store items | mixed (free=public, paid=signed URL) |
| `resumes` | Resume PDFs | private |

## RLS for private buckets
```sql
create policy "Users access own notes"
on storage.objects for all
to authenticated
using (bucket_id = 'notes' and (storage.foldername(name))[1] = auth.uid()::text);
```

## Upload from RN

`expo-file-system` reads file → convert to base64 or use FormData with file URI:

```ts
const formData = new FormData();
formData.append('file', { uri, name, type } as any);
await supabase.storage.from('notes').upload(`${userId}/${id}-${name}`, formData);
```

## Download for offline

```ts
const { data, signedUrl } = await supabase.storage.from('notes').createSignedUrl(path, 3600);
await FileSystem.downloadAsync(signedUrl, FileSystem.documentDirectory + filename);
```

Track downloaded files in MMKV; show 'Available offline' badge.

## Cache eviction
LRU: cap total downloaded files to 200MB. Evict oldest when exceeded.

## Acceptance
- [ ] Upload works on cellular + WiFi
- [ ] Signed URLs respect expiry
- [ ] Offline files openable without network

