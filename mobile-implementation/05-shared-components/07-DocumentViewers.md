# DocumentViewers — DocumentViewers (PDF, DOCX, etc.)

> **Web source:** `src/components/documents/PDFViewer.tsx`, `DOCXViewer.tsx`, `DocumentViewer.tsx`
> **RN target:** same paths

## Strategy: native first, WebView fallback

### PDF

Use `react-native-pdf` (mature, native rendering). Props: `source={{uri}}`, `enablePaging`, `onLoadComplete`, `onPageChanged`.
Add custom controls overlay: page indicator, zoom buttons, share, download.

```tsx
<Pdf source={{ uri }} onPageChanged={(p, total) => setPage(p)} style={{flex:1}} />
```

### DOCX

No good native lib. Strategy:
1. Call edge function `extract-pdf-text` variant that converts DOCX → HTML
2. Render via `react-native-render-html` or WebView

### PPTX

Convert to PDF via edge function (LibreOffice headless on a function) then render with PDF viewer.

### XLSX

Use `xlsx` package (pure JS works in RN) → render as `FlatList` of rows with horizontal scroll for columns.

### Markdown / TXT

Use MarkdownRenderer.

### Images

`expo-image` with pinch-zoom via `react-native-image-zoom-viewer`.

### Audio

`expo-av` `Sound` with custom playback UI (play/pause, scrubber, speed 0.5×–2×).

## Common viewer chrome

Header: file name, share, more menu (download, open externally).
Bottom: page indicator (PDF) or playback bar (audio).
Pinch-zoom for PDF & images. Swipe down to dismiss in modal mode.

## Acceptance
- [ ] All formats viewable
- [ ] Pinch-zoom works
- [ ] Share sheet integration via `expo-sharing`
- [ ] No crashes on large files (paginate)

