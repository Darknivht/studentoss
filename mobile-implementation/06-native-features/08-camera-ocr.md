# camera-ocr — Camera OCR

## Use case
Scan handwritten notes, textbook pages, whiteboards → extract text → create note.

## Flow
1. `expo-camera` preview with capture button + multi-page mode
2. On capture: crop with `expo-image-manipulator` (or detect document edges via `react-native-document-scanner-plugin`)
3. Upload page(s) to Supabase Storage
4. Invoke `extract-pdf-text-ocr` edge function (which uses Tesseract / Google Vision)
5. Receive text → create note with original images attached

## UI

Camera screen:
- Live preview full-bleed
- Edge detection overlay (green border when document detected)
- Capture button (bottom center)
- Flash toggle, flip camera, page count indicator
- 'Done' button when ≥1 page captured

Review screen:
- Carousel of captured pages
- Reorder via drag
- Delete page
- 'Process' button

## Permissions
`expo-camera` requests `CAMERA` runtime perm. Provide rationale.

## Performance
Compress to 1600px max width before upload (`expo-image-manipulator`).

## Acceptance
- [ ] Multi-page scan works
- [ ] Edge detection visible
- [ ] OCR returns text within 10s for 3 pages

